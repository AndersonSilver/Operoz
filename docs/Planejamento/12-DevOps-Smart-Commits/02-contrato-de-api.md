# 02 — Contrato de API · DevOps & Smart Commits

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Webhooks de entrada (provider → Operoz)
POST /api/webhooks/github/        # JÁ EXISTE — estender p/ PR/branch/commit/build
POST /api/webhooks/gitlab/        # novo, mesmo handler normalizado
POST /api/webhooks/ci/            # build/deploy status genérico (assinado)

# Development panel (leitura na issue)
GET  /api/workspaces/{slug}/projects/{pid}/issues/{iid}/dev-links/
GET  /api/workspaces/{slug}/projects/{pid}/issues/{iid}/builds/
GET  /api/workspaces/{slug}/projects/{pid}/issues/{iid}/deployments/

# Branch a partir da issue (provider ← Operoz)
POST /api/workspaces/{slug}/projects/{pid}/issues/{iid}/create-branch/  { repo, base }

# Config de integração
GET/POST /api/workspaces/{slug}/integrations/{provider}/
```

## Permissões

| Ação                  | Regra                                                |
| --------------------- | ---------------------------------------------------- |
| Webhooks de entrada   | Assinatura HMAC do provider (não RBAC de utilizador) |
| Ver dev panel         | quem pode ver a issue                                |
| Criar branch          | `issue.edit` + integração configurada                |
| Configurar integração | `ROLE.ADMIN` (workspace)                             |

## Webhook → normalização

```python
def handle_git_webhook(provider, payload, signature):
    verify_signature(provider, payload, signature)     # HMAC; 401 se falha
    event = normalize(provider, payload)               # → DevEvent agnóstico
    issues = match_issue_keys(event.text)              # regex de chave OPS-123
    for issue in issues:
        upsert_dev_link(issue, event)                  # idempotente
        if event.is_commit:
            apply_smart_commit(issue, event)           # ver abaixo
```

## Smart commits

```text
Formato:  <ISSUE-KEY> #<command> [args]

Comandos:
  #comment <texto>      → comentário
  #time <duração>       → worklog (feature 05)
  #transition <estado>  → transição (respeita workflow, feature 01)
  #close                → atalho p/ estado Done
  #assign <user>        → atribuir
  #label <nome>         → adicionar label

Exemplo:
  "OPS-123 #close #time 3h Corrige validação de login"
```

```python
def apply_smart_commit(issue, event):
    user = resolve_member(event.committer_external)    # email/handle → membro
    log = SmartCommitLog(issue=issue, commit_sha=event.sha,
                         committer_external=event.committer_external,
                         resolved_user=user)
    for cmd in parse_commands(event.message):
        if not user or not can_apply(user, cmd, issue):
            cmd.error = "sem permissão / committer não mapeado"
            continue
        apply_command(cmd, issue, actor=user)          # usa motor existente
        cmd.applied = True
    log.save()
```

## create-branch

```jsonc
// POST create-branch/   { "repo": "org/app", "base": "main" }
// → cria branch nomeada (ex.: "ops-123-corrige-login") via API do provider,
//   regista DevLink. Requer issue.edit + token da integração.
```

## Notas

- `match_issue_keys` usa o identificador legível (`{project}-{seq}`).
- Smart commit **nunca** age sem mapear o committer a um membro com permissão.
