# F0-2 — Smoke (workspace → board → projeto → issue)

## Automação E2E Playwright (UI)

Cobre as secções **A–C** do checklist na interface (com sessão via API + navegação real no browser).

### Instalação (uma vez)

```bash
cd Operoz
pnpm setup:playwright
# ou: ./scripts/install-playwright.sh
```

Instala `@playwright/test` + Chromium em `~/.cache/ms-playwright/`.  
No próximo `pnpm install`, o `postinstall` do pacote `e2e` só instala o browser se ainda não existir.

**Não precisas do modo UI** para correr os testes — o padrão é headless (terminal só).

### Executar

```bash
# Pré-requisitos: docker compose up + pnpm dev

# Padrão — headless, rápido (recomendado)
pnpm test:f0:e2e

# Opcional — só para debug visual
pnpm test:f0:e2e:headed   # janela Chrome
pnpm test:f0:e2e:ui       # painel gráfico Playwright
```

Ficheiros:

- `apps/e2e/src/f0-smoke.spec.ts` — 6 testes UI (+ 1 skip: login form quando instance não configurada)
- `apps/e2e/src/global-setup.ts` — seed API + cookies de sessão

**Última execução E2E:** 2026-06-05 — **9/9 passed** (login UI + criar board/issue pela UI)

---

## Automação API (recomendado)

A secção **D** e grande parte de **A–C** na camada API estão cobertas por testes pytest.

```bash
cd Operoz
./scripts/run-f0-smoke.sh          # usa container operoz-api-1 se estiver up
./scripts/run-f0-smoke.sh --local  # força execução local (apps/api)
```

Ficheiros:

- `apps/api/operoz/tests/smoke/test_operoz_f0_smoke.py` — 7 testes F0
- `apps/api/operoz/tests/smoke/test_auth_smoke.py` — auth + health

Alternativa dentro do container:

```bash
docker exec -w /code operoz-api-1 pip install -q -r requirements/test.txt
docker exec -w /code operoz-api-1 python -m pytest operoz/tests/smoke/ -m smoke -v
```

**Última execução automática:** 2026-06-04 — **9/9 passed**

---

## Smoke manual UI (opcional — substituído por Playwright)

Executar com stack local:

```bash
cd Operoz
docker compose -f docker-compose-local.yml up -d
pnpm dev
```

| URL                   | Serviço |
| --------------------- | ------- |
| http://localhost:3000 | Web     |
| http://localhost:8000 | API     |

**Flag:** `VITE_ENABLE_BOARDS=true` (default no fork).

---

## Checklist (marcar data + responsável)

### A. Workspace

| #   | Passo                               | OK  | Notas    |
| --- | ----------------------------------- | --- | -------- |
| A1  | Login / criar conta                 | ☐   |          |
| A2  | Criar workspace (nome + slug)       | ☐   |          |
| A3  | Settings → General: editar nome     | ☐   |          |
| A4  | Convidar membro (email)             | ☑   | jun/2026 |
| A5  | `Ctrl+K` — pesquisar projeto/issue  | ☑   | jun/2026 |
| A6  | Home — widgets visíveis             | ☑   | jun/2026 |
| A7  | Alternar workspace (se >1)          | ☑   |          |
| A8  | Import CSV membros (W06)            | ☑   | jun/2026 |
| A9  | Auditoria atividade membro (W07)    | ☑   | jun/2026 |
| A10 | Transfer ownership + apagar (owner) | ☑   | jun/2026 |

### B. Board

| #   | Passo                                         | OK  | Notas             |
| --- | --------------------------------------------- | --- | ----------------- |
| B1  | Sidebar lista boards                          | ☐   |                   |
| B2  | Criar board                                   | ☐   |                   |
| B3  | Hub **Resumo** (`/boards/{slug}`)             | ☐   | KPIs meta         |
| B4  | Tab **Backlog**                               | ☐   |                   |
| B5  | Tab **Lista**                                 | ☐   |                   |
| B6  | Tab **Quadro** (kanban agregado)              | ☐   |                   |
| B7  | Tab **Cronograma**                            | ☐   |                   |
| B8  | Tab **Calendário**                            | ☐   |                   |
| B9  | Tab **Views** (`/views`)                      | ☐   | F0-3: rota existe |
| B10 | Settings board `/{ws}/settings/boards/{slug}` | ☐   | Fases 1–4 vs 5–10 |
| B11 | Filtro por projeto no hub                     | ☐   |                   |

### C. Projeto

| #   | Passo                                               | OK  | Notas |
| --- | --------------------------------------------------- | --- | ----- |
| C1  | Criar projeto no board                              | ☐   |       |
| C2  | Abrir projeto — lista issues                        | ☐   |       |
| C3  | Criar issue (card)                                  | ☐   |       |
| C4  | Sub-issue (parent)                                  | ☐   |       |
| C5  | Layouts: lista, board, calendário, tabela, timeline | ☐   |       |
| C6  | Ciclo + módulo (se feature on)                      | ☐   |       |
| C7  | Intake (se feature on)                              | ☐   |       |

### D. API / regressão automatizada

| #   | Comando                                                  | OK  | Notas                                                     |
| --- | -------------------------------------------------------- | --- | --------------------------------------------------------- |
| D1  | `./scripts/run-f0-smoke.sh`                              | ☑   | 18 testes (9 smoke API + 9 contract board)                |
| D1b | `./scripts/run-f0-e2e.sh`                                | ☑   | 9 testes Playwright (6 smoke + 2 criação UI + 1 login UI) |
| D2  | `pytest operoz/tests/contract/app/test_workspace_app.py` | ☐   | Contract workspace (F1)                                   |
| D3  | `test_board_app.py`                                      | ☑   | Incluído em `run-f0-smoke.sh`                             |

---

## Critério F0-2 fechado

- [x] Secções A–C UI via Playwright (`run-f0-e2e.sh`)
- [x] D1 verde (`run-f0-smoke.sh`)
- [x] D1b verde (`run-f0-e2e.sh`)
- [ ] Plano para D3 (contract board completo) na F1

**Última execução API:** 2026-06-04 — 9/9 passed  
**Última execução UI:** 2026-06-05 — Playwright 6/6  
**Executor:** _preencher_
