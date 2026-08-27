import pytest
from django.test import RequestFactory, override_settings

from operoz.authentication.utils.redirect_uri import oauth_redirect_uri

HOST = "www.operoz.io"

# request.get_host() valida contra ALLOWED_HOSTS, então cada teste precisa
# declarar o host — não pode depender do que o ambiente exportou.
ALLOWED = {"ALLOWED_HOSTS": [HOST]}


def _request(secure: bool):
    """Requisição com o Host de produção, segura ou não."""
    return RequestFactory().get("/auth/google/", secure=secure, HTTP_HOST=HOST)


@pytest.mark.unit
class TestOauthRedirectUri:
    @override_settings(**ALLOWED, APP_BASE_URL=None, WEB_URL="http://localhost")
    def test_https_when_request_is_secure(self):
        """TLS até o Django: o esquema da requisição manda, mesmo com WEB_URL http."""
        assert oauth_redirect_uri(_request(secure=True), "google") == f"https://{HOST}/auth/google/callback/"

    @override_settings(**ALLOWED, APP_BASE_URL=None, WEB_URL="https://www.operoz.io")
    def test_falls_back_to_web_url_scheme(self):
        """O bug de produção: o proxy de borda não repassa o esquema.

        Sem o fallback sairia http:// e o Google recusaria com redirect_uri_mismatch.
        """
        assert oauth_redirect_uri(_request(secure=False), "google") == f"https://{HOST}/auth/google/callback/"

    @override_settings(**ALLOWED, APP_BASE_URL="https://www.operoz.io", WEB_URL="http://legado")
    def test_app_base_url_wins_over_web_url(self):
        assert oauth_redirect_uri(_request(secure=False), "google") == f"https://{HOST}/auth/google/callback/"

    @override_settings(**ALLOWED, APP_BASE_URL=None, WEB_URL="http://localhost:3000")
    def test_stays_http_for_plain_http_instance(self):
        """Instância local em http não pode ser promovida a https."""
        assert oauth_redirect_uri(_request(secure=False), "google") == f"http://{HOST}/auth/google/callback/"

    @override_settings(**ALLOWED, APP_BASE_URL=None, WEB_URL=None)
    def test_no_configured_url_falls_back_to_http(self):
        assert oauth_redirect_uri(_request(secure=False), "google") == f"http://{HOST}/auth/google/callback/"

    @pytest.mark.parametrize("provider", ["google", "github", "gitlab", "gitea"])
    @override_settings(**ALLOWED, APP_BASE_URL=None, WEB_URL="https://www.operoz.io")
    def test_path_per_provider(self, provider):
        assert oauth_redirect_uri(_request(secure=False), provider) == f"https://{HOST}/auth/{provider}/callback/"
