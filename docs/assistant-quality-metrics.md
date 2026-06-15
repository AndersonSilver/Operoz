# Métricas de qualidade — Assistente Operoz

Dashboard admin: `GET /api/workspaces/{slug}/assistant/quality/`

| Meta                        | Chave                                  | Target          |
| --------------------------- | -------------------------------------- | --------------- |
| Tool usage                  | `assistant.tool_usage.rate`            | ≥ 60%           |
| Satisfação                  | `assistant.satisfaction.rate`          | ≥ 70% thumbs up |
| Latência                    | `assistant.latency.p95_first_token_ms` | &lt; 3000 ms    |
| Alucinação (amostra manual) | `assistant.hallucination_reviews.rate` | &lt; 15%        |
| Automação P95               | `automation.p95_duration_ms`           | &lt; 2000 ms    |

## Instrumentação

- Cada resposta final incrementa `AssistantQualityDaily` (respostas com/sem tools).
- `first_token_ms` gravado em metadata da mensagem + amostras Redis para P95.
- Feedback thumbs atualiza contadores diários via `PATCH .../feedback/`.
- Revisões manuais: `POST .../assistant/quality/reviews/` (ver [qa-hallucination-review.md](./qa-hallucination-review.md)).

## UI

Workspace admin: **Configurações → Assistente Operoz** (`/{workspace}/settings/assistant`).

## Logs estruturados

Eventos de chat incluem `first_token_ms`, `tools_used` e `intent` no metadata da mensagem assistant — úteis para export APM/Grafana.
