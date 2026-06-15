# Visão 360 — transição semáforo legado → health score

**Status:** Aceite · **Data:** 2026-06  
**Relacionado:** Fase 1 Health Engine · card `MIGRAÇÃO SEMÁFORO LEGADO → SCORE`

## Contexto

O MVP Cliente 360 expunha apenas o semáforo `health` (`ok` | `warning` | `critical`) calculado por regras fixas em `compute_health()`. A Fase 1 introduziu `health_score` (0–100), breakdown e RAG derivado de limiares configuráveis por board.

Consumidores legados (board overview, assistente `get_client_360_summary`) dependem do campo `health`. Novos consumidores usam `health_score` e breakdown.

## Decisão

Convivência explícita de três campos na API:

| Campo           | Origem                                                    | Uso                                                  |
| --------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `health`        | `health_level_from_score(health_score, board thresholds)` | Semáforo RAG alinhado ao score — **campo principal** |
| `health_score`  | `compute_health_score()`                                  | Score numérico 0–100                                 |
| `legacy_health` | `compute_health()`                                        | Semáforo MVP original — **deprecado**                |

### Mapping score → RAG (`health`)

Com limiares default (`ok_min=70`, `warning_min=45`):

- `score >= 70` → `ok`
- `45 <= score < 70` → `warning`
- `score < 45` → `critical`

Boards podem sobrescrever via **Saúde Visão 360** (`BoardClient360HealthSettings`).

### Feature flag UI

- Workspace: `WorkspaceClient360Settings.health_score_display_enabled` (default `false`)
- Env instance: `CLIENT_360_HEALTH_SCORE_DISPLAY_DEFAULT` (`0`/`1`)
- **Flag off:** UI mostra apenas semáforo (`Client360HealthBadge`)
- **Flag on:** UI mostra score + semáforo coerentes (`Client360HealthScoreBadge`)

Endpoint: `GET/PATCH /api/workspaces/{slug}/client-360/display-settings/`

Listas incluem `display.health_score_enabled` no payload.

## Assistente

Tool `get_client_360_summary` devolve cada cliente com `health`, `health_score`, `legacy_health` e metadados de período. Integrações devem preferir `health_score` + `health`; `legacy_health` apenas para diff durante migração.

## Cronograma de depreciação

| Marco       | Acção                                                         |
| ----------- | ------------------------------------------------------------- |
| 2026-Q2     | Score + legacy coexistem; flag UI rollout por workspace       |
| 2026-Q3     | Comunicar migradores; monitorizar uso de `legacy_health`      |
| **2026-Q4** | Remover `legacy_health` da API (breaking — major version doc) |
| 2027-Q1     | Avaliar remoção de `compute_health()` interno                 |

## Verificação

- Testes unitários: casos `critical` legados implicam score baixo (`TestLegacyHealthRegression`)
- Contract: payload lista inclui `display`, `legacy_health` por cliente
- Assistente: tool response inclui `health` e `health_score`

## Referências

- `Operis/apps/api/operis/utils/client_360.py`
- `Operis/apps/api/operis/utils/client_360_display.py`
- `Operis/docs/operis-visao-360-roadmap.md`
