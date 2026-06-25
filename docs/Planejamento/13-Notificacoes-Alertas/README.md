# 13 — Notificações & Alertas Multi-Canal

Baseline em [`00-VISAO-GERAL/`](../00-VISAO-GERAL/README.md).

## Visão

Sistema de notificações e alertas **multi-canal** e **totalmente configurável**:
qualquer card/tarefa criada no Operis dispara automaticamente email, cria evento
no Google Calendar e envia DM no Discord. Alertas progressivos avisam conforme a
data de vencimento se aproxima — e também alertam se o card não tiver data definida.

Tudo é configurável por workspace, projeto e por cada membro individualmente.

## Escopo

| Incluído | Excluído |
| --- | --- |
| Multi-canal: email, Discord DM, Google Calendar, in-app | Slack (feature separada) |
| Alertas progressivos de due date (7d→3d→1d→overdue) | SMS / push notifications |
| Alerta de card sem data de vencimento | Webhook genérico (coberto pelo motor de automação) |
| Configuração granular por user/workspace/projeto | |
| Quiet hours / timezone-aware | |
| Digest diário/semanal | |
| Auditoria completa (AlertLog) | |

## Mapeamento ao Roadmap

- **Roadmap completo**: secção "Notificações & Alertas" (atualmente parcial — só email + in-app)
- **Gap principal**: sem Google Calendar, sem Discord DM, sem alertas de due date, sem alertas de "sem data"

## Reuso de infraestrutura existente

| Componente existente | Reuso |
| --- | --- |
| `Notification` model (`db/models/notification.py`) | Canal in-app reutiliza diretamente |
| `UserNotificationPreference` | Estendido com novos campos de canal |
| `EmailNotificationLog` + `stack_email_notification` | Reutilizado para emails de alerta |
| `email_renderer.py` | Renderização de templates de email |
| Discord bot (`discord_integration/`) + `httpx` | Padrão para Discord DM |
| `SocialLoginConnection` (Google OAuth) | Padrão para OAuth do Google Calendar |
| `automation/governance.py` (rate-limit) | Throttling de alertas |
| `client_360_status_report_reminder_task.py` | Padrão para task beat periódica |
| Celery `DatabaseScheduler` | Scheduling de scan |

## Fases de implementação

### Fase 1 — Alert Engine Core + Email (P0)

Motor central de alertas com dispatch multi-canal. Foco inicial em email (já
funciona) e in-app.

- Modelos: `AlertRule`, `AlertLog`, `UserExternalAccount`, `UserAlertPreference`
- Task Celery: `check_due_date_alerts` (beat, a cada 1 hora)
- Task Celery: `dispatch_alert` (worker, por issue/evento)
- Extensão do `UserNotificationPreference` com config de canais
- Hook em `IssueViewSet.create()` para disparar alerta de criação
- Novos templates de email: issue criada, due date a aproximar, sem due date, atrasado
- Dedup via Redis sliding window (evita spam)

**Entrega**: ao criar issue, email é enviado aos assignees. A cada hora, issues
com due date próxima geram alertas por email. Issues sem data geram alerta após
grace period.

### Fase 2 — Google Calendar (P1)

Integração OAuth2 com Google Calendar para criar eventos automaticamente.

- OAuth2 flow (start + callback) com scopo `calendar.events`
- `GoogleCalendarService` (create/update/delete eventos)
- Modelo `GoogleCalendarEvent` (sync tracking)
- Canal `GoogleCalendarChannel` no dispatcher
- UI: botão "Conectar Google Calendar" nas settings
- Sync: issue com `target_date` → evento no calendar do user

**Entrega**: ao criar issue com data, evento aparece no Google Calendar do
membro. Ao mudar a data, evento atualiza. Ao concluir, evento é removido.

### Fase 3 — Discord DM (P1)

Envio de mensagens diretas no Discord para membros vinculados.

- `DiscordDMService` (criar canal DM + enviar mensagem)
- Mapeamento user→Discord ID via `UserExternalAccount`
- Vinculação: input manual de Discord User ID ou comando `/link` no bot
- Canal `DiscordDMChannel` no dispatcher
- Embeds ricos com cores por severidade
- Rate limiting (Discord API: 5 req/seg)

**Entrega**: ao criar issue, DM chega no Discord do membro. Alertas de due
date também chegam como DM com embed colorido.

### Fase 4 — Alertas Avançados (P2)

Escalação progressiva, digest, quiet hours, anti-fadiga.

- Escalação configurável por regra: [{days_before: 7, channels: ["email"]}, {days_before: 1, channels: ["email","discord"]}]
- Digest mode: resumo diário/semanal ao invés de alertas individuais
- Quiet hours: horário de silêncio por timezone do user
- Alert fatigue prevention: cap diário por user, throttling inteligente
- Alertas por estado: "issue parada há X dias sem progresso"

**Entrega**: sistema maduro com controle total sobre quando, como e quanto
alertar cada membro.

## Arquitetura geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TRIGGERS (Eventos)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Issue criada    (API view → dispatch_creation_alert.delay())       │
│  2. Issue atualizada (target_date mudou, assignee mudou)               │
│  3. Celery Beat     (hourly → check_due_date_alerts scan)             │
└──────────────┬──────────────────────────────────────┬───────────────────┘
               │                                      │
               ▼                                      ▼
┌──────────────────────────┐          ┌───────────────────────────────────┐
│  dispatch_alert          │          │  check_due_date_alerts (beat)     │
│  (Celery worker)         │          │  (Celery beat-worker, a cada 1h)  │
│                          │          │                                   │
│  1. Busca AlertRules     │          │  1. Scan issues target_date perto │
│  2. Resolve destinatários│          │  2. Scan issues SEM target_date   │
│  3. Verifica preferências│          │  3. Scan issues atrasadas         │
│  4. Verifica quiet hours │          │  4. dispatch_alert.delay() p/cada │
│  5. Verifica throttle    │          └───────────────────────────────────┘
│  6. Fan-out por canal    │
└──────────┬───────────────┘
           │
    ┌──────┼──────────────┬──────────────────┐
    ▼      ▼              ▼                  ▼
┌────────┐┌──────────┐┌───────────────┐┌──────────┐
│ Email  ││ Discord  ││ Google Cal.   ││ In-App   │
│        ││ DM       ││               ││          │
│Reutiliza││httpx →   ││googleapis →  ││Cria      │
│SMTP    ││API v10   ││create event  ││Notification│
└────────┘└──────────┘└───────────────┘└──────────┘
    │          │              │              │
    ▼          ▼              ▼              ▼
┌─────────────────────────────────────────────────┐
│              AlertLog (auditoria)                │
│  Cada envio = 1 registro (status, canal, erro)  │
└─────────────────────────────────────────────────┘
```

## Relação com sistema de notificações existente

O sistema de alertas **complementa** (não substitui) o sistema atual:

| Aspecto | Sistema Atual | Sistema Novo (Alertas) |
| --- | --- | --- |
| Trigger | Ação do usuário (criar, comentar) | Ação do usuário + scan periódico |
| Canais | Email + in-app | Email + in-app + Discord DM + Google Calendar |
| Config | 5 toggles booleanos | Regras granulares + preferências por canal |
| Dedup | Redis lock por issue | Redis sliding window por user+issue+type+canal |
| Auditoria | EmailNotificationLog | AlertLog (todos os canais) |

## Definition of Done (global)

- [ ] Fase 1: alertas de email + in-app funcionando para criação, due date e "sem data"
- [ ] Fase 2: Google Calendar integrado via OAuth, eventos sincronizados
- [ ] Fase 3: Discord DM funcionando, embeds coloridos por severidade
- [ ] Fase 4: escalação progressiva, digest, quiet hours, anti-fadiga
- [ ] Tudo configurável por workspace/projeto/membro
- [ ] Auditoria completa em AlertLog
- [ ] Tokens encriptados; rate-limit implementado
- [ ] Lint/format/types verdes
