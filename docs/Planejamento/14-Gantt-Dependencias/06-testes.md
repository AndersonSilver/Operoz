# 06 — Testes

## Estratégia

Seguir a pirâmide de testes definida em
[`00-VISAO-GERAL/05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md):
majoritariamente unitários, testes de contrato na API, Playwright para o fluxo
visual crítico.

---

## Passo 6.1 — Testes unitários do store

**Ficheiro:** `apps/web/core/tests/store/gantt-dependency.test.ts`

```ts
describe("BaseTimeLineStore — dependências", () => {
  test("startDependencyDrag popula dependencyDragState", () => {});
  test("updateDependencyDrag actualiza posição e target", () => {});
  test("endDependencyDrag limpa o estado", () => {});
  test("getIsCurrentDependencyDragging retorna true apenas para o bloco fonte", () => {});
  test("addDependency actualiza blocking_ids e blocked_by_ids correctamente", () => {});
  test("removeDependency remove apenas o par correcto", () => {});
});
```

---

## Passo 6.2 — Testes unitários da lógica de conflito

**Ficheiro:** `apps/web/core/tests/gantt/dependency-conflict.test.ts`

```ts
describe("hasDateConflict", () => {
  test("retorna false quando predecessor sem target_date", () => {});
  test("retorna false quando successor sem start_date", () => {});
  test("retorna false quando successor começa no mesmo dia que predecessor termina", () => {});
  test("retorna true quando successor começa antes de predecessor terminar", () => {});
  test("retorna false quando datas estão correctas (sem conflito)", () => {});
});
```

---

## Passo 6.3 — Testes unitários do SVG path builder

```ts
describe("buildArrowPath", () => {
  test("gera path M...C válido para ligação horizontal", () => {});
  test("gera path M...C válido quando target está acima do source", () => {});
  test("gera path M...C válido quando target está abaixo do source", () => {});
});
```

---

## Passo 6.4 — Testes de contrato da API (Python/pytest)

**Ficheiro:** `apps/api/operoz/tests/contract/app/test_issue_relation_gantt.py`

```python
class TestIssueRelationGanttDependency:

    def test_create_blocked_by_relation(self, authenticated_client, project, issue_a, issue_b):
        """Criar relação blocks/blocked_by via API."""
        pass

    def test_cannot_create_self_relation(self, authenticated_client, project, issue_a):
        """Não deve criar relação de um issue consigo mesmo."""
        pass

    def test_delete_relation(self, authenticated_client, project, issue_a, issue_b, relation):
        """Remover relação existente."""
        pass

    def test_member_can_create_relation(self, member_client, project, issue_a, issue_b):
        """MEMBER tem permissão items.link."""
        pass

    def test_viewer_cannot_create_relation(self, viewer_client, project, issue_a, issue_b):
        """VIEWER não tem permissão para criar relações."""
        pass
```

---

## Passo 6.5 — Teste Playwright (fluxo visual)

**Ficheiro:** `e2e/tests/gantt/dependency-drag.spec.ts`

```ts
test("arrastar bolinha direita de A para B cria seta de dependência", async ({ page }) => {
  // 1. Navegar para o Gantt
  await page.goto(`/${workspaceSlug}/projects/${projectSlug}/gantt/`);

  // 2. Hover no bloco A → bolinha aparece
  const blockA = page.locator(`[data-gantt-block-id="${issueAId}"]`);
  await blockA.hover();
  const rightHandle = blockA.locator(".right-dependency-handle");
  await expect(rightHandle).toBeVisible();

  // 3. Arrastar bolinha de A até bloco B
  const blockB = page.locator(`[data-gantt-block-id="${issueBId}"]`);
  await rightHandle.dragTo(blockB);

  // 4. Verificar seta SVG criada
  await expect(page.locator(`[data-dep-from="${issueAId}"][data-dep-to="${issueBId}"]`)).toBeVisible();

  // 5. Verificar relação criada na API
  // (via intercept de rede ou re-fetch)
});

test("hover na seta mostra tooltip com Desvincular", async ({ page }) => {
  // ...
});

test("clicar Desvincular remove a seta", async ({ page }) => {
  // ...
});
```

---

## Passo 6.6 — Checklist de cobertura mínima

| Cenário                                  | Tipo       | Obrigatório |
| ---------------------------------------- | ---------- | ----------- |
| Store: drag state start/update/end       | Unitário   | Sim         |
| Store: add/remove dependency (optimista) | Unitário   | Sim         |
| hasDateConflict (5 casos)                | Unitário   | Sim         |
| buildArrowPath (3 casos)                 | Unitário   | Sim         |
| API: criar relação blocked_by            | Contrato   | Sim         |
| API: permissão MEMBER vs VIEWER          | Contrato   | Sim         |
| API: não permite self-relation           | Contrato   | Sim         |
| E2E: drag cria seta                      | Playwright | Desejável   |
| E2E: desvincular remove seta             | Playwright | Desejável   |

---

## Checklist do Passo 6

- [ ] Testes unitários do store passam
- [ ] Testes unitários de conflito de datas passam
- [ ] Testes de contrato API passam
- [ ] `pnpm check:types` verde após todos os passos
- [ ] Nenhum linter warning novo
