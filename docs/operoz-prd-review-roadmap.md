# PRD Review Operoz — Roadmap Estratégico

**Produto:** Operoz · **Projeto backlog:** `OPEROZDP` · **Prefixo cards:** `[ OPEROZ ]`  
**Protótipo UX:** `PRD/PRD-MAGALU.html`  
**ADR:** [operoz-prd-review-architecture.md](./adr/operoz-prd-review-architecture.md)  
**Catálogo seed:** `operoz/db/management/commands/operoz_prd_review_catalog.py`  
**SDK Fase 0:** `Operoz/templates/prd/`  
**Última revisão:** 2026-06-14

## Visão

Permitir que clientes **aprovem** ou **solicitem ajustes** em PRDs entregues via Operoz, com comentários por seção e trecho, acesso controlado por **e-mail**, e feedback persistido para a equipa T4H — substituindo localStorage e cópia manual de resumo.

## Requisitos de negócio

| #   | Requisito                         | Fase |
| --- | --------------------------------- | ---- |
| 1   | Cliente aprova ou envia feedback  | 1, 2 |
| 2   | Liberar acesso por e-mail         | 2    |
| 3   | Feedback guardado no Operoz       | 1, 4 |
| 4   | Comentário em trecho seleccionado | 0, 2 |
| 5   | Config padronizada no MCP         | 0, 3 |
| 6   | Criação PRD padrão com review     | 0, 3 |

## Fases do programa

| Fase | Módulo backlog                                | Foco                                   | Estado                                  |
| ---- | --------------------------------------------- | -------------------------------------- | --------------------------------------- |
| G    | PRD REVIEW — GOVERNANÇA E ROADMAP             | ADR, roadmap doc                       | **Concluído**                           |
| 0    | PRD REVIEW — FASE 0 — PADRONIZAR ARTEFATO     | Template, SDK, manifesto, scaffold MCP | **Concluído**                           |
| 1    | PRD REVIEW — FASE 1 — BACKEND REVIEW          | Modelos + API workspace/guest          | **Concluído**                           |
| 2    | PRD REVIEW — FASE 2 — ACESSO EMAIL E UI GUEST | Convites, página guest, e-mail         | **Concluído**                           |
| 3    | PRD REVIEW — FASE 3 — INTEGRAÇÃO MCP          | Tools MCP + skill Harness              | **Concluído**                           |
| 4    | PRD REVIEW — FASE 4 — FEEDBACK NA OPERAÇÃO    | Inbox, sync épico, assistente          | **Concluído**                           |
| 5    | PRD REVIEW — FASE 5 — POLIMENTO               | RBAC, métricas, i18n, PDF opcional     | Em curso (PDF export opcional pendente) |

## Matriz de dependências

| Fase | Depende de    | Desbloqueia          |
| ---- | ------------- | -------------------- |
| G    | —             | 0–5                  |
| 0    | G (ADR)       | SDK + manifesto      |
| 1    | 0 (manifesto) | 2, 3 API             |
| 2    | 1             | Cliente em produção  |
| 3    | 1, 2          | Automação agente MCP |
| 4    | 2             | Operação T4H         |
| 5    | 2             | Go-live enterprise   |

## Checklist MCP — subir PRD cliente

1. `operoz_create_page` (ou equivalente) no projecto do cliente
2. Upload asset HTML (`PRD-*.html`) com manifesto `#operoz-prd-config`
3. `operoz_update_page_description` — embed `html-document-embed` fullBleed
4. _(Fase 3)_ `operoz_create_prd_review_session`
5. _(Fase 3)_ `operoz_add_prd_review_invites` (e-mails stakeholders)
6. _(Fase 4)_ Card épico linked + automação notificação

## Execução backlog

```bash
docker compose -f Operoz/docker-compose-local.yml exec api \
  python manage.py seed_operoz_plataforma_violenta --workspace operoz
```

Marcar cards Done após verificação:

```bash
docker compose -f Operoz/docker-compose-local.yml exec api \
  python manage.py mark_operoz_cards_done --workspace operoz
```

## Changelog

| Data       | Fase    | Notas                                                  |
| ---------- | ------- | ------------------------------------------------------ |
| 2026-06-14 | G, 0    | ADR proposto; roadmap; SDK base em `templates/prd/`    |
| 2026-06-14 | Backlog | 7 módulos, 32 cards via `operoz_prd_review_catalog.py` |
