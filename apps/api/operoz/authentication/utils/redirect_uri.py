# Django imports
from django.conf import settings
from django.http import HttpRequest

# Third party imports
from rest_framework.request import Request


def oauth_redirect_uri(request: Request | HttpRequest, provider: str) -> str:
    """Build the OAuth callback URI for a provider.

    ``request.is_secure()`` alone is not reliable: the deployment terminates TLS
    at an edge proxy that may not forward ``X-Forwarded-Proto``, which would
    produce an ``http://`` callback and make providers reject the request with
    ``redirect_uri_mismatch``. Fall back to the scheme configured for the
    instance before assuming plain HTTP.
    """
    if request.is_secure():
        scheme = "https"
    else:
        configured_url = settings.APP_BASE_URL or settings.WEB_URL or ""
        scheme = "https" if configured_url.startswith("https://") else "http"

    return f"{scheme}://{request.get_host()}/auth/{provider}/callback/"
