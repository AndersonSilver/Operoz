# ADR — Arquitetura Visão 360 Operoz

**Status:** Aceite · **Data:** 2026-06-12 · **Programa:** OPEROZDP / Visão 360

## Contexto

O MVP Visão 360 expõe carteira de clientes via `GET /api/workspaces/{slug}/client-360/` (lista) e detalhe por `project_id`. O programa G–6 evoluiu para health score, FinOps, inteligência IA e camada enterprise (entidade Client, CRM, webhooks, BI, portal guest).

## Decisões

### 1. Modelo Client vs Project (Fase 6)

- **Decisão:** Manter **1 projeto = 1 linha operacional**; introduzir `Client360Customer` opcional (1:N projects) para rollup comercial e CRM.
- **Alternativa rejeitada:** Migrar Project para subordinado obrigatório de Client — alto risco de regressão no MVP.
- **Compatibilidade:** Projects sem `client360_customer` comportam-se como MVP; `list_grouping_mode=customer` agrupa via `group_clients_by_customer`.

### 2. Health score e semáforo

- Score 0–100 é fonte; `health` (ok/warning/critical) derivado por board settings.
- Transição documentada em [operis-visao-360-health-score-transition.md](./operis-visao-360-health-score-transition.md).

### 3. Agregação workspace vs board

- Lista workspace agrega todos os projects acessíveis ao membro.
- Board-level legado permanece em `/boards/{slug}/client-360/`.
- Rollup multi-workspace (instance) restrito a superuser: `GET /api/instances/client-360-rollup/`.

### 4. Feature flags por fase

- `WorkspaceClient360EnterpriseSettings.phase_flags` (chaves `"0"`–`"6"`) controlam FinOps (4), inteligência (5) e futuras secções.
- Defaults: todas `true`; workspace admin pode desactivar via PATCH enterprise settings.

### 5. Integrações enterprise

| Capability   | Endpoint                                            | Notas                                                      |
| ------------ | --------------------------------------------------- | ---------------------------------------------------------- |
| CRM sync     | `POST .../enterprise/crm-sync/`                     | Config manual `crm_config.accounts`; job pode ser agendado |
| Webhooks     | `POST .../enterprise/webhooks/`                     | HMAC SHA-256 header `X-Operoz-Signature`                   |
| BI export    | `GET .../enterprise/bi-export/`                     | CSV ou `format=json`                                       |
| Audit        | `GET .../enterprise/audit/`                         | Settings, health/report changes                            |
| Retenção     | `POST .../enterprise/retention/purge/`              | Snapshots + audit por `retention_weeks`                    |
| Guest portal | `GET /api/guest/client-360/portal/{token}/clients/` | Portfolio; SSO hints em `auth`                             |

### 6. Cache e read replica

- `WorkspaceClient360ViewSet.use_read_replica = True` para lista/detalhe.
- Enriquecimentos (operacional, FinOps) calculados on-read; snapshots semanais para histórico.

## Diagrama (lista → detalhe)

```text
WorkspaceClient360ViewSet.list
  → aggregate issues / reports / modules
  → apply_operational_enrichment
  → apply_finops_enrichment (se phase 4)
  → enterprise settings + customer_groups (se mode customer)
  → Response JSON
```

## Rollback

- Desactivar fase via `phase_flags` sem migration.
- Entidade Customer: FK nullable; remoção = SET NULL nos projects.

## Referências

- `operis/utils/client_360.py`, `client_360_enterprise.py`
- `operis/app/views/workspace/client_360*.py`
- `docs/operis-visao-360-roadmap.md`
