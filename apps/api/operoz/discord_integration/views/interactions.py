from __future__ import annotations

import json
import logging

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from operoz.discord_integration.bgtasks.interaction_task import process_discord_slash_command
from operoz.discord_integration.security.signature import verify_discord_signature
from operoz.discord_integration.services.interactions import (
    INTERACTION_TYPE_APPLICATION_COMMAND,
    INTERACTION_TYPE_PING,
    build_deferred_response,
    build_ping_response,
    parse_application_command,
)

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class DiscordInteractionsEndpoint(APIView):
    """Endpoint público para interações Discord (PING + slash commands)."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get("X-Signature-Ed25519", "")
        timestamp = request.headers.get("X-Signature-Timestamp", "")
        public_key = getattr(settings, "DISCORD_PUBLIC_KEY", "")

        if not verify_discord_signature(
            public_key_hex=public_key,
            signature_hex=signature,
            timestamp=timestamp,
            body=raw_body,
        ):
            return Response({"error": "invalid request signature"}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return Response({"error": "invalid json"}, status=status.HTTP_400_BAD_REQUEST)

        interaction_type = payload.get("type")

        if interaction_type == INTERACTION_TYPE_PING:
            return Response(build_ping_response(), status=status.HTTP_200_OK)

        if interaction_type == INTERACTION_TYPE_APPLICATION_COMMAND:
            command, user_input = parse_application_command(payload)
            interaction_token = payload.get("token") or ""

            if not command:
                return Response(
                    {
                        "type": 4,
                        "data": {"content": "Comando não configurado no Operoz.", "flags": 64},
                    },
                    status=status.HTTP_200_OK,
                )

            if interaction_token:
                process_discord_slash_command.delay(
                    command_id=str(command.pk),
                    interaction_token=interaction_token,
                    user_input=user_input,
                )
            else:
                logger.warning("discord interaction missing token", extra={"command": command.name})

            return Response(build_deferred_response(), status=status.HTTP_200_OK)

        logger.info("unsupported discord interaction type", extra={"type": interaction_type})
        return Response({"error": "unsupported interaction type"}, status=status.HTTP_400_BAD_REQUEST)
