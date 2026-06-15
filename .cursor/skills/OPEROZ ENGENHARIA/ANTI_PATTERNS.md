# Anti-patterns — Operoz (Django + React)

Documento de **proibições explícitas** para o agente e para revisão de código. Complementa `DESENVOLVEDOR SENIOR/SKILL.md` e `.cursor/rules/operoz-anti-patterns.mdc`.

**Regra de ouro:** Nunca inventar campos de API, payloads de webhook ou métricas Harness. Usar `tests/fixtures/` como fonte de verdade ou consultar serializers/tipos em `packages/types/`.

---

## Backend (Django / DRF)

### 1. N+1 em serializers (proibido)

**Não fazer:** `SerializerMethodField` (ou campos aninhados) que disparam queries por item da lista sem `prefetch_related` / `select_related` no `get_queryset()`.

```python
# ❌ PROIBIDO — 1 query por issue na listagem
class IssueSerializer(serializers.ModelSerializer):
    assignee_name = serializers.SerializerMethodField()

    def get_assignee_name(self, obj):
        return obj.assignee.display_name if obj.assignee_id else None
```

```python
# ✅ Correto — queryset da view já otimizado
def get_queryset(self):
    return (
        Issue.objects.filter(project__workspace__slug=self.kwargs["workspace_slug"])
        .select_related("assignee", "state", "project")
        .prefetch_related("labels")
    )
```

**Checklist:** listagens com >1 query extra por objeto = bloqueio em review.

---

### 2. Updates/deletes sem filtro de workspace/tenant (IDOR)

**Não fazer:** `Model.objects.get(pk=id)` ou `.filter(id=id).update(...)` sem encadear `workspace`, `board` e `project` do contexto da URL ou do utilizador.

```python
# ❌ PROIBIDO — qualquer UUID válido de outro tenant
issue = Issue.objects.get(pk=request.data["issue_id"])
issue.state_id = new_state_id
issue.save()
```

```python
# ✅ Correto — escopo explícito + permissão
issue = (
    Issue.objects.filter(
        pk=issue_id,
        project__workspace__slug=workspace_slug,
        project__board__slug=board_slug,
    )
    .filter(_project_permission_filters(request.user))
    .first()
)
if not issue:
    raise NotFound()
```

**Checklist:** toda escrita deve provar «este recurso pertence ao workspace/board do pedido».

---

### 3. Escritas multi-tabela sem `transaction.atomic()`

**Não fazer:** criar/atualizar vários modelos relacionados (issue + atividade + alocação de custo + webhook log) em sequência sem transação.

```python
# ❌ PROIBIDO — estado inconsistente se falhar no meio
snapshot = CostSnapshot.objects.create(...)
CostAllocation.objects.create(snapshot=snapshot, project_id=pid)
issue.git_pr_url = pr_url
issue.save()
```

```python
# ✅ Correto
from django.db import transaction

with transaction.atomic():
    snapshot = CostSnapshot.objects.create(...)
    CostAllocation.objects.create(snapshot=snapshot, project_id=pid)
    Issue.objects.filter(pk=issue_id).update(git_pr_url=pr_url)
```

---

### 4. Outros anti-patterns backend

| Anti-pattern                                  | Porquê evitar                                         |
| --------------------------------------------- | ----------------------------------------------------- |
| Inventar campos JSON de GitHub/Harness        | Quebra parsers e testes; usar `tests/fixtures/*.json` |
| Logar payload completo de webhook em produção | Vazamento de tokens e PII                             |
| Bypass de `deleted_at` / soft delete          | Dados fantasma e fugas de permissão                   |
| Lógica de negócio crítica só no serializer    | Duplicação e bypass via outro endpoint                |
| `allow_any` em endpoints de integração        | Abuso e SSRF em callbacks                             |

---

## Frontend (React / apps/web)

### 1. Tipagem com `any` (proibido)

**Não fazer:** `any`, `as any`, ou omitir tipos em props de componentes e respostas de API.

```typescript
// ❌ PROIBIDO
const data: any = await boardService.getClient360(slug);
function Row({ issue }: { issue: any }) { ... }
```

```typescript
// ✅ Correto — tipos de packages/types ou inferência explícita
import type { TIssue } from "@operis/types";
function Row({ issue }: { issue: TIssue }) { ... }
```

---

### 2. Vazamento de sessão em logs commitados

**Não fazer:** `console.log` com token, cookie, `Authorization`, ou objeto `user` completo da sessão.

```typescript
// ❌ PROIBIDO
console.log("session", getSessionToken(), user);
```

Usar apenas em debug local **não commitado**, ou logger interno com redacção.

---

### 3. Componentização redundante

**Não fazer:** criar `Button`, `Input`, `Modal`, `Badge` locais quando existir equivalente em `@operis/ui` ou `@operis/propel`.

```tsx
// ❌ PROIBIDO — primitive duplicada
export function PrimaryButton({ children, onClick }: Props) {
  return (
    <button className="rounded-md bg-blue-600 px-3 py-2 text-white" onClick={onClick}>
      {children}
    </button>
  );
}
```

```tsx
// ✅ Correto
import { Button } from "@operis/propel";
<Button variant="primary" onClick={onClick}>
  {children}
</Button>;
```

---

### 4. UX anti-patterns (proibidos)

Ver detalhe em `OPEROZ ENGENHARIA/SKILL.md` §8.

| Anti-pattern                               | Alternativa                                                |
| ------------------------------------------ | ---------------------------------------------------------- |
| URL/token cru em `<p break-all>`           | `IconButton` + `Tooltip` + toast (`copy-link-control.tsx`) |
| Chave i18n visível na UI                   | Corrigir `packages/i18n` pt-BR + en                        |
| Modal cramped / perde contexto pós-sucesso | `p-6 gap-4`, manter lista de convites                      |
| Empty state genérico                       | CTA + próximo passo Operoz                                 |

### 5. Outros anti-patterns frontend

| Anti-pattern                            | Porquê evitar                             |
| --------------------------------------- | ----------------------------------------- |
| Cores hex / `gray-*` em features novas  | Quebra dark mode; ver DESIGN SISTEMA      |
| Assumir permissão que a API nega        | UI enganosa; esconder ação via capability |
| Mock de API «na cabeça» em testes/docs  | Drift; copiar de `tests/fixtures/`        |
| Fetch sem tratar 404/403 alinhado ao BE | UX inconsistente com regra 404 do tenant  |

---

## Integrações (Git + Harness)

| Anti-pattern                                   | Alternativa                               |
| ---------------------------------------------- | ----------------------------------------- |
| Parser escrito contra exemplo inventado        | `tests/fixtures/github_webhook_pr.json`   |
| Agregação de custo sem `pipeline_id` / tags    | `tests/fixtures/harness_cost_report.json` |
| Processar webhook sem idempotência             | `delivery_id` ou hash `(event, sha)`      |
| Atribuir custo sem `board_slug` / `project_id` | Regras em CONTEXTO/SKILL.md               |

---

## Antes de abrir PR

- [ ] Sem anti-patterns desta lista no diff
- [ ] Fixtures atualizados se o contrato JSON mudou
- [ ] `pnpm check:types` nos pacotes web tocados
- [ ] Listagens API revisadas para N+1 (Django Debug Toolbar ou `assertNumQueries` em teste)
