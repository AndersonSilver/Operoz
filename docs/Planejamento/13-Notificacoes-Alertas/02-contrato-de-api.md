# 02 — Contrato de API · Notificações & Alertas Multi-Canal

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# ─── Regras de Alerta (config do workspace) ───────────────────────────
GET    /api/workspaces/{slug}/alert-rules/
POST   /api/workspaces/{slug}/alert-rules/
GET    /api/workspaces/{slug}/alert-rules/{pk}/
PATCH  /api/workspaces/{slug}/alert-rules/{pk}/
DELETE /api/workspaces/{slug}/alert-rules/{pk}/

# ─── Preferências de Alerta do Membro ─────────────────────────────────
GET    /api/workspaces/{slug}/me/alert-preferences/
PATCH  /api/workspaces/{slug}/me/alert-preferences/

# ─── Contas Externas (Discord, Google Calendar) ───────────────────────
GET    /api/workspaces/{slug}/me/external-accounts/
POST   /api/workspaces/{slug}/me/external-accounts/
DELETE /api/workspaces/{slug}/me/external-accounts/{provider}/

# ─── Google Calendar OAuth ────────────────────────────────────────────
GET    /api/workspaces/{slug}/integrations/google-calendar/auth/start/
GET    /api/integrations/google-calendar/auth/callback/
POST   /api/workspaces/{slug}/integrations/google-calendar/disconnect/

# ─── Discord Account Linking ─────────────────────────────────────────
POST   /api/workspaces/{slug}/integrations/discord/link-account/

# ─── Logs de Alerta (auditoria, leitura) ──────────────────────────────
GET    /api/workspaces/{slug}/alert-logs/
GET    /api/workspaces/{slug}/projects/{pid}/issues/{iid}/alert-logs/

# ─── Extensão do endpoint existente ───────────────────────────────────
GET    /api/users/me/notification-preferences/      # JÁ EXISTE — estender resposta
PATCH  /api/users/me/notification-preferences/      # JÁ EXISTE — aceitar novos campos
```

## Permissões

| Ação                                      | Regra                                       |
| ----------------------------------------- | ------------------------------------------- |
| Criar/editar/deletar regras de alerta     | `ROLE.ADMIN` (workspace)                    |
| Ver regras de alerta                      | `ROLE.ADMIN`, `ROLE.MEMBER`                 |
| Gerenciar próprias preferências de alerta | `ROLE.ADMIN`, `ROLE.MEMBER`, `ROLE.GUEST`   |
| Gerenciar próprias contas externas        | `ROLE.ADMIN`, `ROLE.MEMBER`                 |
| Google Calendar OAuth                     | `ROLE.ADMIN`, `ROLE.MEMBER` (própria conta) |
| Discord link                              | `ROLE.ADMIN`, `ROLE.MEMBER` (própria conta) |
| Ver logs de alerta                        | `ROLE.ADMIN`, `ROLE.MEMBER`                 |
| Google Calendar OAuth callback            | `AllowAny` (validação via state HMAC)       |

## Detalhes dos endpoints

### POST /api/workspaces/{slug}/alert-rules/

Cria uma regra de alerta. Cada workspace/projeto pode ter uma regra por
`alert_type`.

```jsonc
// Request
{
  "alert_type": "due_date_approaching",
  "name": "Alerta de vencimento próximo",
  "enabled": true,
  "project": "uuid-do-projeto",   // null = workspace inteiro
  "config": {
    "thresholds_days": [7, 3, 1],
    "notify_assignees": true,
    "notify_creator": true
  },
  "channels": ["email", "discord_dm", "in_app"],
  "escalation_schedule": [
    {"days_before": 7, "channels": ["email"]},
    {"days_before": 3, "channels": ["email", "in_app"]},
    {"days_before": 1, "channels": ["email", "discord_dm", "in_app"]}
  ]
}

// Response 201
{
  "id": "uuid",
  "alert_type": "due_date_approaching",
  "name": "Alerta de vencimento próximo",
  "enabled": true,
  "workspace": "uuid-workspace",
  "project": "uuid-do-projeto",
  "config": { ... },
  "channels": ["email", "discord_dm", "in_app"],
  "escalation_schedule": [ ... ],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### POST /api/workspaces/{slug}/alert-rules/ — Issue Created

```jsonc
// Request
{
  "alert_type": "issue_created",
  "name": "Alerta de card criado",
  "enabled": true,
  "config": {
    "notify_assignees": true,
    "notify_creator": false,
  },
  "channels": ["email", "discord_dm", "google_calendar", "in_app"],
}
```

### POST /api/workspaces/{slug}/alert-rules/ — Missing Due Date

```jsonc
// Request
{
  "alert_type": "missing_due_date",
  "name": "Alerta sem data de vencimento",
  "enabled": true,
  "config": {
    "grace_period_days": 3,
    "notify_assignees": true,
    "notify_creator": true,
  },
  "channels": ["email", "in_app"],
}
```

### PATCH /api/workspaces/{slug}/me/alert-preferences/

Atualiza preferências do membro. Sobrepõe as regras do workspace para
este utilizador.

```jsonc
// Request
{
  "preferences": [
    {
      "alert_type": "due_date_approaching",
      "channel_type": "discord_dm",
      "enabled": false
    },
    {
      "alert_type": "issue_created",
      "channel_type": "email",
      "enabled": true
    }
  ],
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "quiet_hours_timezone": "America/Sao_Paulo"
}

// Response 200
{
  "preferences": [
    {"alert_type": "due_date_approaching", "channel_type": "email", "enabled": true},
    {"alert_type": "due_date_approaching", "channel_type": "discord_dm", "enabled": false},
    {"alert_type": "due_date_approaching", "channel_type": "google_calendar", "enabled": true},
    {"alert_type": "due_date_approaching", "channel_type": "in_app", "enabled": true},
    {"alert_type": "issue_created", "channel_type": "email", "enabled": true},
    // ...
  ],
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "quiet_hours_timezone": "America/Sao_Paulo"
}
```

### POST /api/workspaces/{slug}/me/external-accounts/

Vincula conta externa do membro.

```jsonc
// Request — Discord
{
  "provider": "discord",
  "external_id": "123456789012345678"   // Discord User ID
}

// Response 201
{
  "id": "uuid",
  "provider": "discord",
  "external_id": "123456789012345678",
  "is_active": true,
  "last_synced_at": null,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### GET /api/workspaces/{slug}/integrations/google-calendar/auth/start/

Inicia fluxo OAuth2 com Google Calendar. Retorna URL de redirect.

```jsonc
// Response 200
{
  "redirect_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&scope=https://www.googleapis.com/auth/calendar.events&state=hmac_signed_state&redirect_uri=...",
}
```

### GET /api/integrations/google-calendar/auth/callback/

Callback do OAuth2. Recebe `code` + `state`, troca por tokens, cria
`UserExternalAccount`, redireciona para settings.

```text
Query params: ?code=AUTH_CODE&state=HMAC_STATE
Redirect: /{workspace_slug}/settings/notifications/external-accounts/?gcal=connected
```

### GET /api/workspaces/{slug}/alert-logs/

Logs de auditoria paginados e filtráveis.

```jsonc
// Query params: ?alert_type=due_date_approaching&channel=email&status=sent&page=1
// Response 200
{
  "results": [
    {
      "id": "uuid",
      "alert_type": "due_date_approaching",
      "channel": "email",
      "status": "sent",
      "issue": {
        "id": "uuid",
        "sequence_id": 42,
        "name": "Corrigir validação de login",
        "identifier": "OPS-42",
      },
      "receiver": {
        "id": "uuid",
        "display_name": "João Silva",
      },
      "sent_at": "2024-01-15T10:05:00Z",
      "error": "",
      "created_at": "2024-01-15T10:05:00Z",
    },
  ],
  "next_cursor": "...",
  "prev_cursor": "...",
}
```

## Fluxo Backend — Issue criada → alertas multi-canal

```python
# 1. API View (apps/api/operoz/app/views/issue/base.py)
def create(self, request, ...):
    issue = serializer.save()
    issue_activity.delay(...)                     # existente
    emit_issue_created(issue, ...)                # existente

    # NOVO: dispara alertas de criação
    dispatch_creation_alert.delay(
        issue_id=str(issue.id),
        workspace_id=str(issue.workspace_id),
        actor_id=str(request.user.id)
    )

# 2. Task Celery (bgtasks/alert_dispatch_task.py)
@shared_task
def dispatch_creation_alert(issue_id, workspace_id, actor_id):
    issue = Issue.objects.select_related("project", "state").get(id=issue_id)
    rules = AlertRule.objects.filter(
        workspace_id=workspace_id,
        alert_type="issue_created",
        enabled=True
    )
    for rule in rules:
        recipients = resolve_recipients(issue, rule.config)
        for user in recipients:
            if user.id == actor_id:
                continue                          # não alertar quem criou
            dispatch_to_channels(rule, issue, user, "issue_created")


def dispatch_to_channels(rule, issue, user, alert_type):
    prefs = get_user_alert_preferences(user, issue.workspace_id)
    for channel_type in rule.channels:
        if not prefs.is_enabled(alert_type, channel_type):
            continue
        if is_in_quiet_hours(user, prefs):
            AlertLog.objects.create(status="skipped", ...)
            continue
        if not throttle_check(user, issue, alert_type, channel_type):
            AlertLog.objects.create(status="throttled", ...)
            continue

        channel = get_channel_handler(channel_type)
        result = channel.send(AlertContext(issue=issue, user=user, alert_type=alert_type))

        AlertLog.objects.create(
            workspace=issue.workspace, alert_rule=rule, issue=issue,
            receiver=user, channel=channel_type, alert_type=alert_type,
            status="sent" if result.success else "failed",
            sent_at=now() if result.success else None,
            error=result.error or ""
        )
```

## Fluxo Backend — Scan periódico de due dates

```python
# Celery beat (a cada 1 hora)
# bgtasks/alert_scan_task.py

@shared_task
def check_due_date_alerts():
    today = date.today()

    for workspace in Workspace.objects.filter(is_active=True):
        rules = AlertRule.objects.filter(
            workspace=workspace,
            alert_type__in=["due_date_approaching", "due_date_overdue", "missing_due_date"],
            enabled=True
        )
        if not rules.exists():
            continue

        # Issues com due date próxima (7 dias)
        approaching = Issue.objects.filter(
            workspace=workspace,
            target_date__range=[today, today + timedelta(days=7)],
            deleted_at__isnull=True
        ).exclude(
            state__group__in=["completed", "cancelled"]
        ).select_related("project", "state").iterator(chunk_size=500)

        for issue in approaching:
            days_until = (issue.target_date - today).days
            dispatch_alert.delay(
                issue_id=str(issue.id),
                alert_type="due_date_approaching",
                extra={"days_until": days_until}
            )

        # Issues atrasadas
        overdue = Issue.objects.filter(
            workspace=workspace,
            target_date__lt=today,
            deleted_at__isnull=True
        ).exclude(
            state__group__in=["completed", "cancelled"]
        ).iterator(chunk_size=500)

        for issue in overdue:
            dispatch_alert.delay(
                issue_id=str(issue.id),
                alert_type="due_date_overdue",
                extra={"days_overdue": (today - issue.target_date).days}
            )

        # Issues sem data (criadas há mais de N dias)
        missing_rule = rules.filter(alert_type="missing_due_date").first()
        grace_days = missing_rule.config.get("grace_period_days", 3) if missing_rule else 3

        no_date = Issue.objects.filter(
            workspace=workspace,
            target_date__isnull=True,
            created_at__lt=now() - timedelta(days=grace_days),
            deleted_at__isnull=True
        ).exclude(
            state__group__in=["completed", "cancelled"]
        ).iterator(chunk_size=500)

        for issue in no_date:
            dispatch_alert.delay(
                issue_id=str(issue.id),
                alert_type="missing_due_date"
            )
```

## Notas

- `resolve_recipients` respeita `config.notify_assignees` e `config.notify_creator`
  da regra; retorna lista de users.
- `throttle_check` usa Redis sliding window: chave `alert:{user_id}:{issue_id}:{type}:{channel}`,
  TTL configurável (default 6h). Impede reenvio do mesmo alerta na mesma janela.
- `is_in_quiet_hours` verifica hora atual no timezone do user vs quiet_hours_start/end.
- `get_channel_handler` retorna instância do canal (Strategy Pattern) — ver
  `05-clean-code-e-testes.md` para interface.
- `.iterator(chunk_size=500)` evita carregar todos os issues em memória.
