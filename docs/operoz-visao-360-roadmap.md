# Visão 360 Operoz — Roadmap Estratégico

**Produto:** Operoz · **Projeto backlog:** `OPEROZDP` · **Prefixo cards:** `[ OPEROZ ]`  
**Doc técnico MVP:** [operoz-cliente-360-mvp.md](./operoz-cliente-360-mvp.md)  
**ADR:** [operoz-visao-360-architecture.md](./adr/operoz-visao-360-architecture.md)  
**Catálogo seed:** `operoz/db/management/commands/operoz_visao_360_catalog.py`  
**Última revisão:** 2026-06-12

## Visão

Cockpit operacional da **carteira de clientes** (1 projeto = 1 cliente operacional; entidade `Client360Customer` opcional para rollup comercial), módulos = frentes, board = squad.  
Consolida entrega, status report, sustentação, riscos, custo e inteligência — inspirado em Customer 360 (CS), PSA e PMO portfolio.

## Modelo de dados (actual)

- API lista: `GET /api/workspaces/{slug}/client-360/` (+ `enterprise`, `customer_groups` quando agrupamento customer)
- API detalhe: `GET /api/workspaces/{slug}/client-360/{project_id}/`
- Enterprise: `.../client-360/enterprise/*` (settings, customers, webhooks, audit, bi-export, crm-sync)
- Instance rollup: `GET /api/instances/client-360-rollup/` (superuser)
- Guest portal: `GET /api/guest/client-360/portal/{token}/clients/`
- UI lista: `/{workspaceSlug}/visao-360`
- UI detalhe: `/{workspaceSlug}/visao-360/{projectId}`
- Utils: `operoz/utils/client_360.py`, `client_360_enterprise.py`
- Assistente: tool `get_client_360_summary`

## Fases do programa

| Fase | Módulo backlog        | Foco                                                       | Estado   |
| ---- | --------------------- | ---------------------------------------------------------- | -------- |
| G    | GOVERNANÇA E ROADMAP  | ADR, SLAs, matriz dependências                             | Entregue |
| 0    | COMMAND CENTER UX     | KPIs inline, atenção, drill-down, board filter             | Entregue |
| 1    | HEALTH ENGINE         | Score 0–100, config board, histórico, RAG multidimensional | Entregue |
| 2    | COMUNICAÇÃO E RITUAIS | Matriz semanas, QBR, automação SR, widget board            | Entregue |
| 3    | OPERACIONAL PROFUNDO  | Intake, RAID, milestones, vistas persona, kanban saúde     | Entregue |
| 4    | PSA E FINOPS          | Utilização, Harness cost, margem, capacidade               | Entregue |
| 5    | INTELIGÊNCIA OPERoz   | Briefing carteira IA, QBR draft, playbooks                 | Entregue |
| 6    | ENTERPRISE            | Entidade Client, CRM, webhooks, BI, portal guest           | Entregue |

## Matriz de dependências (resumo)

| Fase | Depende de | Desbloqueia              |
| ---- | ---------- | ------------------------ |
| G    | —          | 0–6                      |
| 0    | G (ADR)    | 1 UX health              |
| 1    | 0          | 2–6 score/histórico      |
| 2    | 1          | 3 rituais QBR            |
| 3    | 2          | 4 operacional profundo   |
| 4    | 1, 3       | 5 FinOps/margem          |
| 5    | 1–4        | IA contextual            |
| 6    | G, 4       | CRM, BI, multi-workspace |

## SLAs e metas — Command Center carteira

| Métrica                         | Meta                              | Observação                                 |
| ------------------------------- | --------------------------------- | ------------------------------------------ |
| Tempo resposta lista 360 (p95)  | < 800 ms                          | Read replica; paginação server-side Fase 0 |
| Cobertura status report semanal | ≥ 90% clientes activos            | Alertas `report_missing`                   |
| Clientes health critical        | Tendência ↓ QoQ                   | Review semanal PMO                         |
| Score alert (< threshold)       | Ack em 48 h                       | Webhook `health_score_alert`               |
| Sync CRM                        | < 24 h stale                      | Badge `crm_stale` em enterprise settings   |
| Retenção dados 360              | Configurável (default 52 semanas) | `retention_weeks` + purge endpoint         |

## Health score (actual → alvo)

**Actual:** score 0–100 + semáforo `health` derivado de limiares por board; `legacy_health` (semáforo MVP) coexistindo até **2026-Q4**.  
**Transição:** ADR [operoz-visao-360-health-score-transition.md](./adr/operoz-visao-360-health-score-transition.md) · flag workspace `health_score_display_enabled` · env `CLIENT_360_HEALTH_SCORE_DISPLAY_DEFAULT`.  
**Alvo:** score + tendência 8 semanas como padrão; remoção de `legacy_health`.

## Changelog

| Data       | Fase | Notas                                                                  |
| ---------- | ---- | ---------------------------------------------------------------------- |
| 2026-06-12 | G, 6 | ADR architecture; roadmap actualizado; enterprise API + migration 0173 |
| 2026-06-12 | 5    | Inteligência IA (briefing, QBR draft, playbooks)                       |
| 2026-06-12 | 4    | FinOps PSA (margem, Harness, export)                                   |

## Execução

```bash
# Criar módulos e cards no OPEROZDP (idempotente)
docker compose -f Operoz/docker-compose-local.yml exec api \
  python manage.py seed_operoz_plataforma_violenta --workspace operoz

# Marcar cards Done após implementação + testes
docker compose -f Operoz/docker-compose-local.yml exec api \
  python manage.py mark_operoz_cards_done --workspace operoz
```

## Referências externas

- Customer 360: FanRuan, Velaris, Pylon, Userpilot
- PSA: Birdview, Klient
- PMO: SAVIOM, Celoxis, Gravitas
- QBR: Distribute, Bold BI
