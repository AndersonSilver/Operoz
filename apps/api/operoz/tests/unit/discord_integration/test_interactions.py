from __future__ import annotations

import json
import time
from unittest.mock import patch

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from rest_framework.test import APIRequestFactory

from operoz.discord_integration.models import CustomSlashCommand
from operoz.discord_integration.security.signature import verify_discord_signature
from operoz.discord_integration.services.interactions import extract_user_prompt, resolve_slash_command
from operoz.discord_integration.views.interactions import DiscordInteractionsEndpoint


def _sign_request(private_key: Ed25519PrivateKey, body: bytes, timestamp: str | None = None) -> tuple[str, str]:
    ts = timestamp or str(int(time.time()))
    message = ts.encode("utf-8") + body
    signature = private_key.sign(message).hex()
    return ts, signature


def _public_key_hex(private_key: Ed25519PrivateKey) -> str:
    return (
        private_key.public_key()
        .public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        .hex()
    )


@pytest.mark.django_db
def test_verify_discord_signature_accepts_valid_payload():
    private_key = Ed25519PrivateKey.generate()
    body = b'{"type":1}'
    timestamp, signature = _sign_request(private_key, body)

    assert verify_discord_signature(
        public_key_hex=_public_key_hex(private_key),
        signature_hex=signature,
        timestamp=timestamp,
        body=body,
    )


def test_verify_discord_signature_rejects_tampered_body():
    private_key = Ed25519PrivateKey.generate()
    body = b'{"type":1}'
    timestamp, signature = _sign_request(private_key, body)

    assert not verify_discord_signature(
        public_key_hex=_public_key_hex(private_key),
        signature_hex=signature,
        timestamp=timestamp,
        body=b'{"type":2}',
    )


@pytest.mark.django_db
def test_resolve_slash_command_matches_guild_only(workspace):
    guild_command = CustomSlashCommand.objects.create(
        workspace=workspace,
        name="resumo",
        description="Resumo da squad",
        prompt_instructions="Gere um resumo.",
        guild_id="1234567890",
    )
    CustomSlashCommand.objects.create(
        workspace=workspace,
        name="resumo",
        description="Outro guild",
        prompt_instructions="Outro escopo.",
        guild_id="9999999999",
    )

    resolved = resolve_slash_command(command_name="resumo", guild_id="1234567890")
    assert resolved is not None
    assert resolved.pk == guild_command.pk


@pytest.mark.django_db
def test_resolve_slash_command_rejects_missing_guild_id(workspace):
    CustomSlashCommand.objects.create(
        workspace=workspace,
        name="resumo",
        description="Resumo da squad",
        prompt_instructions="Gere um resumo.",
        guild_id="1234567890",
    )

    assert resolve_slash_command(command_name="resumo", guild_id=None) is None


@pytest.mark.django_db
def test_resolve_slash_command_no_global_fallback(workspace):
    CustomSlashCommand.objects.create(
        workspace=workspace,
        name="global-cmd",
        description="Global legado",
        prompt_instructions="Não deve resolver.",
        guild_id=None,
    )

    assert resolve_slash_command(command_name="global-cmd", guild_id="111") is None


@pytest.mark.django_db
@patch("operoz.discord_integration.views.interactions.process_discord_slash_command")
def test_interactions_endpoint_defers_application_command(mock_task, settings, workspace):
    private_key = Ed25519PrivateKey.generate()
    settings.DISCORD_PUBLIC_KEY = _public_key_hex(private_key)

    CustomSlashCommand.objects.create(
        workspace=workspace,
        name="status",
        description="Status operacional",
        prompt_instructions="Resuma o status.",
        guild_id="999",
    )

    payload = {
        "type": 2,
        "token": "interaction-token",
        "guild_id": "999",
        "data": {"name": "status", "options": [{"name": "periodo", "value": "semana"}]},
    }
    body = json.dumps(payload).encode("utf-8")
    timestamp, signature = _sign_request(private_key, body)

    request = APIRequestFactory().post(
        "/api/discord/interactions/",
        data=body,
        content_type="application/json",
        HTTP_X_SIGNATURE_ED25519=signature,
        HTTP_X_SIGNATURE_TIMESTAMP=timestamp,
    )

    response = DiscordInteractionsEndpoint.as_view()(request)
    assert response.status_code == 200
    assert response.data == {"type": 5}
    mock_task.delay.assert_called_once_with(
        command_id=str(CustomSlashCommand.objects.get(name="status").pk),
        interaction_token="interaction-token",
        user_input="periodo: semana",
    )


def test_extract_user_prompt_reads_foco_option():
    prompt = extract_user_prompt({"options": [{"name": "foco", "value": "SICREDI"}]})
    assert prompt == "SICREDI"
