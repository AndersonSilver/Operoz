# F0 — Resultado da auditoria (jun/2026)

Documento de fecho parcial da Fase 0. Atualizar após smoke UI manual.

---

## 1. Entregáveis F0

| ID   | Item                                                                 | Status                            |
| ---- | -------------------------------------------------------------------- | --------------------------------- |
| F0-1 | [operoz-gap-tracker.md](./operoz-gap-tracker.md)                     | ✅                                |
| F0-2 | Smoke                                                                | ✅ Fechado — API + Playwright E2E |
| F0-3 | Rotas board                                                          | ✅ ficheiros existem; validar UI  |
| F0-4 | [operoz-f0-ce-stubs-inventory.md](./operoz-f0-ce-stubs-inventory.md) | ✅ 87 stubs                       |
| F0-5 | [operoz-f0-merge-upstream.md](./operoz-f0-merge-upstream.md)         | ✅                                |

---

## 2. Smoke automático (executado)

| Check                                             | Resultado                                                |
| ------------------------------------------------- | -------------------------------------------------------- |
| `./scripts/run-f0-smoke.sh`                       | **18/18 passed** (smoke API + contract board)            |
| `./scripts/run-f0-e2e.sh`                         | **9/9 passed** (smoke + login UI + criar board/issue UI) |
| API `GET /api/instances/`                         | **200** (incluído no pytest)                             |
| Web `GET /`                                       | **200** (auth smoke)                                     |
| Docker stack (api, db, redis, mq, minio)          | **Up**                                                   |
| Workspace → board → projeto → issue               | **Coberto** em `test_operoz_f0_smoke.py`                 |
| Hub board (meta, issues, modules, members, roles) | **Coberto**                                              |

**Comando:** `./scripts/run-f0-smoke.sh` (instala `requirements/test.txt` no container se necessário).

**Pendente F1:** contract workspace (`test_workspace_app.py` no script); sub-issue/ciclo/intake E2E.

---

## 3. Correções ao gap tracker (código à frente da doc)

A documentação BC dizia «Fases 5–10 placeholder». O código mostra:

| Secção board settings           | Rota                       | Estado real                                          |
| ------------------------------- | -------------------------- | ---------------------------------------------------- |
| Informações                     | `…/page.tsx`               | ✅ `BoardInformationsForm`                           |
| Acesso                          | `…/acesso`                 | ✅ `BoardAccessSettings` + API `BoardMemberEndpoint` |
| Funções                         | `…/funcoes`                | ✅ `BoardRolesSettings` + `board_role.py`            |
| Tipos / Campos / Schema projeto | `…/tipos`, `…/campos`      | ✅ implementado (BC 2–4)                             |
| Notificações                    | `…/notificacoes`           | ✅ flags workspace + auditoria e-mail                |
| Automação                       | `…/automacao`              | 🟡 coming soon                                       |
| Quadro / Cronograma             | `…/quadro`, `…/cronograma` | 🟡 coming soon                                       |

**Conclusão:** próximo trabalho de board **não** é reimplementar Fase 5 — é **validar** acesso/funções e implementar **Fase 6+** (notificações, automação, quadro, cronograma).

---

## 4. Descobertas técnicas

| Tópico                  | Detalhe                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `@/plane-web`           | Alias → `apps/web/ce/`                                                     |
| Board hub M2            | Rotas: `backlog`, `list`, `views`, `timeline`, `calendar`                  |
| `MembersActivityButton` | Stub vazio; `mutateWorkspaceMembersActivity` no-op em `ce/store/workspace` |
| API audit membros       | **Sem endpoint** encontrado — precisa API + UI (F1)                        |
| Initiatives / Customers | Sem modelos em `db/models/`                                                |
| Dashboard               | `DeprecatedDashboard` (migração 0090)                                      |
| Integrações             | Modelos `github.py`, `slack.py` existem                                    |

---

## 5. Regra de condução (acordada)

Seguir sempre, por ordem:

1. **Auditar** — código > documentação desatualizada
2. **Validar** — smoke no que já existe
3. **Completar** — fatia vertical (API + UI + permissões)
4. **Construir** — só o que auditou como `AUSENTE`
5. **Uma onda fechada** — sem saltar fases do [plano completo](./operoz-paridade-plane-plano-completo.md)

---

## 6. Próximo passo correto (pós-F0)

| Ordem | Tarefa                                   | Fase            |
| ----- | ---------------------------------------- | --------------- |
| 1     | ~~F0 smoke~~                             | ✅              |
| 2     | ~~W07~~ — auditoria membros              | ✅              |
| 3     | ~~W10/W11~~ — Owner + transfer ownership | ✅ — validar UI |
| 4     | ~~F1-3~~ — Import CSV membros (W06)      | ✅              |
| 5     | ~~F1 workspace smoke manual~~            | ✅ jun/2026     |
| 6     | ~~F2 Board Fase 6 — Notificações~~       | ✅ — validar UI |
| 7     | Board Fase 7 — Automação                 | F2/BC           |
| 8     | W13 Power K (se fechar F1 100%)          | F1              |

**F1 fechada** (exceto W13 Power K parcial). Próxima onda: **F2 Boards**.

---

## 7. Smoke UI — registo

_Preencher após execução manual._

| Secção      | Data    | OK? | Bugs                                        |
| ----------- | ------- | --- | ------------------------------------------- |
| A Workspace | 2026-06 | ☑   | W03–W07, W10–W12, W14 validados manualmente |
| B Board     |         |     | Próximo smoke F2                            |
| C Projeto   |         |     |                                             |
