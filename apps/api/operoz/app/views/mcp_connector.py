"""Ponte entre a tela de consentimento do `apps/web` e o `operoz-mcp`.

O `mcp-server` não consegue mintar um `APIToken` sozinho: precisaria da sessão
Django do utilizador, que não viaja num `fetch` cross-site (`SESSION_COOKIE_SAMESITE=Lax`).
E o `apps/web` é uma SPA estática — não tem onde guardar o segredo partilhado.

Por isso o handoff final é aqui: a página autenticada manda o `ticket`, este
endpoint minta o `APIToken` para `request.user` e entrega-o ao `mcp-server` num
`POST` assinado com HMAC-SHA256. Nenhuma password passa por aqui — quem autentica
é o login normal do Operoz, antes de a página sequer carregar.
"""

# Python imports
import hashlib
import hmac
import json
import re
import time

# Django imports
from django.conf import settings

# Third party imports
import requests
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

# Module imports
from operoz.api.middleware.api_authentication import APIKeyAuthentication
from operoz.authentication.session import CsrfEnforcedSessionAuthentication
from operoz.db.models import APIToken

from .base import BaseAPIView

# Base64url de 32 bytes = 43 chars; a faixa evita amarrar ao gerador do mcp-server.
TICKET_PATTERN = re.compile(r"^[A-Za-z0-9_-]{20,128}$")

MAX_CLIENT_NAME_LENGTH = 120


def _configured_secrets():
    """Segredos aceites, em ordem. Assinamos sempre com o primeiro."""
    raw = getattr(settings, "MCP_WEB_CALLBACK_SECRET", "") or ""
    return [part.strip() for part in raw.split(",") if part.strip()]


def _mcp_base_url():
    return (getattr(settings, "MCP_WEB_CALLBACK_BASE_URL", "") or "").rstrip("/")


def sign_callback_body(secret: str, timestamp: str, raw_body: str) -> str:
    """HMAC-SHA256 sobre `"<timestamp>.<corpo cru>"`.

    Tem de bater byte a byte com `callback-signature.ts` no `mcp-server`: por isso
    o corpo é serializado **uma vez** e enviado exatamente como foi assinado.
    """
    digest = hmac.new(
        secret.encode("utf-8"),
        f"{timestamp}.{raw_body}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"sha256={digest}"


class McpConnectorAuthorizeEndpoint(BaseAPIView):
    """`POST /api/users/mcp-connectors/authorize/` — o botão «Aceitar» da tela.

    CSRF é verificado de verdade aqui (ao contrário do resto da app, onde
    `BaseSessionAuthentication.enforce_csrf` é no-op): o prémio de um CSRF nesta
    rota é um `APIToken` de conta inteira amarrado ao cliente OAuth do atacante,
    não uma escrita comum. Mesma ordem de autenticadores do `BaseAPIView`, só com
    a sessão a exigir o header `X-CSRFToken`. Autenticação por API key não é
    cookie-based, logo não está sujeita a CSRF.
    """

    authentication_classes = [CsrfEnforcedSessionAuthentication, APIKeyAuthentication]

    def post(self, request: Request) -> Response:
        secrets = _configured_secrets()
        base_url = _mcp_base_url()
        if not secrets or not base_url:
            # Funcionalidade desligada, não partida.
            return Response(
                {"error": "mcp_connector_not_configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        ticket = request.data.get("ticket")
        if not isinstance(ticket, str) or not TICKET_PATTERN.match(ticket):
            return Response({"error": "invalid_ticket"}, status=status.HTTP_400_BAD_REQUEST)

        timeout = getattr(settings, "MCP_WEB_CALLBACK_TIMEOUT", 5)

        # 1) Lookup do pendente — só para montar o label do token com o nome do cliente.
        try:
            lookup = requests.get(f"{base_url}/oauth/pending/{ticket}", timeout=timeout)
        except requests.RequestException:
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        if lookup.status_code == 404:
            return Response({"error": "invalid_ticket"}, status=status.HTTP_400_BAD_REQUEST)
        if lookup.status_code != 200:
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            client_name = (lookup.json() or {}).get("client_name") or "Aplicação"
        except ValueError:
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        # Nome auto-declarado pelo cliente OAuth: cortar antes de gravar.
        client_name = str(client_name)[:MAX_CLIENT_NAME_LENGTH]
        prefix = getattr(settings, "MCP_TOKEN_LABEL_PREFIX", "MCP OAuth")

        # 2) Minta o APIToken para o utilizador da sessão (account-wide, workspace nulo).
        api_token = APIToken.objects.create(
            label=f"{prefix} · {client_name}"[:255],
            description="Token criado automaticamente ao autorizar um conector MCP.",
            user=request.user,
            user_type=1 if request.user.is_bot else 0,
        )

        # 3) Handoff assinado. Corpo serializado uma única vez — a assinatura é sobre
        #    estes bytes exatos.
        raw_body = json.dumps(
            {
                "ticket": ticket,
                "api_token_id": str(api_token.id),
                "api_token": api_token.token,
                "user_id": str(request.user.id),
                "user_email": request.user.email,
            },
            separators=(",", ":"),
        )
        timestamp = str(int(time.time()))

        headers = {
            "Content-Type": "application/json",
            "X-Operoz-Timestamp": timestamp,
            "X-Operoz-Signature": sign_callback_body(secrets[0], timestamp, raw_body),
        }

        # O mcp-server commita o grant ANTES de responder, e o callback é idempotente
        # (repetir a mesma chamada devolve o mesmo redirect_url). Por isso um timeout
        # é AMBÍGUO, não uma falha: retentamos uma vez com o mesmo corpo assinado.
        callback = None
        for _attempt in range(2):
            try:
                callback = requests.post(
                    f"{base_url}/oauth/web-callback",
                    data=raw_body.encode("utf-8"),
                    headers=headers,
                    timeout=timeout,
                )
                break
            except requests.RequestException:
                callback = None

        if callback is None:
            # Nenhuma resposta nas duas tentativas. NÃO apagar o APIToken: o
            # mcp-server pode ter concluído e ficado com um grant vivo a apontar
            # para ele — apagá-lo derrubaria a sessão ~5 min depois, na revalidação,
            # com uma mensagem de "revogado" que ninguém provocou.
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        if callback.status_code != 200:
            # Só rejeição DEFINITIVA (4xx) justifica apagar o token recém-criado.
            # 5xx é ambíguo (o mcp-server pode ter concluído): deixar o token vivo.
            #
            # O `409 ticket_consumed` conta como definitivo — parece ambíguo, mas não
            # é: uma repetição da NOSSA chamada bem-sucedida devolveria `200` com o
            # mesmo `redirect_url` (o callback é idempotente), nunca `409`. Um `409`
            # significa que o ticket pertence a outra chamada (ou foi negado), e
            # portanto ESTE token nunca será amarrado a grant nenhum.
            if 400 <= callback.status_code < 500:
                api_token.delete()
                if callback.status_code in (400, 409):
                    return Response({"error": "invalid_ticket"}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            redirect_url = (callback.json() or {}).get("redirect_url")
        except ValueError:
            redirect_url = None

        if not redirect_url:
            # 200 sem redirect_url: resposta inútil, mas o grant pode existir do
            # outro lado — mesmo raciocínio, não apagar o token.
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"redirect_url": redirect_url}, status=status.HTTP_200_OK)


class McpConnectorDenyEndpoint(BaseAPIView):
    """`POST /api/users/mcp-connectors/deny/` — o botão «Cancelar».

    O `mcp-server` já expõe `POST /oauth/pending/<ticket>/deny` sem autenticação, e a
    página chama-o diretamente. Este endpoint existe como caminho alternativo para
    quando o browser não conseguir falar com o `mcp-server` (rede corporativa, CORS
    bloqueado): não minta nada, não toca em `APIToken`, só repassa o cancelamento.

    Exige CSRF por consistência com o endpoint de autorização, ainda que o prémio
    aqui seja só abortar uma autorização pendente (recuperável, o utilizador refaz).
    """

    authentication_classes = [CsrfEnforcedSessionAuthentication, APIKeyAuthentication]

    def post(self, request: Request) -> Response:
        base_url = _mcp_base_url()
        if not base_url:
            return Response(
                {"error": "mcp_connector_not_configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        ticket = request.data.get("ticket")
        if not isinstance(ticket, str) or not TICKET_PATTERN.match(ticket):
            return Response({"error": "invalid_ticket"}, status=status.HTTP_400_BAD_REQUEST)

        timeout = getattr(settings, "MCP_WEB_CALLBACK_TIMEOUT", 5)

        try:
            denied = requests.post(f"{base_url}/oauth/pending/{ticket}/deny", timeout=timeout)
        except requests.RequestException:
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        if denied.status_code == 404:
            return Response({"error": "invalid_ticket"}, status=status.HTTP_400_BAD_REQUEST)
        if denied.status_code != 200:
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            redirect_url = (denied.json() or {}).get("redirect_url")
        except ValueError:
            redirect_url = None

        if not redirect_url:
            return Response({"error": "mcp_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"redirect_url": redirect_url}, status=status.HTTP_200_OK)
