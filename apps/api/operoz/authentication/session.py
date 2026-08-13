from rest_framework.authentication import SessionAuthentication


class BaseSessionAuthentication(SessionAuthentication):
    # Disable csrf for the rest apis
    def enforce_csrf(self, request):
        return


class CsrfEnforcedSessionAuthentication(SessionAuthentication):
    """Autenticação por sessão COM verificação real de CSRF.

    `BaseSessionAuthentication` desliga o CSRF para toda a aplicação (comportamento
    pré-existente), o que deixa `SESSION_COOKIE_SAMESITE=Lax` como única defesa.
    Isso é aceitável num CRUD comum, mas não numa rota cujo prémio para um atacante
    é um `APIToken` de conta inteira amarrado ao cliente OAuth dele
    (`McpConnectorAuthorizeEndpoint`) — um confused deputy clássico.

    Esta classe simplesmente **não** sobrepõe `enforce_csrf`, herdando a
    implementação real do DRF, que delega ao `CsrfViewMiddleware` do Django
    (verifica o header `X-CSRFToken` contra o cookie `csrftoken` e valida a
    `Origin`/`Referer` contra `CSRF_TRUSTED_ORIGINS`). Falha → `403`.

    Usar só nas views que precisam; trocar o comportamento global está fora do
    escopo e afetaria toda a aplicação.

    Nota para o cliente: `CSRF_COOKIE_HTTPONLY=True` nesta instalação, portanto o
    JS **não consegue ler** o cookie. O valor tem de vir de
    `GET /auth/get-csrf-token/` (`CSRFTokenEndpoint`), que é o mesmo caminho já
    usado pelos formulários de login do `apps/web`.
    """
