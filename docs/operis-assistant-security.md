# Assistente Operoz — Modelo de Segurança

## Princípios

1. **Least privilege:** tools retornam apenas o mínimo necessário.
2. **Fail closed:** sem membership → 403; tool negada → mensagem ao LLM sem dados.
3. **Workspace boundary:** nenhuma query cruza `workspace_id`.
4. **Session isolation:** `AssistantSession.user_id` deve coincidir com request.user.
5. **No secrets in context:** redact API keys, tokens, webhook secrets.

## Camadas

```text
Request → Auth (session) → Workspace member check → Rate limit
       → Session ownership → Chat service → Tool executor
       → access.can_* per entity → Truncated response → LLM
```

## Permissões por tool

| Tool                     | Requisito                                           |
| ------------------------ | --------------------------------------------------- |
| `search_issues`          | ProjectMember ativo; filtro guest igual board meta  |
| `get_issue`              | Acesso ao projeto do issue                          |
| `get_client_360_summary` | Workspace member; projetos filtrados por membership |
| `search_pages`           | ProjectMember nos projetos das páginas              |
| `get_page_content`       | ProjectPagePermission equivalente                   |

## Rate limits (default)

- `ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR`: 60
- `ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR`: 500

## Resposta a incidentes

- Desabilitar feature: `ASSISTANT_ENABLED=False`
- Revogar sessões: truncate `assistant_sessions` por workspace (admin)
