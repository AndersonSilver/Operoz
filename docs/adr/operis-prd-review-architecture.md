# ADR — Arquitetura PRD Review Operoz

**Status:** Proposto · **Data:** 2026-06-14 · **Programa:** OPEROZDP / PRD Review

## Contexto

A T4H entrega PRDs a clientes como HTML rico (protótipo: `PRD/PRD-MAGALU.html`). O documento inclui:

- Banner **Aprovar projeto** / **Enviar feedback**
- Comentários por **seção** (`btn-comment`)
- Comentários em **trecho** (seleção → marcador amarelo + lista por seção)
- Persistência actual em **localStorage**; resumo copiável/imprimível

No Operoz, a documentação vive em **Pages** com embed `html-document-embed` (iframe sandbox `allow-scripts`). Existe guest link para QBR (`Client360QbrGuestLink`) mas **não** para review de PRD. O backlog OPEROZDP define o programa em `operoz_prd_review_catalog.py` (7 módulos, 32 cards).

## Decisões

### 1. Sessão de review por versão de página

- **Decisão:** Cada envio ao cliente cria `PageReviewSession` ligada a `Page` + `PageVersion`.
- **Estados:** `draft` → `sent` → `approved` | `changes_requested`.
- **Alternativa rejeitada:** Comentários directamente na Page sem sessão — impossível distinguir rodadas de feedback.

### 2. Convite guest por e-mail

- **Decisão:** `PageReviewInvite` com token opaco, TTL e revogação — mesmo padrão de `Client360QbrGuestLink`.
- **Identidade:** `author_email` nos comentários = e-mail do convite (sem conta Operoz).
- **Rota guest:** `GET /api/guest/prd-review/{token}/` + `POST …/comments/` + `POST …/submit/`.

### 3. Tipos de comentário

| Tipo      | Campos                                  | Origem UX                 |
| --------- | --------------------------------------- | ------------------------- |
| `section` | `section_id`, `body`                    | Botão «Comentar» na seção |
| `inline`  | `section_id`, `quote`, `anchor`, `body` | «Comentar neste trecho»   |

- **Decisão:** `anchor` JSON (offsets ou hash do trecho) para rehidratação quando o HTML muda ligeiramente.
- **Regra:** **Aprovar** bloqueado se existir qualquer comentário (comportamento do protótipo Magalu).

### 4. SDK desacoplado do HTML monolítico

- **Decisão:** Módulo `@operoz/prd-review` (assets em `Operoz/templates/prd/prd-review/`) com `initPrdReview(config)`.
- **Modos:** `preview` (localStorage, equipa interna) e `guest` (API persistida).
- **Manifesto:** `<script type="application/json" id="operoz-prd-config">` validado no upload MCP.
- **Alternativa rejeitada:** Duplicar 900 linhas de JS em cada PRD de cliente.

### 5. Entrega do PRD ao cliente

- **Decisão (Fase 1):** Shell nativa Operoz em `/guest/prd-review/{token}` com iframe read-only do HTML; SDK em `embeddedGuest` só detecta seleção, marca trechos e emite `postMessage`; chrome (aprovar, feedback, comentários inline) no React parent.
- **Decisão (longo prazo):** Manter **html-document-embed** para preview interno; guest usa iframe + bridge até migração a blocos nativos (opção C).
- **Alternativa rejeitada (agora):** Reimplementar layout PRD nativo no React — custo alto; HTML T4H já está brandado.

### 6. Persistência de feedback para a equipa

- **Decisão:** API workspace `…/pages/{id}/review-sessions/` + painel «Review» na documentação.
- **Fase 4:** Sync opcional para card épico (ex. OPS-1483) e automação `feedback_submitted`.

### 7. MCP e criação padronizada

- **Decisão:** Tools dedicadas (`operoz_create_prd_review_session`, `operoz_add_prd_review_invites`, …) + skill Harness checklist.
- **Ordem:** create page → upload HTML → embed → manifesto → sessão → convites.

## API (esboço)

```text
POST   /api/workspaces/{slug}/projects/{pid}/pages/{page_id}/review-sessions/
GET    /api/workspaces/{slug}/projects/{pid}/pages/{page_id}/review-sessions/
GET    /api/guest/prd-review/{token}/
POST   /api/guest/prd-review/{token}/comments/
POST   /api/guest/prd-review/{token}/submit/   # { action: "approve" | "feedback" }
```

## Segurança

- Token guest: só leitura do PRD da sessão + escrita de comentários próprios; sem enumeração de workspace.
- Membro Operoz: RBAC project/page para criar convites e fechar sessão.
- iframe sandbox mantém scripts do PRD isolados; API guest usa CORS/cookie-less token na URL.

## Rollback

- PRDs sem `review_enabled` no manifesto comportam-se como documento estático.
- Modo `preview` continua com localStorage se API indisponível.

## Referências

- Protótipo: `PRD/PRD-MAGALU.html`
- SDK Fase 0: `Operoz/templates/prd/`
- Catálogo: `operoz/db/management/commands/operoz_prd_review_catalog.py`
- Guest QBR: `Client360QbrGuestLink`, `operoz/app/views/guest/client_360_qbr.py`
- HTML embed: `packages/editor/src/core/extensions/html-document/`
- Roadmap: [operoz-prd-review-roadmap.md](../operoz-prd-review-roadmap.md)
