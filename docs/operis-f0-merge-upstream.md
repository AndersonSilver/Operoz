# F0-5 — Política de merge upstream Plane → Operis

**Objetivo:** trazer correções e features do Plane sem perder customizações Tech4Humans (Board, Cliente 360, rebranding).

---

## 1. Remotes e branches

```bash
# Configurar uma vez (não alterar git config global)
cd Operis
git remote add plane-upstream https://github.com/makeplane/plane.git 2>/dev/null || true
git fetch plane-upstream --tags
```

| Branch Operis        | Merge de                        |
| -------------------- | ------------------------------- |
| `main` / `develop`   | Apenas após review              |
| `sync/plane-YYYY-MM` | Branch temporária de integração |

---

## 2. Zonas do monorepo

| Zona                                  | Risco merge            | Estratégia                               |
| ------------------------------------- | ---------------------- | ---------------------------------------- |
| `apps/api/operis/db/models/board*.py` | **Não tocar upstream** | Manter 100% Operis                       |
| `apps/web/.../boards/**`              | **Não tocar upstream** | Manter Operis                            |
| `apps/web/core/**`                    | Médio                  | Merge + resolver conflitos               |
| `apps/web/ce/**` (= plane-web)        | Baixo                  | Preferir upstream CE; re-aplicar patches |
| `packages/*`                          | Médio                  | Merge com testes                         |
| `apps/api` restante                   | Alto                   | Merge frequente, testes contract         |

---

## 3. Processo por release upstream

1. `git fetch plane-upstream`
2. Criar `sync/plane-<tag>`
3. `git merge plane-upstream/<branch-stable>` (ou cherry-pick por área)
4. Resolver conflitos — **nunca** apagar Board models sem revisão humana
5. `pnpm install` + `docker compose` + smoke [operis-f0-smoke-checklist.md](./operis-f0-smoke-checklist.md)
6. PR interno com diff resumido por zona

---

## 4. Features CE sem código open-source

Para Initiative, Runner, GAC, Dashboards novos:

1. Verificar licença Plane Commercial
2. Se não portável: **reimplementar** no Operis (ver fases F14–F15)
3. Registar decisão no [operis-gap-tracker.md](./operis-gap-tracker.md)

---

## 5. Frequência sugerida

| Tipo                       | Frequência                |
| -------------------------- | ------------------------- |
| Security / bugfix upstream | Quinzenal                 |
| Minor release Plane        | Mensal (branch sync)      |
| Major + breaking           | Planejado; smoke completo |

---

## 6. Critério F0-5 fechado

- [ ] Remote `plane-upstream` documentado no README interno
- [ ] Primeira branch `sync/plane-*` criada (mesmo que vazia)
- [ ] Lista «zona sagrada Operis» acordada com equipa
