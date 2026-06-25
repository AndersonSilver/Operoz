# 03 — Frontend · Notificações & Alertas Multi-Canal

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/notifications/
├── alert-settings/
│   ├── alert-rules-list.tsx           # lista de regras com toggle on/off
│   ├── alert-rule-form.tsx            # modal criar/editar regra
│   ├── channel-toggle.tsx             # toggle por canal (email, discord, gcal)
│   └── due-date-thresholds.tsx        # input numérico para dias [7, 3, 1]
├── external-accounts/
│   ├── external-accounts-list.tsx     # cards com status connected/disconnected
│   ├── google-calendar-connect.tsx    # botão OAuth + status
│   └── discord-link.tsx               # input Discord User ID + instruções bot
├── alert-log/
│   └── alert-log-list.tsx             # tabela de auditoria com filtros
└── preferences/
    ├── notification-channel-config.tsx # toggles por canal + frequência
    └── quiet-hours-config.tsx          # time pickers + timezone dropdown

ce/components/issues/issue-details/sidebar/
└── date-alert.tsx                     # IMPLEMENTAR (atualmente stub vazio)
```

### `alert-rules-list.tsx`

Lista de regras de alerta do workspace. Cada item mostra:
- Nome e tipo do alerta (ícone + texto)
- Canais ativos (badges: 📧 Email, 💬 Discord, 📅 Calendar)
- Toggle on/off
- Botão editar/deletar

Admin do workspace gerencia as regras; membros só visualizam.

### `alert-rule-form.tsx`

Modal para criar/editar uma regra:
- **Tipo de evento**: dropdown (Issue criada, Due date a aproximar, Atrasado, Sem data, etc.)
- **Escopo**: workspace inteiro ou projeto específico (select)
- **Canais**: checkboxes (Email, Discord DM, Google Calendar, In-app)
- **Configuração por tipo**:
  - `due_date_approaching`: thresholds (input numérico: 7, 3, 1 dias)
  - `missing_due_date`: grace period (input numérico: dias sem data antes de alertar)
  - `issue_created`: notificar assignees (toggle), notificar criador (toggle)
- **Escalação** (Fase 4): configurar canais por threshold

### `date-alert.tsx` — Implementar stub existente

Componente que aparece na sidebar do issue detail. Atualmente vazio
(`ce/components/issues/issue-details/sidebar/date-alert.tsx`).

Deve mostrar:
- **Verde** (> 7 dias): "Vence em X dias" (sem destaque)
- **Amarelo** (3-7 dias): "Vence em X dias" (badge amarelo)
- **Laranja** (1-3 dias): "Vence em X dias!" (badge laranja)
- **Vermelho** (overdue): "Atrasado há X dias!" (badge vermelho)
- **Cinza** (sem data): "⚠ Sem data de vencimento" (badge cinza)

```tsx
// ce/components/issues/issue-details/sidebar/date-alert.tsx
import { differenceInDays } from "date-fns";

const DateAlert = ({ issue }) => {
  if (!issue.target_date) {
    return <Badge color="gray">Sem data de vencimento</Badge>;
  }

  const daysUntil = differenceInDays(new Date(issue.target_date), new Date());

  if (daysUntil < 0) {
    return <Badge color="red">Atrasado há {Math.abs(daysUntil)} dias!</Badge>;
  }
  if (daysUntil <= 3) {
    return <Badge color="orange">Vence em {daysUntil} dias!</Badge>;
  }
  if (daysUntil <= 7) {
    return <Badge color="yellow">Vence em {daysUntil} dias</Badge>;
  }
  return <Badge color="green">Vence em {daysUntil} dias</Badge>;
};
```

### `google-calendar-connect.tsx`

- Botão "Conectar Google Calendar"
- Ao clicar: chama API `/integrations/google-calendar/auth/start/`
- Abre popup OAuth do Google
- Ao retornar: mostra status "Conectado" com email do Google
- Botão "Desconectar" (com confirmação)

### `discord-link.tsx`

- Input "Seu Discord User ID"
- Instruções: "Abra o Discord → Settings → Advanced → ative Developer Mode → clique no seu avatar → Copy ID"
- Ou: "Use o comando `/link` no bot do Operis no seu servidor Discord"
- Botão "Vincular"
- Status: "Conectado como Discord#1234"

### `quiet-hours-config.tsx`

- Time picker: horário de início (ex: 22:00)
- Time picker: horário de fim (ex: 08:00)
- Dropdown de timezone: lista de timezones (America/Sao_Paulo, etc.)
- Texto explicativo: "Alertas durante o horário de silêncio serão adiados"

## Store

```text
core/store/notifications/
├── alert.store.ts                     # AlertStore
└── (workspace-notifications.store.ts) # JÁ EXISTE — mantém notificações in-app
```

### AlertStore

```ts
// core/store/notifications/alert.store.ts

class AlertStore {
  // Observable maps
  alertRules = new Map<string, TAlertRule>();
  userPreferences: TUserAlertPreferences | null = null;
  externalAccounts = new Map<string, TUserExternalAccount>();
  alertLogs: TAlertLog[] = [];
  alertLogsCount = 0;

  // Loading states
  isLoadingRules = false;
  isLoadingPreferences = false;
  isLoadingAccounts = false;

  // Actions — Regras
  fetchAlertRules = async (workspaceSlug: string) => { ... }
  createAlertRule = async (workspaceSlug: string, data: Partial<TAlertRule>) => { ... }
  updateAlertRule = async (workspaceSlug: string, ruleId: string, data: Partial<TAlertRule>) => { ... }
  deleteAlertRule = async (workspaceSlug: string, ruleId: string) => { ... }
  toggleAlertRule = async (workspaceSlug: string, ruleId: string, enabled: boolean) => { ... }

  // Actions — Preferências do membro
  fetchPreferences = async (workspaceSlug: string) => { ... }
  updatePreferences = async (workspaceSlug: string, data: Partial<TUserAlertPreferences>) => { ... }

  // Actions — Contas externas
  fetchExternalAccounts = async (workspaceSlug: string) => { ... }
  connectExternalAccount = async (workspaceSlug: string, data: TConnectAccountPayload) => { ... }
  disconnectExternalAccount = async (workspaceSlug: string, provider: string) => { ... }

  // Actions — Logs
  fetchAlertLogs = async (workspaceSlug: string, filters?: TAlertLogFilters) => { ... }

  // Computed
  get enabledChannels(): TAlertChannel[] { ... }
  get hasGoogleCalendar(): boolean { ... }
  get hasDiscord(): boolean { ... }
  get rulesArray(): TAlertRule[] { ... }
}
```

O `AlertStore` é registrado no `CoreRootStore`:

```ts
// core/store/root.store.ts — ALTERAR
import { AlertStore } from "./notifications/alert.store";

class CoreRootStore {
  // ... stores existentes
  alertStore: AlertStore;

  constructor() {
    // ...
    this.alertStore = new AlertStore(this);
  }
}
```

## Service

```text
packages/services/src/workspace/
└── alert.service.ts                   # AlertService
```

### AlertService

```ts
// packages/services/src/workspace/alert.service.ts

import { APIService } from "../api.service";

class AlertService extends APIService {
  // Regras
  getAlertRules(workspaceSlug: string): Promise<TAlertRule[]>;
  createAlertRule(workspaceSlug: string, data: Partial<TAlertRule>): Promise<TAlertRule>;
  updateAlertRule(workspaceSlug: string, ruleId: string, data: Partial<TAlertRule>): Promise<TAlertRule>;
  deleteAlertRule(workspaceSlug: string, ruleId: string): Promise<void>;

  // Preferências
  getAlertPreferences(workspaceSlug: string): Promise<TUserAlertPreferences>;
  updateAlertPreferences(workspaceSlug: string, data: Partial<TUserAlertPreferences>): Promise<TUserAlertPreferences>;

  // Contas externas
  getExternalAccounts(workspaceSlug: string): Promise<TUserExternalAccount[]>;
  linkExternalAccount(workspaceSlug: string, data: TConnectAccountPayload): Promise<TUserExternalAccount>;
  unlinkExternalAccount(workspaceSlug: string, provider: string): Promise<void>;

  // Google Calendar OAuth
  startGoogleCalendarOAuth(workspaceSlug: string): Promise<{ redirect_url: string }>;
  disconnectGoogleCalendar(workspaceSlug: string): Promise<void>;

  // Logs
  getAlertLogs(workspaceSlug: string, filters?: TAlertLogFilters): Promise<TPaginatedResponse<TAlertLog>>;
}
```

## Tipos (`@operis/types`)

```ts
// packages/types/src/alert.d.ts

export type TAlertType =
  | "issue_created"
  | "due_date_approaching"
  | "due_date_overdue"
  | "missing_due_date"
  | "state_change"
  | "assignee_change";

export type TAlertChannel = "email" | "discord_dm" | "google_calendar" | "in_app";

export type TAlertRule = {
  id: string;
  workspace: string;
  project: string | null;
  alert_type: TAlertType;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  channels: TAlertChannel[];
  escalation_schedule: TEscalationStep[];
  created_at: string;
  updated_at: string;
};

export type TEscalationStep = {
  days_before: number;
  channels: TAlertChannel[];
};

export type TUserExternalAccount = {
  id: string;
  provider: "discord" | "google_calendar";
  external_id: string;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
};

export type TUserAlertPreferences = {
  preferences: TAlertPreferenceItem[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string;
};

export type TAlertPreferenceItem = {
  alert_type: TAlertType;
  channel_type: TAlertChannel;
  enabled: boolean;
};

export type TAlertLogStatus = "sent" | "failed" | "throttled" | "skipped";

export type TAlertLog = {
  id: string;
  alert_type: TAlertType;
  channel: TAlertChannel;
  status: TAlertLogStatus;
  issue: {
    id: string;
    sequence_id: number;
    name: string;
    identifier: string;
  };
  receiver: {
    id: string;
    display_name: string;
  };
  sent_at: string | null;
  error: string;
  created_at: string;
};

export type TAlertLogFilters = {
  alert_type?: TAlertType;
  channel?: TAlertChannel;
  status?: TAlertLogStatus;
  page?: number;
};

export type TConnectAccountPayload = {
  provider: "discord" | "google_calendar";
  external_id: string;
};
```

## Rotas

```text
# Novas rotas em core/routes/core.ts

:workspaceSlug/settings/notifications/               # overview
:workspaceSlug/settings/notifications/rules/          # regras de alerta
:workspaceSlug/settings/notifications/preferences/    # preferências pessoais
:workspaceSlug/settings/notifications/external-accounts/  # contas externas
:workspaceSlug/settings/notifications/logs/           # histórico de alertas
```

Development panel (`date-alert.tsx`) vive no **issue detail** sidebar (não rota nova).

## i18n (pt-BR)

```text
alert.rules.title              = "Regras de Alerta"
alert.rules.create             = "Criar Regra"
alert.rules.edit               = "Editar Regra"
alert.rules.delete             = "Excluir Regra"
alert.rules.enabled            = "Ativa"
alert.rules.disabled           = "Desativada"
alert.type.issue_created       = "Card Criado"
alert.type.due_date_approaching = "Vencimento Próximo"
alert.type.due_date_overdue    = "Atrasado"
alert.type.missing_due_date    = "Sem Data de Vencimento"
alert.channel.email            = "Email"
alert.channel.discord_dm       = "Discord DM"
alert.channel.google_calendar  = "Google Calendar"
alert.channel.in_app           = "Notificação In-App"
alert.prefs.title              = "Preferências de Alerta"
alert.prefs.quiet_hours        = "Horário de Silêncio"
alert.prefs.quiet_hours.desc   = "Alertas neste horário serão adiados"
alert.prefs.timezone           = "Fuso Horário"
alert.accounts.title           = "Contas Externas"
alert.accounts.discord         = "Discord"
alert.accounts.gcal            = "Google Calendar"
alert.accounts.connect         = "Conectar"
alert.accounts.disconnect      = "Desconectar"
alert.accounts.connected       = "Conectado"
alert.accounts.disconnected    = "Desconectado"
alert.logs.title               = "Histórico de Alertas"
alert.logs.sent                = "Enviado"
alert.logs.failed              = "Falhou"
alert.logs.throttled           = "Limitado"
alert.logs.skipped             = "Ignorado"
date_alert.overdue             = "Atrasado há {days} dias!"
date_alert.due_soon            = "Vence em {days} dias"
date_alert.no_date             = "Sem data de vencimento"
```

## UX — Fluxo do Usuário

### 1. Admin configura (Settings → Notificações → Regras)

```
┌──────────────────────────────────────────────────────────┐
│ Regras de Alerta                              [+ Criar] │
├──────────────────────────────────────────────────────────┤
│ ✅  Card Criado                                          │
│     📧 Email  💬 Discord  📅 Calendar  🔔 In-App        │
│     Escopo: Workspace inteiro                [Editar]    │
├──────────────────────────────────────────────────────────┤
│ ✅  Vencimento Próximo                                   │
│     📧 Email  🔔 In-App                                 │
│     Alertar: 7, 3, 1 dias antes              [Editar]    │
├──────────────────────────────────────────────────────────┤
│ ✅  Sem Data de Vencimento                               │
│     📧 Email  🔔 In-App                                 │
│     Grace period: 3 dias                     [Editar]    │
├──────────────────────────────────────────────────────────┤
│ ❌  Atrasado                                             │
│     (desativado)                     [Ativar] [Editar]   │
└──────────────────────────────────────────────────────────┘
```

### 2. Membro vincula contas (Settings → Contas Externas)

```
┌──────────────────────────────────────────────────────────┐
│ Contas Externas                                          │
├──────────────────────────────────────────────────────────┤
│ 🟢 Google Calendar                                       │
│    Conectado como joao@gmail.com                         │
│    [Desconectar]                                         │
├──────────────────────────────────────────────────────────┤
│ 🔴 Discord                                               │
│    Não conectado                                          │
│    Discord User ID: [________________] [Vincular]         │
│    💡 Como encontrar: Settings → Advanced → Developer     │
│       Mode → clique no seu avatar → Copy ID              │
└──────────────────────────────────────────────────────────┘
```

### 3. Membro configura preferências (Settings → Preferências)

```
┌──────────────────────────────────────────────────────────┐
│ Preferências de Alerta                                   │
├──────────────────────────────────────────────────────────┤
│ Card Criado                                              │
│   📧 Email [✓]  💬 Discord [✓]  📅 Calendar [✓]  🔔 [✓]│
├──────────────────────────────────────────────────────────┤
│ Vencimento Próximo                                       │
│   📧 Email [✓]  💬 Discord [✗]  📅 Calendar [✓]  🔔 [✓]│
├──────────────────────────────────────────────────────────┤
│ Horário de Silêncio                                      │
│   Das [22:00] às [08:00]  Timezone: [America/Sao_Paulo] │
└──────────────────────────────────────────────────────────┘
```

### 4. Issue detail — DateAlert badge

```
┌──── Issue Detail Sidebar ────────────────────────────────┐
│ Estado: Em Progresso                                     │
│ Prioridade: Alta                                         │
│ Assignee: João Silva                                     │
│ Data: 18 Jan 2024                                        │
│ 🟠 Vence em 3 dias!              ← date-alert.tsx       │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```
