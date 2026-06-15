# PRD Review — templates Operoz (Fase 0)

Assets reutilizáveis para PRDs com **aprovação**, **feedback** e **comentários em trecho**, extraídos do protótipo `PRD/PRD-MAGALU.html`.

## Ficheiros

| Ficheiro                         | Função                                             |
| -------------------------------- | -------------------------------------------------- |
| `prd-review.css`                 | Estilos do banner, comentários, trechos, impressão |
| `prd-review/manifest.js`         | Leitura de `#operoz-prd-config`                    |
| `prd-review/storage-local.js`    | Modo `preview` (localStorage)                      |
| `prd-review/storage-api.js`      | Modo `guest` (API — Fase 1+)                       |
| `prd-review/review-core.js`      | Lógica UX (comentários, aprovar, resumo)           |
| `prd-review/init.js`             | `initPrdReview(config)`                            |
| `template-base.html`             | Esqueleto mínimo                                   |
| `operoz-prd-config.example.json` | Manifesto de exemplo                               |

## Uso num HTML standalone

```html
<link rel="stylesheet" href="prd-review.css" />
<script type="application/json" id="operoz-prd-config">
  { ... }
</script>
<!-- markup: approval-banner, content#content, overlays — copiar de PRD-MAGALU.html -->
<script src="prd-review/manifest.js"></script>
<script src="prd-review/storage-local.js"></script>
<script src="prd-review/storage-api.js"></script>
<script src="prd-review/review-core.js"></script>
<script src="prd-review/init.js"></script>
<script>
  initPrdReview({ mode: "preview", docTitle: "Meu PRD" });
</script>
```

## `initPrdReview(config)`

| Campo                    | Descrição                                          |
| ------------------------ | -------------------------------------------------- |
| `mode`                   | `preview` (default) ou `guest`                     |
| `docTitle`               | Título no resumo de feedback                       |
| `storageKey`             | Chave localStorage (preview)                       |
| `feedbackEmail`          | Referência interna (notificação futura)            |
| `contentId`              | Id do container (default `content`)                |
| `apiBase` / `guestToken` | Modo guest (Fase 2)                                |
| `autoInit`               | Chamar `initApprovalAndComments` quando DOM pronto |

## Operoz (embed)

1. Copiar pasta `templates/prd/` para asset HTML ou servir estático.
2. Incluir scripts na ordem acima.
3. Upload via `html-document-embed` na página de documentação.
4. Fase 3: MCP cria sessão review + convites após upload.

## Documentação

- ADR: `Operis/docs/adr/operis-prd-review-architecture.md`
- Roadmap: `Operis/docs/operis-prd-review-roadmap.md`
- Backlog: `operoz_prd_review_catalog.py`

## Próximo passo

**Fase 1 — Backend:** modelos `PageReviewSession`, `PageReviewInvite`, `PageReviewComment` e APIs guest.
