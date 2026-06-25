# 02 — Contrato de API · Workflow Engine

Padrões em [`00-VISAO-GERAL/01-padroes-backend.md`](../00-VISAO-GERAL/01-padroes-backend.md).

## Endpoints

```text
# Workflows (CRUD)
GET    /api/workspaces/{slug}/workflows/
POST   /api/workspaces/{slug}/workflows/
GET    /api/workspaces/{slug}/workflows/{id}/
PATCH  /api/workspaces/{slug}/workflows/{id}/
DELETE /api/workspaces/{slug}/workflows/{id}/
POST   /api/workspaces/{slug}/workflows/{id}/publish/     # draft → ativo

# Grafo (editor) — substitui transições/condições/validadores/pf de uma vez
GET    /api/workspaces/{slug}/workflows/{id}/graph/
PUT    /api/workspaces/{slug}/workflows/{id}/graph/

# Schemes
GET    /api/workspaces/{slug}/workflow-schemes/
POST   /api/workspaces/{slug}/workflow-schemes/
PATCH  /api/workspaces/{slug}/workflow-schemes/{id}/

# Execução de transição (consumido pelo issue detail)
GET    /api/workspaces/{slug}/projects/{pid}/issues/{iid}/transitions/
POST   /api/workspaces/{slug}/projects/{pid}/issues/{iid}/transitions/{tid}/execute/
```

## Permissões

| Endpoint | Decorator |
| --- | --- |
| Workflows / schemes (escrita) | `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` |
| Workflows (leitura) | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` |
| `transitions/` (listar disponíveis) | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` |
| `transitions/{tid}/execute/` | `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` + condições da transição |

> Configurar workflow é ato de ADMIN; executar transição é de MEMBER, mas
> sujeito às **condições** da própria transição (ex.: só assignee).

## Serializers

- `WorkflowSerializer(DynamicBaseSerializer)` — id, name, description, is_draft,
  initial_state, published_version. `?expand=transitions`.
- `WorkflowGraphSerializer` — valida `{nodes:[...states], edges:[...transitions
  + conditions/validators/post_functions]}`; converte para os modelos
  relacionais numa transação.
- `IssueTransitionSerializer` — transições disponíveis para a issue no seu
  estado atual, já filtradas pelas condições do utilizador.

## Fluxo de execução de transição

```text
POST .../transitions/{tid}/execute/   body: { fields?: {...}, comment?: "..." }
  1. Carregar transição + conditions + validators + post_functions
  2. check_conditions(user, issue)          → 403 se falha
  3. run_validators(issue, body.fields)     → 422 com erros se falha
  4. issue.state = transition.to_state      (dentro de transaction.atomic)
  5. registar IssueActivity (from→to, ator)
  6. run_post_functions(issue, actor)       (assign, clear, webhook, fire_event)
  7. devolver IssueSerializer atualizado
```

Erros:
- `403` — condição não satisfeita (ex.: não é assignee).
- `422` — validador falhou (campo obrigatório em falta) com lista de campos.
- `409` — estado da issue mudou entretanto (optimistic check).

## Exemplo

```jsonc
// POST .../transitions/{tid}/execute/
{ "comment": "QA aprovado", "fields": { "resolution": "fixed" } }

// 200 OK
{ "id": "…", "state": { "id": "…", "name": "Done", "group": "completed" },
  "updated_at": "2026-06-24T10:00:00Z" }

// 422
{ "error": "validation_failed",
  "fields": { "resolution": "Campo obrigatório para esta transição." } }
```

## Notas

- O `graph PUT` é idempotente e transacional: recria transições/regras a partir
  do grafo, fazendo diff (não apaga histórico de issues).
- `publish/` valida que o grafo é consistente (todo estado alcançável, um estado
  inicial) antes de ativar.
