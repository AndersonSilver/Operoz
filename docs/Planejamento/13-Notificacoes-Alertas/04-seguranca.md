# 04 — Segurança · Notificações & Alertas Multi-Canal

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).
Multi-canal (Discord DM + Google Calendar + Email) = superfície ampliada com
tokens OAuth e interação com APIs externas.

## Threat-model específico

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Token leak (Google OAuth) | Tokens de acesso/refresh em DB expostos via SQL injection ou backup | Encriptar `token_data` via `license.utils.encryption` (mesmo padrão de `automation/secrets.py`); nunca devolver tokens na API; redigir em logs |
| Token leak (Discord bot) | DISCORD_BOT_TOKEN exposto em código ou logs | Manter em variável de ambiente (`settings.DISCORD_BOT_TOKEN`); nunca serializar; nunca logar |
| OAuth CSRF / state hijacking | Atacante manipula callback do Google Calendar com state forjado | `state` parameter assinado com HMAC (segredo do servidor); validar na callback; state single-use (expirar após uso) |
| Redirect URI manipulado | Atacante altera redirect_uri para capturar code OAuth | `redirect_uri` fixo na config do Google Console; validar no callback que bate com o configurado |
| Spam via alertas | Atacante cria muitas issues para flood de emails/DMs | Rate-limit por workspace (max 50 alertas/hora, via `governance.py`); throttling por user (max 10/hora/canal); dedup Redis |
| Discord DM spam ao user | Bot envia DMs excessivas | Rate-limit Discord API: max 5 req/seg (respeitar); backoff exponencial; cap diário por user |
| Escalação de privilégio via AlertRule | MEMBER cria regras para enviar alertas a outros | Apenas `ROLE.ADMIN` pode criar/editar AlertRules; user só configura as **próprias** preferências |
| IDOR em contas externas | User desconecta conta de outro user | Queryset filtrado por `request.user.id`; endpoint é `/me/external-accounts/` |
| Google Calendar event injection | Criar eventos com conteúdo malicioso (XSS, phishing) | Sanitizar título e descrição antes de enviar ao Google; escapar HTML; limitar tamanho |
| Refresh token expirado / revogado | Google revoga token; alertas falham silenciosamente | Retry com exponential backoff (max 3); marcar `is_active=False` após falhas consecutivas; notificar user in-app para reconectar |
| Alert fatigue | Excesso de alertas → user ignora alertas reais | Digest configurável (diário/semanal); quiet hours; dedup por issue+type em janela temporal; cap diário |
| DoS via alert scan | `check_due_date_alerts` faz query pesada em todas as issues | `.iterator(chunk_size=500)` para limitar memória; index em `target_date`; skip issues completed/cancelled; query por workspace |
| Informação sensível em alertas | Título/descrição da issue em email/Discord/Calendar visível | Respeitar permissões: só enviar alerta a quem pode ver a issue; não incluir conteúdo sensível no subject do email |

## Princípios de segurança

### Tokens OAuth

```python
# Armazenamento encriptado (mesmo padrão de automation/secrets.py)
from operis.license.utils.encryption import encrypt, decrypt

def store_google_tokens(user_account, tokens):
    user_account.token_data = encrypt(json.dumps(tokens))
    user_account.save(update_fields=["token_data"])

def get_google_tokens(user_account):
    return json.loads(decrypt(user_account.token_data))
```

- **Google Calendar**: refresh token encriptado em `UserExternalAccount.token_data`.
  Access token obtido em runtime (1h TTL), nunca persistido.
- **Discord**: usa `DISCORD_BOT_TOKEN` do settings (env var), não armazenado em DB.
  O bot já está configurado; não precisa de OAuth por user.
- Tokens nunca aparecem em responses da API, logs, ou error messages.

### OAuth State (anti-CSRF)

```python
import hmac, hashlib, time, json, base64

def sign_oauth_state(user_id, workspace_slug):
    payload = json.dumps({
        "user_id": str(user_id),
        "workspace_slug": workspace_slug,
        "ts": int(time.time())
    })
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return base64.urlsafe_b64encode(f"{payload}|{signature}".encode()).decode()

def verify_oauth_state(state):
    decoded = base64.urlsafe_b64decode(state).decode()
    payload, signature = decoded.rsplit("|", 1)
    expected = hmac.new(
        settings.SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise PermissionDenied("Invalid OAuth state")
    data = json.loads(payload)
    if time.time() - data["ts"] > 600:  # 10 min expiry
        raise PermissionDenied("OAuth state expired")
    return data["user_id"], data["workspace_slug"]
```

### Rate-limiting e Throttling

```python
# Reutiliza padrão de automation/governance.py

# 1. Rate-limit por workspace (Redis)
ALERT_RATE_LIMIT_WORKSPACE = 50   # max alertas/hora por workspace
ALERT_RATE_LIMIT_USER = 10        # max alertas/hora por user por canal
ALERT_DEDUP_WINDOW = 6 * 3600     # 6 horas (segundos)

# 2. Throttle: Redis sliding window
def throttle_check(user_id, issue_id, alert_type, channel):
    key = f"alert:{user_id}:{issue_id}:{alert_type}:{channel}"
    if redis.exists(key):
        return False  # já enviado nesta janela
    redis.setex(key, ALERT_DEDUP_WINDOW, 1)
    return True

# 3. Rate-limit global
def rate_limit_check(workspace_id, user_id, channel):
    ws_key = f"alert_rate:{workspace_id}:{current_hour()}"
    user_key = f"alert_rate:{user_id}:{channel}:{current_hour()}"
    
    ws_count = redis.incr(ws_key)
    if ws_count == 1:
        redis.expire(ws_key, 3600)
    if ws_count > ALERT_RATE_LIMIT_WORKSPACE:
        return False
    
    user_count = redis.incr(user_key)
    if user_count == 1:
        redis.expire(user_key, 3600)
    if user_count > ALERT_RATE_LIMIT_USER:
        return False
    
    return True
```

### Permissões

```python
# Regras de alerta: só ADMIN
@allow_permission([ROLE.ADMIN], level="WORKSPACE")
class AlertRuleViewSet(BaseViewSet):
    ...

# Preferências: próprio user
class UserAlertPreferenceView(BaseAPIView):
    def get_queryset(self):
        return UserAlertPreference.objects.filter(user=self.request.user)

# Contas externas: próprio user
class UserExternalAccountViewSet(BaseViewSet):
    def get_queryset(self):
        return UserExternalAccount.objects.filter(user=self.request.user)
```

### Discord Bot Permissions

O bot Discord do Operis precisa das seguintes permissões (scoped):
- `Send Messages` — enviar DMs
- `Create Instant Invite` — não necessário (não adicionar)
- `Manage Server` — não necessário (não adicionar)

O bot **não** precisa de permissões de admin. Princípio do menor privilégio.

### Alertas são informativos

> Um alerta **nunca** executa ações no sistema — não transita issues, não fecha
> cards, não altera dados. Alertas são puramente informativos. Ações automáticas
> ficam no motor de automação (`BoardAutomationRule`), que tem seu próprio sistema
> de permissões e auditoria.

### Auditoria

- **`AlertLog`** regista cada alerta (enviado/falhado/throttled/skipped) — rastro completo.
- Logs incluem: quem recebeu, por qual canal, qual regra disparou, qual issue.
- Tokens e conteúdos sensíveis **nunca** aparecem no AlertLog.
- Admin pode consultar logs via API (`GET /alert-logs/`) para diagnóstico.

### Revogação

- User pode **desconectar conta externa a qualquer momento** — soft-delete do
  `UserExternalAccount`. Alertas para esse canal param imediatamente.
- Google Calendar: ao desconectar, revogar token no Google (POST
  `https://oauth2.googleapis.com/revoke?token=...`).
- Discord: não precisa revogar (bot token, não user token). Basta deletar o
  `UserExternalAccount`.
