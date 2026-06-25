# 05 — Estratégia de Testes

Pirâmide de testes do programa. Cada feature lista os seus casos concretos no
`05-clean-code-e-testes.md`.

## 1. Pirâmide

```text
        ╱╲      e2e (Playwright)  — poucos, fluxos críticos
       ╱──╲
      ╱────╲    integração (pytest + DRF client) — médio
     ╱──────╲
    ╱────────╲  unit (pytest / vitest) — muitos, rápidos
```

- **Unit (base):** funções de domínio puras — parser OQL, compilador de
  workflow, cálculo de burndown, resolução de SLA. Sem DB quando possível.
- **Integração (meio):** ViewSets via `APIClient`, permissões, isolamento de
  tenant, serialização/expansão.
- **e2e (topo):** Playwright para o fluxo de utilizador ponta-a-ponta de cada
  feature P0/P1.

## 2. Backend — pytest

Setup já existente (`apps/api/operis/tests/conftest.py`):
- `api_client` (DRF `APIClient`), fixtures de `User`/`Workspace`/`Board`.
- pgvector patched; embeddings OpenAI stubbed por defeito.

```python
@pytest.mark.django_db
def test_worklog_create_requires_member(api_client, workspace, project, issue, guest_user):
    api_client.force_authenticate(guest_user)
    resp = api_client.post(
        f"/api/workspaces/{workspace.slug}/projects/{project.id}"
        f"/issues/{issue.id}/worklogs/",
        {"time_spent_seconds": 3600, "started_at": "2026-06-24T09:00:00Z"},
    )
    assert resp.status_code == 403   # guest não regista horas


@pytest.mark.django_db
def test_worklog_tenant_isolation(api_client, member_user, other_workspace_issue):
    api_client.force_authenticate(member_user)
    resp = api_client.get(
        f"/api/workspaces/{other_workspace_issue.workspace.slug}/..."
    )
    assert resp.status_code in (403, 404)   # não vê outro tenant
```

Cobertura mínima por feature:
- Caminho feliz (create/list/update/delete).
- Permissão negada (guest / não-membro).
- **Isolamento de tenant** (obrigatório para toda entidade nova).
- Validação rejeita input inválido.

## 3. Frontend — unit

- Lógica pura (conversões `flowToGraph`, formatação de durações, builder de
  OQL) testada com vitest/jest conforme config do package.
- Stores MobX: testar actions e `computedFn` com service mockado (injetado por
  construtor).

## 4. e2e — Playwright (`apps/e2e/`)

Padrão existente (`src/f0-smoke.spec.ts`, helpers `waitForApp`,
`loadTestData`):

```ts
test("regista horas numa issue", async ({ page }) => {
  await page.goto(`/${data.workspaceSlug}/projects/${data.projectId}/issues/${data.issueId}`);
  await waitForApp(page);
  await page.getByRole("button", { name: /registar horas/i }).click();
  await page.getByLabel(/duração/i).fill("2h 30m");
  await page.getByRole("button", { name: /guardar/i }).click();
  await expect(page.getByText(/2h 30m/)).toBeVisible();
});
```

- Cada feature P0/P1 entrega ≥ 1 spec e2e do fluxo principal.
- Reusar fixtures YAML; não criar dados ad-hoc frágeis.

## 5. Testes específicos por tipo de feature

| Feature | Foco de teste especial |
| --- | --- |
| OQL | Fuzz do parser; rejeição de campos não-whitelisted; sem SQL injection |
| Workflow Engine | Transições inválidas bloqueadas; validadores; post-functions disparam |
| Rule Builder | `flowToGraph`↔`graphToFlow` idempotente; compilação de grafo |
| Time Tracking | Soma de worklogs; permissões edit_own vs edit_all |
| Permission Scheme | Matriz de papéis × permissões; elevação negada |
| SLA | Cálculo com business hours; pausa/retoma; escalonamento |
| Dashboards | Render de cada gadget; partilha respeita RBAC |

## 6. Gates de CI

- `pnpm check:types`, `pnpm check:lint`, `pnpm check:format` verdes.
- `pnpm test:f0` (smoke API + e2e) verde.
- Nova feature não baixa cobertura crítica (parser, permissões, isolamento).

## 7. Princípios

- Testar comportamento e contrato, não implementação interna.
- Um teste falha por uma razão clara (nome descritivo do cenário).
- Testes de segurança (permissão, tenant, injeção) são **bloqueantes**, não
  opcionais.
