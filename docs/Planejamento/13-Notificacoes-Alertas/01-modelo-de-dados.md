# 01 — Modelo de Dados · Notificações & Alertas Multi-Canal

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## 1. Modelos existentes (reuso)

```python
# db/models/notification.py — JÁ EXISTE
# Notification: in-app notifications (read_at, snoozed_till, archived_at)
# UserNotificationPreference: preferências por user/workspace/project
# EmailNotificationLog: fila de emails pendentes

# discord_integration/models.py — JÁ EXISTE
# CustomSlashCommand: comandos slash do Discord (workspace-scoped)

# db/models/social_connection.py — JÁ EXISTE
# SocialLoginConnection: OAuth tokens (Google login, GitHub, GitLab, Jira)
```

## 2. Extensão — UserNotificationPreference

```python
# db/models/notification.py — ALTERAR (adicionar campos)
class UserNotificationPreference(BaseModel):
    # ... campos existentes (property_change, state_change, comment, mention, issue_completed)

    # NOVOS: configuração de canais
    channels = models.JSONField(default=dict)
    # Estrutura:
    # {
    #   "email": {"enabled": true, "frequency": "immediate"|"digest_daily"|"digest_weekly"},
    #   "discord_dm": {"enabled": false},
    #   "google_calendar": {"enabled": false, "auto_create_events": true},
    #   "in_app": {"enabled": true}
    # }

    # NOVOS: preferências de alerta
    due_date_alert = models.BooleanField(default=True)
    missing_due_date_alert = models.BooleanField(default=True)
    issue_created_alert = models.BooleanField(default=True)

    # NOVOS: quiet hours
    quiet_hours_start = models.TimeField(null=True, blank=True)   # ex: 22:00
    quiet_hours_end = models.TimeField(null=True, blank=True)     # ex: 08:00
    quiet_hours_timezone = models.CharField(max_length=50, default="UTC")
```

## 3. AlertRule — Regras de alerta configuráveis

```python
class AlertRule(BaseModel):
    """Regra de alerta configurável por workspace/projeto."""
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="alert_rules")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE,
                                related_name="alert_rules", null=True, blank=True)

    class AlertType(models.TextChoices):
        ISSUE_CREATED = "issue_created"
        DUE_DATE_APPROACHING = "due_date_approaching"
        DUE_DATE_OVERDUE = "due_date_overdue"
        MISSING_DUE_DATE = "missing_due_date"
        STATE_CHANGE = "state_change"
        ASSIGNEE_CHANGE = "assignee_change"

    alert_type = models.CharField(max_length=30, choices=AlertType.choices)
    name = models.CharField(max_length=200, blank=True)
    enabled = models.BooleanField(default=True)

    # Config específica por tipo (JSONField para flexibilidade)
    config = models.JSONField(default=dict)
    # Para due_date_approaching:
    #   {"thresholds_days": [7, 3, 1], "notify_assignees": true, "notify_creator": true}
    # Para missing_due_date:
    #   {"grace_period_days": 3, "notify_assignees": true, "notify_creator": true}
    # Para issue_created:
    #   {"notify_assignees": true, "notify_creator": false}

    # Canais alvo (override por regra)
    channels = models.JSONField(default=list)  # ["email", "discord_dm", "google_calendar"]

    # Escalação progressiva (Fase 4)
    escalation_schedule = models.JSONField(default=list)
    # Estrutura:
    # [
    #   {"days_before": 7, "channels": ["email"]},
    #   {"days_before": 3, "channels": ["email", "in_app"]},
    #   {"days_before": 1, "channels": ["email", "discord_dm", "in_app"]},
    #   {"days_before": 0, "channels": ["email", "discord_dm", "google_calendar", "in_app"]}
    # ]

    class Meta:
        db_table = "alert_rules"
        ordering = ("alert_type", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "project", "alert_type"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_alert_rule_workspace_project_type",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "enabled"]),
        ]
```

## 4. UserAlertPreference — Preferências individuais

```python
class UserAlertPreference(BaseModel):
    """Preferência individual do membro — sobrepõe AlertRule."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="alert_preferences")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="user_alert_preferences")

    # Por tipo de alerta
    alert_type = models.CharField(max_length=30)   # mesmos valores de AlertRule.AlertType
    channel_type = models.CharField(max_length=20)  # email/discord_dm/google_calendar/in_app
    enabled = models.BooleanField(default=True)

    class Meta:
        db_table = "user_alert_preferences"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "workspace", "alert_type", "channel_type"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_user_alert_pref",
            )
        ]
```

## 5. UserExternalAccount — Mapeamento para contas externas

```python
class UserExternalAccount(BaseModel):
    """Mapeia user Operoz → conta externa (Discord ID, Google Calendar)."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="external_accounts")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="external_accounts")

    class Provider(models.TextChoices):
        DISCORD = "discord"
        GOOGLE_CALENDAR = "google_calendar"

    provider = models.CharField(max_length=30, choices=Provider.choices)
    external_id = models.CharField(max_length=255)     # Discord user ID ou Google email
    token_data = models.JSONField(null=True, blank=True)  # OAuth tokens (ENCRIPTADO)
    metadata = models.JSONField(default=dict)
    # Discord: {"dm_channel_id": "..."} — cache do canal DM
    # Google:  {"calendar_id": "primary"}

    is_active = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "user_external_accounts"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["user", "workspace", "provider"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_user_external_account",
            )
        ]
```

## 6. AlertLog — Auditoria de alertas enviados

```python
class AlertLog(BaseModel):
    """Registo de cada alerta enviado (ou tentado)."""
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE,
                                  related_name="alert_logs")
    alert_rule = models.ForeignKey(AlertRule, on_delete=models.SET_NULL,
                                   null=True, related_name="logs")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="alert_logs")
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                 related_name="received_alert_logs")

    channel = models.CharField(max_length=20)       # email, discord_dm, google_calendar, in_app
    alert_type = models.CharField(max_length=30)     # issue_created, due_date_approaching, etc.

    class Status(models.TextChoices):
        SENT = "sent"
        FAILED = "failed"
        THROTTLED = "throttled"
        SKIPPED = "skipped"           # quiet hours, preferência desabilitada

    status = models.CharField(max_length=20, choices=Status.choices, default="sent")
    data = models.JSONField(default=dict)             # payload enviado
    error = models.TextField(blank=True)              # mensagem de erro (se falhou)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "alert_logs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["issue", "alert_type", "channel"]),
            models.Index(fields=["receiver", "created_at"]),
            models.Index(fields=["workspace", "alert_type", "created_at"]),
            models.Index(fields=["receiver", "issue", "alert_type", "channel"]),  # dedup
        ]
```

## 7. GoogleCalendarEvent — Sync de eventos

```python
class GoogleCalendarEvent(BaseModel):
    """Tracking de eventos sincronizados entre Operoz e Google Calendar."""
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE,
                              related_name="calendar_events")
    user_external_account = models.ForeignKey(UserExternalAccount, on_delete=models.CASCADE,
                                              related_name="calendar_events")
    google_event_id = models.CharField(max_length=255)
    calendar_id = models.CharField(max_length=255, default="primary")
    last_synced_at = models.DateTimeField(auto_now=True)

    class SyncStatus(models.TextChoices):
        SYNCED = "synced"
        ERROR = "error"
        DELETED = "deleted"

    sync_status = models.CharField(max_length=20, choices=SyncStatus.choices, default="synced")

    class Meta:
        db_table = "google_calendar_events"
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "user_external_account"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_gcal_event_issue_account",
            )
        ]
```

## Design

- **Separação clara**: `AlertRule` (configuração) → `AlertLog` (auditoria) → canais (execução).
  O motor de alertas é independente do motor de automação (que é board-scoped e rule-graph-based).
- **UserExternalAccount separado de SocialLoginConnection**: login OAuth é para autenticação,
  contas externas são para notificações — escopos diferentes, ciclos de vida diferentes.
- **token_data encriptado**: usa `license.utils.encryption` (mesmo padrão de `automation/secrets.py`).
  Nunca devolvido em claro na API.
- **Dedup pelo AlertLog**: o índice `(receiver, issue, alert_type, channel)` permite verificar se
  já foi enviado alerta similar recentemente. Redis sliding window é a primeira barreira (rápido);
  AlertLog é o fallback persistente.

## Migração

- `00NN_alerts.py`: `AlertRule`, `UserAlertPreference`, `AlertLog`, `UserExternalAccount`,
  `GoogleCalendarEvent`. Altera `UserNotificationPreference` (novos campos). Aditivo — sem
  alterações destrutivas em modelos existentes.
