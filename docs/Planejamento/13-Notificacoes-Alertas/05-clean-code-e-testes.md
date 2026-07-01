# 05 — Clean Code & Testes · Notificações & Alertas Multi-Canal

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operoz/
├── db/models/
│   ├── alert.py                       # AlertRule, UserAlertPreference, AlertLog
│   └── external_account.py            # UserExternalAccount, GoogleCalendarEvent
├── alerts/
│   ├── __init__.py
│   ├── dispatcher.py                  # dispatch_to_channels() — ponto central
│   ├── evaluator.py                   # evaluate_due_approaching(), evaluate_no_due_date() — PURO
│   ├── throttle.py                    # throttle_check(), rate_limit_check() — Redis
│   ├── recipients.py                  # resolve_recipients(issue, config) — PURO
│   └── channels/
│       ├── __init__.py
│       ├── base.py                    # BaseAlertChannel (ABC) + AlertContext/AlertResult
│       ├── email.py                   # EmailAlertChannel (reutiliza email_renderer)
│       ├── discord_dm.py              # DiscordDMChannel (httpx → Discord API v10)
│       ├── gcalendar.py               # GoogleCalendarChannel (googleapis)
│       └── in_app.py                  # InAppChannel (cria Notification existente)
├── bgtasks/
│   ├── alert_scan_task.py             # check_due_date_alerts() — Celery beat, hourly
│   └── alert_dispatch_task.py         # dispatch_alert(), dispatch_creation_alert()
├── app/views/alerts/
│   ├── __init__.py
│   ├── rules.py                       # AlertRuleViewSet
│   ├── preferences.py                 # UserAlertPreferenceView
│   ├── external_accounts.py           # UserExternalAccountViewSet
│   ├── google_calendar_oauth.py       # OAuth start + callback
│   └── logs.py                        # AlertLogViewSet (read-only)
├── app/serializers/
│   └── alert.py                       # AlertRuleSerializer, AlertLogSerializer, etc.
└── app/urls/
    └── alert.py                       # URL patterns
```

## Princípios específicos

- **`evaluator.py` puro**: funções que recebem issue + config e retornam bool.
  Sem side-effects, sem DB writes, sem chamadas externas. Testável unitariamente
  sem fixtures de banco.

- **`dispatcher.py` orquestra**: recebe (rule, issue, user, alert_type), resolve
  preferências, verifica quiet hours e throttle, faz fan-out para channels.
  Responsabilidade única: orquestração. Não sabe como enviar email ou DM.

- **Channels como Strategy**: cada canal implementa `BaseAlertChannel.send()`.
  Adicionar canal = implementar a interface + registar em `get_channel_handler()`.

- **Scan vs Dispatch separados**: `alert_scan_task.py` só identifica issues e
  cria jobs; `alert_dispatch_task.py` só processa um job. Separação clara entre
  "o que alertar" e "como alertar".

- **`recipients.py` puro**: `resolve_recipients(issue, config)` retorna lista de
  users baseado em assignees e creator. Sem chamadas externas.

## Interface dos canais (Strategy Pattern)

```python
# alerts/channels/base.py

from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class AlertContext:
    issue: "Issue"
    user: "User"
    alert_type: str
    workspace: "Workspace"
    extra: dict                       # {"days_until": 3, "threshold": 3}
    issue_url: str

@dataclass
class AlertResult:
    success: bool
    error: str = ""

class BaseAlertChannel(ABC):
    @abstractmethod
    def send(self, context: AlertContext) -> AlertResult:
        """Envia alerta para o user via este canal."""

    def validate_account(self, user: "User", workspace: "Workspace") -> bool:
        """Verifica se o user tem conta vinculada para este canal."""
        return True  # override nos canais que precisam
```

## Casos de teste

### Unit

| Caso                                                                                | Esperado                                          |
| ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| `evaluate_due_approaching(issue target_date=hoje+3, threshold=3)`                   | `True`                                            |
| `evaluate_due_approaching(issue target_date=hoje+10, threshold=7)`                  | `False` (fora do threshold)                       |
| `evaluate_due_approaching(issue target_date=None)`                                  | `False`                                           |
| `evaluate_overdue(issue target_date=ontem)`                                         | `True`                                            |
| `evaluate_overdue(issue target_date=amanhã)`                                        | `False`                                           |
| `evaluate_no_due_date(issue target_date=None, created_at=5 dias atrás, grace=3)`    | `True`                                            |
| `evaluate_no_due_date(issue target_date=None, created_at=hoje, grace=3)`            | `False` (dentro do grace)                         |
| `evaluate_no_due_date(issue target_date="2024-01-20")`                              | `False` (tem data)                                |
| `resolve_recipients(issue, config={notify_assignees: true, notify_creator: true})`  | Lista com assignees + creator                     |
| `resolve_recipients(issue, config={notify_assignees: true, notify_creator: false})` | Só assignees                                      |
| `resolve_recipients(issue sem assignees, config={notify_assignees: true})`          | Lista vazia                                       |
| `throttle_check(user, issue, type, channel)` sem alerta prévio                      | `True` (pode enviar)                              |
| `throttle_check(user, issue, type, channel)` com alerta recente (< 6h)              | `False` (dedup)                                   |
| `rate_limit_check(workspace, user, channel)` dentro do limite                       | `True`                                            |
| `rate_limit_check(workspace, user, channel)` acima de 10/hora                       | `False`                                           |
| `DiscordDMChannel.send()` sem UserExternalAccount                                   | `AlertResult(success=False, error="...")`         |
| `GoogleCalendarChannel.send()` sem UserExternalAccount                              | `AlertResult(success=False, error="...")`         |
| `EmailAlertChannel.send()` com context válido                                       | `AlertResult(success=True)`                       |
| `InAppChannel.send()` com context válido                                            | Cria `Notification` + `AlertResult(success=True)` |
| `sign_oauth_state()` → `verify_oauth_state()` round-trip                            | Dados originais recuperados                       |
| `verify_oauth_state()` com state adulterado                                         | Raise `PermissionDenied`                          |
| `verify_oauth_state()` com state expirado (> 10 min)                                | Raise `PermissionDenied`                          |
| `build_discord_embed(context issue_created)`                                        | Embed com cor azul (#3498DB)                      |
| `build_discord_embed(context overdue)`                                              | Embed com cor vermelha (#E74C3C)                  |
| `is_in_quiet_hours(user prefs 22:00-08:00, hora_atual=23:00, tz=SP)`                | `True`                                            |
| `is_in_quiet_hours(user prefs 22:00-08:00, hora_atual=14:00, tz=SP)`                | `False`                                           |

### Integração

| Caso                                                                  | Esperado                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------ |
| Issue criada com AlertRule `issue_created` ativa                      | `AlertLog` criado com status `sent` para cada canal          |
| Issue criada, user sem preferência Discord                            | Só email e in-app enviados; Discord skipped                  |
| Issue criada, actor é o único assignee                                | Nenhum alerta (não alertar quem criou)                       |
| `check_due_date_alerts` com issue a 3 dias do vencimento              | `dispatch_alert.delay()` chamado com `due_date_approaching`  |
| `check_due_date_alerts` com issue a 3 dias, alerta já enviado < 6h    | Não duplica (throttle retorna `False`)                       |
| `check_due_date_alerts` com issue completed                           | Não gera alerta (filtered out)                               |
| `check_due_date_alerts` com issue sem data, criada há 5 dias, grace=3 | `dispatch_alert.delay()` chamado com `missing_due_date`      |
| `check_due_date_alerts` com issue sem data, criada hoje, grace=3      | Nenhum alerta (dentro do grace)                              |
| OAuth Google Calendar callback com state válido                       | `UserExternalAccount` criado com tokens encriptados          |
| OAuth Google Calendar callback com state inválido                     | `403 Forbidden`                                              |
| OAuth Google Calendar callback com state expirado                     | `403 Forbidden`                                              |
| API: ADMIN cria AlertRule                                             | `201 Created`                                                |
| API: MEMBER tenta criar AlertRule                                     | `403 Forbidden`                                              |
| API: MEMBER vê AlertRules                                             | `200 OK` (lista)                                             |
| API: user vincula conta Discord                                       | `201 Created`, `UserExternalAccount` criado                  |
| API: user tenta desvincular conta de outro user                       | `404 Not Found`                                              |
| API: user desvincula conta Google                                     | `204`, account soft-deleted, token revogado                  |
| Rate-limit: 51º alerta no workspace na mesma hora                     | `AlertLog` com status `throttled`                            |
| Quiet hours: alerta às 23:00 com quiet 22:00-08:00                    | `AlertLog` com status `skipped`                              |
| Google Calendar token refresh falha 3x                                | `UserExternalAccount.is_active = False` + notificação in-app |
| Discord DM com bot sem permissão                                      | `AlertLog` com status `failed` + error message               |

### e2e

- Criar issue com AlertRule `issue_created` ativa → verificar que email chega
  (mock SMTP) e notificação in-app aparece.
- Configurar quiet hours 22:00-08:00 → disparar alerta às 23:00 → verificar que
  `AlertLog` status é `skipped`.
- Conectar Google Calendar via OAuth → criar issue com `target_date` → verificar
  que evento é criado no Calendar (mock Google API).
- Vincular Discord User ID → criar issue → verificar que DM é enviada (mock
  Discord API).
- Criar issue sem `target_date` → esperar grace period (3 dias simulados) →
  verificar alerta `missing_due_date` gerado.
- Criar issue com `target_date` a 3 dias → executar `check_due_date_alerts` →
  verificar alertas por todos os canais habilitados.
- Verificar dedup: executar `check_due_date_alerts` duas vezes em < 6h para
  mesma issue → segundo scan não gera novo alerta.
- Admin cria regra com escalação → verificar que a 7 dias só email, a 1 dia
  email + discord.

## Definition of Done

- [ ] `evaluator.py` puro, sem side-effects; testado sem DB.
- [ ] `dispatcher.py` orquestra canais via Strategy Pattern; cada canal isolado.
- [ ] Scan (`alert_scan_task`) separado de dispatch; `.iterator()` para memória.
- [ ] Throttle Redis com dedup por `user+issue+type+channel` em janela de 6h.
- [ ] Rate-limit: 50/hora/workspace, 10/hora/user/canal.
- [ ] OAuth state HMAC com expiração de 10 minutos.
- [ ] Tokens encriptados; nunca em responses ou logs.
- [ ] Quiet hours timezone-aware.
- [ ] `DateAlert` stub implementado com cores por severidade.
- [ ] Lint/format/types verdes.
