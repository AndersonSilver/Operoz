# Assistente Operoz — reindexação RAG

Comando para popular ou atualizar embeddings usados pelo retrieval híbrido (FTS + vetor).

## Pré-requisitos

- Postgres com extensão `vector` (pgvector)
- `LLM_API_KEY` configurada (embeddings OpenAI `text-embedding-3-small` por padrão)
- Worker Celery na fila `assistant` (opcional, para `--async`)

## Uso

```bash
docker compose -f docker-compose-local.yml exec api \
  python manage.py reindex_assistant --workspace operoz
```

### Filtros

| Flag                    | Descrição                            |
| ----------------------- | ------------------------------------ |
| `--entity-type issue`   | Só cards                             |
| `--entity-type page`    | Só páginas                           |
| `--entity-type comment` | Só comentários                       |
| `--project-id <uuid>`   | Limitar a um projeto                 |
| `--dry-run`             | Conta entidades sem indexar          |
| `--async`               | Enfileira tasks Celery (`assistant`) |

### Exemplos

```bash
# Backfill de páginas de um projeto
python manage.py reindex_assistant --workspace operoz --entity-type page --project-id <uuid>

# Contagem antes de rodar
python manage.py reindex_assistant --workspace operoz --dry-run
```

## Indexação incremental

Além do comando manual, saves em **issues** e **pages** disparam reindexação debounced via signals/Celery.

## Troubleshooting

| Sintoma                  | Ação                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `embedding_failed`       | Verificar `LLM_API_KEY`, `LLM_PROVIDER` (`openai` ou `gemini`) e `ASSISTANT_EMBEDDING_MODEL` |
| `embedding_rate_limited` | Quota/429 do provider; worker re-tenta com backoff (`ASSISTANT_INDEX_RATE_LIMIT_*`)          |
| RAG vazio no chat        | Rodar reindex; confirmar `ASSISTANT_RAG_ENABLED=1`                                           |
| Chunks desatualizados    | Reindexar entidade ou projeto afetado                                                        |
| Lentidão                 | Usar `--async` e escalar worker `assistant`                                                  |

## Variáveis relacionadas

- `ASSISTANT_EMBEDDING_MODEL` — modelo de embedding (default: `text-embedding-3-small`)
- `ASSISTANT_RAG_ENABLED` — liga/desliga retrieval no `/chat/` (default: `1`)
- `ASSISTANT_RAG_TOP_K` — chunks injetados no prompt (default: `5`)
