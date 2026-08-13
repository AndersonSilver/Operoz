import hashlib
import hmac
import json
from unittest.mock import patch

import pytest
import requests
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from operoz.app.views.mcp_connector import sign_callback_body
from operoz.db.models import APIToken

MCP_BASE = "http://operoz-mcp:3100"
SECRET = "segredo-de-teste"
TICKET = "a" * 43


class FakeResponse:
    """Resposta mínima no formato do `requests`."""

    def __init__(self, status_code, payload=None, raise_on_json=False):
        self.status_code = status_code
        self._payload = payload
        self._raise_on_json = raise_on_json

    def json(self):
        if self._raise_on_json:
            raise ValueError("not json")
        return self._payload


@pytest.fixture
def mcp_settings(settings):
    settings.MCP_WEB_CALLBACK_SECRET = SECRET
    settings.MCP_WEB_CALLBACK_BASE_URL = MCP_BASE
    settings.MCP_TOKEN_LABEL_PREFIX = "MCP OAuth"
    settings.MCP_WEB_CALLBACK_TIMEOUT = 5
    return settings


@pytest.mark.contract
class TestMcpConnectorAuthorizeEndpoint:
    """`POST /api/users/mcp-connectors/authorize/`"""

    @pytest.mark.django_db
    def test_authorize_success(self, session_client, create_user, mcp_settings):
        """Caminho feliz: 200 com redirect_url e exatamente um APIToken novo."""
        url = reverse("mcp-connector-authorize")

        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude", "scopes": ["mcp:tools"]})
            mock_post.return_value = FakeResponse(200, {"redirect_url": "https://claude.ai/cb?code=x&state=y"})

            response = session_client.post(url, {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["redirect_url"] == "https://claude.ai/cb?code=x&state=y"

        tokens = APIToken.objects.filter(user=create_user)
        assert tokens.count() == 1
        assert tokens.first().label == "MCP OAuth · Claude"
        # v1: token account-wide (o seletor de workspace ficou fora de escopo).
        assert tokens.first().workspace is None

    @pytest.mark.django_db
    def test_authorize_signs_body_with_first_secret(self, session_client, create_user, mcp_settings):
        """A assinatura usa o PRIMEIRO segredo da lista e cobre o corpo cru enviado."""
        mcp_settings.MCP_WEB_CALLBACK_SECRET = f"{SECRET},segredo-novo"
        url = reverse("mcp-connector-authorize")

        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude"})
            mock_post.return_value = FakeResponse(200, {"redirect_url": "https://claude.ai/cb?code=x"})

            session_client.post(url, {"ticket": TICKET}, format="json")

        _, kwargs = mock_post.call_args
        raw_body = kwargs["data"].decode("utf-8")
        headers = kwargs["headers"]
        expected = hmac.new(
            SECRET.encode(),
            f"{headers['X-Operoz-Timestamp']}.{raw_body}".encode(),
            hashlib.sha256,
        ).hexdigest()

        assert headers["X-Operoz-Signature"] == f"sha256={expected}"

        payload = json.loads(raw_body)
        assert payload["ticket"] == TICKET
        assert payload["user_id"] == str(create_user.id)
        assert payload["user_email"] == create_user.email
        assert payload["api_token"].startswith("operoz_api_")
        assert payload["api_token_id"] == str(APIToken.objects.get(user=create_user).id)

    @pytest.mark.django_db
    def test_authorize_unauthenticated(self, api_client, mcp_settings):
        """Sessão ausente → 401."""
        response = api_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    @pytest.mark.parametrize("ticket", ["", "curto", "a" * 200, "tem espaço aqui", None, 123])
    def test_authorize_invalid_ticket_format(self, session_client, mcp_settings, ticket):
        """Formato de ticket inválido → 400 e nenhum APIToken criado."""
        response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": ticket}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    def test_authorize_unknown_ticket(self, session_client, mcp_settings):
        """Ticket desconhecido no mcp-server (404 no lookup) → 400, sem APIToken."""
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get:
            mock_get.return_value = FakeResponse(404, {"error": "invalid_ticket"})
            response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"] == "invalid_ticket"
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    def test_authorize_mcp_down_on_lookup(self, session_client, mcp_settings):
        """mcp-server fora do ar no lookup → 502, sem APIToken."""
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get:
            mock_get.side_effect = requests.ConnectionError("down")
            response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    def test_authorize_retries_callback_then_succeeds(self, session_client, create_user, mcp_settings):
        """Timeout na 1ª tentativa → retenta (o callback é idempotente) → 200.

        O mcp-server commita o grant ANTES de responder, então um timeout não prova
        que falhou. Retentar é seguro e evita descartar um token que já está em uso.
        """
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude"})
            mock_post.side_effect = [
                requests.Timeout("timeout"),
                FakeResponse(200, {"redirect_url": "https://claude.ai/cb?code=x&state=y"}),
            ]

            response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert mock_post.call_count == 2
        assert response.status_code == status.HTTP_200_OK
        assert response.data["redirect_url"] == "https://claude.ai/cb?code=x&state=y"
        assert APIToken.objects.filter(user=create_user).count() == 1

    @pytest.mark.django_db
    def test_authorize_retry_reuses_identical_signed_body(self, session_client, mcp_settings):
        """A retentativa manda EXATAMENTE o mesmo corpo e assinatura (idempotência)."""
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude"})
            mock_post.side_effect = [
                requests.Timeout("timeout"),
                FakeResponse(200, {"redirect_url": "https://claude.ai/cb?code=x"}),
            ]

            session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        first, second = mock_post.call_args_list
        assert first.kwargs["data"] == second.kwargs["data"]
        assert first.kwargs["headers"] == second.kwargs["headers"]

    @pytest.mark.django_db
    def test_authorize_timeout_on_both_attempts_keeps_token(self, session_client, create_user, mcp_settings):
        """Sem resposta nenhuma → 502, mas o APIToken NÃO é apagado.

        Resultado ambíguo: o mcp-server pode ter concluído e ficado com um grant vivo
        a apontar para este token. Apagá-lo derrubaria a sessão ~5 min depois, na
        revalidação, com uma mensagem de "revogado" que ninguém provocou.
        """
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude"})
            mock_post.side_effect = requests.Timeout("timeout")

            response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert mock_post.call_count == 2
        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert response.data["error"] == "mcp_unavailable"
        assert APIToken.objects.filter(user=create_user).count() == 1

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "callback_status,expected",
        [
            (400, status.HTTP_400_BAD_REQUEST),
            (409, status.HTTP_400_BAD_REQUEST),
            (401, status.HTTP_502_BAD_GATEWAY),
            (403, status.HTTP_502_BAD_GATEWAY),
        ],
    )
    def test_authorize_definitive_rejection_rolls_back_token(
        self, session_client, mcp_settings, callback_status, expected
    ):
        """Rejeição DEFINITIVA (4xx) apaga o APIToken recém-criado."""
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude"})
            mock_post.return_value = FakeResponse(callback_status, {"error": "x"})

            response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert response.status_code == expected
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    @pytest.mark.parametrize("callback_status", [500, 502, 503])
    def test_authorize_server_error_keeps_token(self, session_client, mcp_settings, callback_status):
        """5xx é ambíguo (o mcp-server pode ter concluído): não apagar o token."""
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude"})
            mock_post.return_value = FakeResponse(callback_status, {"error": "x"})

            response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert APIToken.objects.count() == 1

    @pytest.mark.django_db
    def test_authorize_callback_without_redirect_url_keeps_token(self, session_client, mcp_settings):
        """200 sem `redirect_url`: resposta inútil, mas o grant pode existir — não apagar."""
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude"})
            mock_post.return_value = FakeResponse(200, {})

            response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert APIToken.objects.count() == 1

    @pytest.mark.django_db
    def test_authorize_truncates_client_name(self, session_client, create_user, mcp_settings):
        """`client_name` é auto-declarado pelo cliente OAuth — tem de ser cortado."""
        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "N" * 500})
            mock_post.return_value = FakeResponse(200, {"redirect_url": "https://claude.ai/cb?code=x"})

            session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        label = APIToken.objects.get(user=create_user).label
        assert len(label) <= 255
        assert label.startswith("MCP OAuth · ")

    @pytest.mark.django_db
    def test_authorize_disabled_without_secret(self, session_client, settings):
        """Sem segredo configurado a funcionalidade está desligada: 503, não 500."""
        settings.MCP_WEB_CALLBACK_SECRET = ""
        settings.MCP_WEB_CALLBACK_BASE_URL = MCP_BASE

        response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    def test_authorize_disabled_without_base_url(self, session_client, settings):
        settings.MCP_WEB_CALLBACK_SECRET = SECRET
        settings.MCP_WEB_CALLBACK_BASE_URL = ""

        response = session_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


@pytest.mark.contract
class TestMcpConnectorCsrf:
    """CSRF real — só nestas views novas.

    `BaseSessionAuthentication.enforce_csrf` é no-op para toda a app (comportamento
    pré-existente, fora do escopo deste plano). Estas views usam
    `CsrfEnforcedSessionAuthentication`, que herda o `enforce_csrf` real do DRF,
    porque aqui o prémio de um CSRF é um `APIToken` de conta inteira amarrado ao
    cliente OAuth do atacante.

    Nota: os outros testes usam `force_authenticate`, que faz o DRF saltar os
    authentication_classes por completo — por isso o CSRF só pode ser exercitado
    aqui, com `enforce_csrf_checks=True` e sessão real.
    """

    @pytest.fixture
    def csrf_client(self, create_user, user_data):
        client = APIClient(enforce_csrf_checks=True)
        assert client.login(email=user_data["email"], password=user_data["password"])
        return client

    def _csrf_token(self, client):
        client.get(reverse("get_csrf_token"))
        return client.cookies["csrftoken"].value

    @pytest.mark.django_db
    def test_authorize_without_csrf_header_is_rejected(self, csrf_client, mcp_settings):
        """Sem `X-CSRFToken` → 403 e nenhum APIToken criado."""
        response = csrf_client.post(reverse("mcp-connector-authorize"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    def test_authorize_with_wrong_csrf_token_is_rejected(self, csrf_client, mcp_settings):
        self._csrf_token(csrf_client)
        response = csrf_client.post(
            reverse("mcp-connector-authorize"),
            {"ticket": TICKET},
            format="json",
            HTTP_X_CSRFTOKEN="valor-errado",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    def test_authorize_with_valid_csrf_header_succeeds(self, csrf_client, create_user, mcp_settings):
        """O fluxo normal, com o header correto, continua a funcionar."""
        token = self._csrf_token(csrf_client)

        with patch("operoz.app.views.mcp_connector.requests.get") as mock_get, patch(
            "operoz.app.views.mcp_connector.requests.post"
        ) as mock_post:
            mock_get.return_value = FakeResponse(200, {"client_name": "Claude"})
            mock_post.return_value = FakeResponse(200, {"redirect_url": "https://claude.ai/cb?code=x"})

            response = csrf_client.post(
                reverse("mcp-connector-authorize"),
                {"ticket": TICKET},
                format="json",
                HTTP_X_CSRFTOKEN=token,
            )

        assert response.status_code == status.HTTP_200_OK
        assert APIToken.objects.filter(user=create_user).count() == 1

    @pytest.mark.django_db
    def test_deny_without_csrf_header_is_rejected(self, csrf_client, mcp_settings):
        response = csrf_client.post(reverse("mcp-connector-deny"), {"ticket": TICKET}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_api_tokens_endpoint_still_has_no_csrf(self, csrf_client):
        """Prova que o aperto ficou LOCAL: o endpoint antigo continua sem CSRF."""
        response = csrf_client.post(reverse("api-tokens"), {"label": "x"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.contract
class TestMcpConnectorDenyEndpoint:
    """`POST /api/users/mcp-connectors/deny/`"""

    @pytest.mark.django_db
    def test_deny_success(self, session_client, mcp_settings):
        with patch("operoz.app.views.mcp_connector.requests.post") as mock_post:
            mock_post.return_value = FakeResponse(
                200, {"redirect_url": "https://claude.ai/cb?error=access_denied&state=y"}
            )
            response = session_client.post(reverse("mcp-connector-deny"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "access_denied" in response.data["redirect_url"]
        # O caminho de recusa nunca minta nada.
        assert APIToken.objects.count() == 0

    @pytest.mark.django_db
    def test_deny_unknown_ticket(self, session_client, mcp_settings):
        with patch("operoz.app.views.mcp_connector.requests.post") as mock_post:
            mock_post.return_value = FakeResponse(404, {"error": "invalid_ticket"})
            response = session_client.post(reverse("mcp-connector-deny"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_deny_unauthenticated(self, api_client, mcp_settings):
        response = api_client.post(reverse("mcp-connector-deny"), {"ticket": TICKET}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_deny_mcp_down(self, session_client, mcp_settings):
        with patch("operoz.app.views.mcp_connector.requests.post") as mock_post:
            mock_post.side_effect = requests.ConnectionError("down")
            response = session_client.post(reverse("mcp-connector-deny"), {"ticket": TICKET}, format="json")

        assert response.status_code == status.HTTP_502_BAD_GATEWAY


@pytest.mark.unit
class TestSignCallbackBody:
    """A assinatura tem de bater byte a byte com `callback-signature.ts`."""

    def test_matches_reference_vector(self):
        # Mesmo vetor usado em `mcp-server/tests/callback-signature.test.ts`.
        secret = "segredo-de-teste"
        timestamp = "1765000000"
        body = '{"ticket":"abc","api_token":"operoz_api_x"}'

        expected = hmac.new(
            secret.encode(), f"{timestamp}.{body}".encode(), hashlib.sha256
        ).hexdigest()

        assert sign_callback_body(secret, timestamp, body) == f"sha256={expected}"

    def test_signature_changes_with_body(self):
        assert sign_callback_body("s", "1", "a") != sign_callback_body("s", "1", "b")

    def test_signature_changes_with_timestamp(self):
        assert sign_callback_body("s", "1", "a") != sign_callback_body("s", "2", "a")
