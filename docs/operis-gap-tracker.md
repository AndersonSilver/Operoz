# Operis — Gap tracker (F0-1)

Rastreio paridade Plane × Operis. Atualizar a cada sprint.

**Legenda estado F0:**

| Estado    | Significado                                   |
| --------- | --------------------------------------------- |
| `OK`      | API + UI presentes; falta validação smoke     |
| `VALIDAR` | Existe mas precisa teste manual / polish PT   |
| `PARCIAL` | Só API ou só UI, ou feature flag off          |
| `STUB`    | CE stub (`apps/web/ce`)                       |
| `AUSENTE` | Sem modelo/rota principal                     |
| `OPERIS`  | Custom Tech4Humans (não copiar Plane literal) |

**Ticket:** `OP-PARITY-###` (criar no Jira quando priorizar).

---

## §1 Gestão do espaço de trabalho

| ID  | Feature                 | API | UI   | Estado F0 | Fase | Notas                                                 |
| --- | ----------------------- | --- | ---- | --------- | ---- | ----------------------------------------------------- |
| W01 | Criar workspace         | ✅  | ✅   | OK        | F1   |                                                       |
| W02 | Alternar workspace      | ✅  | ✅   | OK        | F1   |                                                       |
| W03 | Apagar workspace        | ✅  | ✅   | OK        | F1   | Só owner; validado jun/2026                           |
| W04 | Convite email           | ✅  | ✅   | OK        | F1   | Validado jun/2026                                     |
| W05 | Convites pendentes      | ✅  | ✅   | OK        | F1   | Validado jun/2026                                     |
| W06 | Import CSV membros      | ✅  | ✅   | OK        | F1   | Parser CSV + modal Import → API convites              |
| W07 | Activity audit membros  | ✅  | ✅   | OK        | F1   | Export CSV por membro+dia (`user-activity/…/export/`) |
| W08 | Alterar papel / remover | ✅  | ✅   | OK        | F1   |                                                       |
| W09 | Sair workspace          | ✅  | ✅   | OK        | F1   | API último admin existe                               |
| W10 | Owner role explícito    | ✅  | ✅   | OK        | F1   | Badge Owner na lista + `Workspace.owner` FK           |
| W11 | Transfer ownership      | ✅  | ✅   | OK        | F1   | `POST …/transfer-ownership/` + UI settings            |
| W12 | Search Ctrl+K           | ✅  | ✅   | OK        | F1   | Validado jun/2026                                     |
| W13 | Power K completo        | ✅  | 🟡   | PARCIAL   | F1   | CE context stubs                                      |
| W14 | Home widgets            | ✅  | ✅   | OK        | F1   | `WorkspaceHomePreference`                             |
| W15 | Customize navigation    | ✅  | ✅   | OK        | F1   |                                                       |
| W16 | RBAC Member/Guest/Admin | ✅  | ✅   | OK        | F1   |                                                       |
| W17 | Commenter (projeto)     | 🟡  | 🟡   | VALIDAR   | F1   | Plane 2025 rename                                     |
| W18 | GAC custom roles        | ❌  | ❌   | AUSENTE   | F15  |                                                       |
| W19 | SSO OIDC/SAML           | 🟡  | 🟡   | PARCIAL   | F16  |                                                       |
| W20 | Billing Stripe          | ❌  | STUB | AUSENTE   | F16  | `subscription-pill` stub                              |

---

## §2 Gerenciamento de projetos

| ID  | Feature           | API | UI   | Estado F0 | Fase | Notas                 |
| --- | ----------------- | --- | ---- | --------- | ---- | --------------------- |
| P01 | CRUD projeto      | ✅  | ✅   | OK        | F2   |                       |
| P02 | Membros projeto   | ✅  | ✅   | OK        | F2   |                       |
| P03 | Estados projeto   | ✅  | ✅   | OK        | F2   |                       |
| P04 | Labels projeto    | ✅  | ✅   | OK        | F2   |                       |
| P05 | Overview projeto  | ✅  | 🟡   | VALIDAR   | F2   |                       |
| P06 | Templates projeto | 🟡  | STUB | STUB      | F2   | `template-select.tsx` |
| P07 | Publicar / Space  | ✅  | ✅   | VALIDAR   | F2   | `apps/space`          |
| P08 | Board → projetos  | ✅  | ✅   | OPERIS    | F2   | Custom `board_id`     |

---

## §3 Gestão de itens de trabalho

| ID  | Feature                 | API | UI   | Estado F0 | Fase | Notas                                   |
| --- | ----------------------- | --- | ---- | --------- | ---- | --------------------------------------- |
| I01 | CRUD issue              | ✅  | ✅   | OK        | F3   |                                         |
| I02 | Peek/modal/full detail  | ✅  | ✅   | OK        | F3   |                                         |
| I03 | Sub-itens               | ✅  | ✅   | OK        | F3   |                                         |
| I04 | Tipos workspace/projeto | ✅  | ✅   | PARCIAL   | F3   | `BoardIssueType`; settings Fase 2       |
| I05 | IssueTypeSelect modal   | ✅  | ✅   | OK        | F3   | CE implementado                         |
| I06 | Filtros por tipo        | 🟡  | STUB | STUB      | F3   | `filters/issue-types.tsx`               |
| I07 | Epic como tipo          | 🟡  | STUB | PARCIAL   | F3   | `epic-modal` stub; épico=Projeto OPERIS |
| I08 | Work item updates       | 🟡  | 🟡   | PARCIAL   | F3   |                                         |
| I09 | Criar via URL           | 🟡  | 🟡   | VALIDAR   | F3   |                                         |
| I10 | Drafts workspace        | ✅  | ✅   | OK        | F3   |                                         |
| I11 | Templates issue         | 🟡  | STUB | STUB      | F3   | `template-select.tsx`                   |
| I12 | Recorrentes             | ❌  | ❌   | AUSENTE   | F3   | CE                                      |
| I13 | Relações custom         | 🟡  | STUB | PARCIAL   | F3   | `relations/` CE                         |
| I14 | Arquivo issue           | ✅  | ✅   | OK        | F3   |                                         |

---

## §4 Planejamento e organização

| ID   | Feature               | API | UI   | Estado F0 | Fase | Notas                           |
| ---- | --------------------- | --- | ---- | --------- | ---- | ------------------------------- |
| PL01 | Ciclos                | ✅  | ✅   | OK        | F4   |                                 |
| PL02 | Auto-schedule cycles  | 🟡  | 🟡   | VALIDAR   | F4   |                                 |
| PL03 | Módulos               | ✅  | ✅   | OK        | F4   |                                 |
| PL04 | Stickies              | ✅  | ✅   | OK        | F4   |                                 |
| PL05 | Milestones            | 🟡  | 🟡   | PARCIAL   | F4   |                                 |
| PL06 | Timeline dependencies | 🟡  | STUB | STUB      | F4   | gantt `dependency/*` stubs      |
| PL07 | Initiatives           | ❌  | 🟡   | AUSENTE   | F14  | `initiativesSidebar` store only |
| PL08 | Releases              | ❌  | ❌   | AUSENTE   | F14  |                                 |
| PL09 | Teamspaces            | ❌  | STUB | OPERIS    | F4   | Stub; usar **Board**            |

---

## §5 Vistas e layouts

| ID  | Feature         | API | UI   | Estado F0 | Fase | Notas                      |
| --- | --------------- | --- | ---- | --------- | ---- | -------------------------- |
| V01 | 5 layouts       | ✅  | ✅   | OK        | F5   |                            |
| V02 | Rich filters    | ✅  | ✅   | OK        | F5   |                            |
| V03 | PQL             | ❌  | ❌   | AUSENTE   | F5   | Sem módulo encontrado      |
| V04 | Views projeto   | ✅  | ✅   | OK        | F5   |                            |
| V05 | Views workspace | ✅  | ✅   | OK        | F5   |                            |
| V06 | Your Work       | ✅  | ✅   | VALIDAR   | F5   |                            |
| V07 | Board hub views | ✅  | ✅   | VALIDAR   | F2   | `/boards/.../views` existe |
| V08 | Publicar vista  | 🟡  | STUB | STUB      | F5   | `views/publish/modal`      |

---

## §6 Gestão do conhecimento

| ID  | Feature                 | API | UI   | Estado F0 | Fase | Notas            |
| --- | ----------------------- | --- | ---- | --------- | ---- | ---------------- |
| K01 | Páginas projeto         | ✅  | ✅   | OK        | F6   |                  |
| K02 | Editor blocks           | ✅  | ✅   | OK        | F6   | `@operis/editor` |
| K03 | Wiki workspace          | 🟡  | 🟡   | PARCIAL   | F6   |                  |
| K04 | Collections wiki        | 🟡  | 🟡   | PARCIAL   | F6   |                  |
| K05 | Páginas aninhadas       | ✅  | ✅   | OK        | F6   |                  |
| K06 | Page templates          | 🟡  | STUB | STUB      | F6   |                  |
| K07 | Share/lock/collab pages | 🟡  | STUB | STUB      | F6   | header CE stubs  |
| K08 | Draw.io embed           | 🟡  | 🟡   | PARCIAL   | F6   |                  |
| K09 | Report page             | 🟡  | 🟡   | PARCIAL   | F6   |                  |

---

## §7 Gestão avançada

| ID  | Feature                  | API | UI   | Estado F0    | Fase | Notas                                   |
| --- | ------------------------ | --- | ---- | ------------ | ---- | --------------------------------------- |
| A01 | Estimates                | ✅  | 🟡   | VALIDAR      | F7   | CE estimate stubs                       |
| A02 | Bulk operations          | ✅  | STUB | PARCIAL      | F7   | `bulk-operations/root` stub             |
| A03 | Time tracking            | 🟡  | STUB | PARCIAL      | F7   | worklog CE stubs                        |
| A04 | Workflows                | 🟡  | STUB | STUB         | F7   | workflow CE vazio                       |
| A05 | Automações default       | 🟡  | 🟡   | VALIDAR      | F7   |                                         |
| A06 | Automações custom        | ✅  | ✅   | IMPLEMENTADO | F7   | motor `operis/automation/` + React Flow |
| A07 | Plane Runner             | ❌  | ❌   | AUSENTE      | F7   | CE                                      |
| A08 | Board automação settings | ✅  | ✅   | IMPLEMENTADO | F7   | `settings/.../automacao` canvas + CRUD  |

---

## §8 Comunicação

| ID  | Feature              | API | UI   | Estado F0 | Fase | Notas               |
| --- | -------------------- | --- | ---- | --------- | ---- | ------------------- |
| C01 | Comentários issue    | ✅  | ✅   | OK        | F8   |                     |
| C02 | Subscribers          | ✅  | ✅   | OK        | F8   |                     |
| C03 | Inbox / notificações | ✅  | ✅   | VALIDAR   | F8   |                     |
| C04 | Email batch          | ✅  | ✅   | VALIDAR   | F8   | `issue_notify_*`    |
| C05 | Push mobile          | 🟡  | 🟡   | PARCIAL   | F8   |                     |
| C06 | Project updates      | ✅  | ✅   | OPERIS    | F17  | Status report board |
| C07 | Inline page comments | 🟡  | STUB | PARCIAL   | F8   |                     |

---

## §9 Admissão e clientes

| ID  | Feature            | API | UI  | Estado F0 | Fase | Notas       |
| --- | ------------------ | --- | --- | --------- | ---- | ----------- |
| N01 | Intake in-app      | ✅  | ✅  | VALIDAR   | F9   | `intake.py` |
| N02 | Intake forms       | 🟡  | 🟡  | PARCIAL   | F9   |             |
| N03 | Intake email       | 🟡  | ❌  | PARCIAL   | F9   |             |
| N04 | Intake responsible | 🟡  | 🟡  | PARCIAL   | F9   |             |
| N05 | Customers CRM      | ❌  | ❌  | AUSENTE   | F9   | CE          |

---

## §10 Análises e relatórios

| ID  | Feature             | API | UI  | Estado F0 | Fase | Notas                          |
| --- | ------------------- | --- | --- | --------- | ---- | ------------------------------ |
| R01 | Analytics workspace | ✅  | ✅  | VALIDAR   | F10  | `analytic.py`                  |
| R02 | Dashboards custom   | 🟡  | 🟡  | PARCIAL   | F10  | Deprecated + `dashboard.store` |
| R03 | Board meta KPIs     | ✅  | ✅  | OK        | F2   | `boards/.../meta/`             |

---

## §11 Integrações

| ID  | Feature    | API | UI  | Estado F0 | Fase | Notas                   |
| --- | ---------- | --- | --- | --------- | ---- | ----------------------- |
| X01 | Webhooks   | ✅  | ✅  | OK        | F11  |                         |
| X02 | GitHub     | 🟡  | 🟡  | PARCIAL   | F11  | `integration/github.py` |
| X03 | GitLab     | 🟡  | 🟡  | PARCIAL   | F11  |                         |
| X04 | Slack      | 🟡  | 🟡  | PARCIAL   | F11  | `integration/slack.py`  |
| X05 | Sentry     | 🟡  | 🟡  | PARCIAL   | F11  |                         |
| X06 | OAuth apps | 🟡  | 🟡  | PARCIAL   | F11  |                         |

---

## §12 Importação e exportação

| ID  | Feature            | API | UI  | Estado F0 | Fase | Notas            |
| --- | ------------------ | --- | --- | --------- | ---- | ---------------- |
| M01 | Export workspace   | ✅  | ✅  | VALIDAR   | F12  |                  |
| M02 | CSV import issues  | 🟡  | 🟡  | PARCIAL   | F12  |                  |
| M03 | Flatfile           | ❌  | ❌  | AUSENTE   | F12  | Cloud            |
| M04 | Jira/Linear/…      | 🟡  | 🟡  | PARCIAL   | F12  | `Importer` model |
| M05 | Import membros CSV | 🟡  | 🟡  | PARCIAL   | F12  | = W06            |

---

## §13 IA

| ID   | Feature       | API | UI  | Estado F0 | Fase | Notas         |
| ---- | ------------- | --- | --- | --------- | ---- | ------------- |
| AI01 | Plane AI / Pi | ❌  | ❌  | AUSENTE   | F13  |               |
| AI02 | AI credits    | ❌  | ❌  | AUSENTE   | F16  |               |
| AI03 | Operis MCP    | ✅  | N/A | OPERIS    | F13  | `mcp-server/` |

---

## §14 Operis-only (Tech4Humans)

| ID  | Feature             | API | UI  | Estado F0 | Fase | Notas                                                    |
| --- | ------------------- | --- | --- | --------- | ---- | -------------------------------------------------------- |
| O01 | Board hub M2        | ✅  | ✅  | VALIDAR   | F2   | M2 doc: concluído                                        |
| O02 | Board config F1–6   | ✅  | ✅  | VALIDAR   | F2   | F1–6 (notificações + auditoria e-mail); F7–9 coming soon |
| O03 | Board roles         | ✅  | 🟡  | PARCIAL   | F2   | `board_role.py`                                          |
| O04 | Board custom fields | ✅  | 🟡  | PARCIAL   | F2   | Fase 3 BC                                                |
| O05 | Status report       | ✅  | 🟡  | PARCIAL   | F17  | `board_status_report.py`                                 |
| O06 | Cliente 360         | ✅  | 🟡  | PARCIAL   | F2   | `clientes/` routes                                       |
| O07 | MV4 PRD             | ❌  | ❌  | AUSENTE   | F17  |                                                          |
| O08 | MV6 Kortex          | 🟡  | 🟡  | PARCIAL   | F17  | rebranding doc                                           |

---

## Resumo F0 (automático)

| Estado           | Contagem |
| ---------------- | -------- |
| OK               | 28       |
| VALIDAR          | 22       |
| PARCIAL          | 35       |
| STUB             | 18       |
| AUSENTE          | 12       |
| OPERIS           | 6        |
| **Total linhas** | **121**  |

_(Contagens manuais — rever ao atualizar linhas.)_

---

## Top 10 ações pós-F0 (entrada F1/F2)

1. ~~F1 workspace (W03–W07, W10–W12, W14)~~ — validado jun/2026.
2. **F2** — Validar board notificações (F6) + smoke secção B do hub.
3. **W13** Power K completo (único gap código F1).
4. E2E Playwright para W06/W07 (regressão automática).
5. Validar hub board tabs B3–B11 em runtime.
6. Priorizar stubs **workflow + automations + gantt deps** (F7/F4).
7. Converter linhas PARCIAL/AUSENTE em tickets `OP-PARITY-*`.

---

## Documentos F0

| Entregável          | Ficheiro                                                             | Status     |
| ------------------- | -------------------------------------------------------------------- | ---------- |
| F0-1 Tracker        | Este ficheiro                                                        | ✅         |
| F0-2 Smoke          | [operis-f0-smoke-checklist.md](./operis-f0-smoke-checklist.md)       | ☐ executar |
| F0-3 Rotas board    | Rotas existem; **validar** smoke B9                                  | ☐          |
| F0-4 CE stubs       | [operis-f0-ce-stubs-inventory.md](./operis-f0-ce-stubs-inventory.md) | ✅         |
| F0-5 Merge upstream | [operis-f0-merge-upstream.md](./operis-f0-merge-upstream.md)         | ✅         |
