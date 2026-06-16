# Harness — Subir PRD cliente (review Operoz)

Runbook para agentes Harness publicarem um PRD HTML no workspace do cliente e activar **review guest** (aprovação + feedback) via MCP Operis.

**Quando usar:** entrega PRD T4H, replicação do fluxo Magalu, card `- HARNESS — SKILL SUBIR PRD CLIENTE`.  
**Pré-requisitos:** MCP `operis` autenticado (`operis_sign_in`), workspace/projecto do cliente identificados.  
**Referências:** [operis-prd-review-roadmap.md](../../../Operis/docs/operis-prd-review-roadmap.md) · [templates/prd/](../../../Operis/templates/prd/) · protótipo `PRD/PRD-MAGALU.html`  
**UX modal convites / guest:** `Operis/.cursor/skills/OPEROZ ENGENHARIA/SKILL.md` §10 (copiar link, estados, sem URL crua)

## Constantes backlog

| Chave            | Valor        |
| ---------------- | ------------ |
| Workspace dev    | `operoz`     |
| Projeto programa | `OPEROZDP`   |
| Prefixo cards    | `[ OPEROZ ]` |

## Artefacto PRD (Fase 0)

1. Partir de `Operis/templates/prd/template-base.html` ou copiar estrutura de `PRD/PRD-MAGALU.html`.
2. Incluir manifesto JSON em `<script type="application/json" id="operoz-prd-config">` (ver `operoz-prd-config.example.json`).
3. Campos obrigatórios: `operoz_prd_version`, `document_type`, `title`, `client`, `review_enabled: true`, `sections` (ids estáveis).
4. Importar SDK na ordem documentada em `Operis/templates/prd/README.md` **ou** deixar o backend injectar SDK em modo guest (Fase 2+).
5. Cada secção comentável usa `id` listado em `sections` (ex. `sec-contexto`).

## Checklist MCP (ordem fixa)

```text
1. operis_sign_in
2. operis_create_page
3. Upload asset HTML + operis_update_page_description (embed)
4. operis_create_prd_review_session
5. operis_add_prd_review_invites
6. operis_get_prd_review_status (poll até cliente responder)
7. operis_list_prd_review_comments (gerar ajustes / cards)
```

### 1. Sessão app

```text
operis_sign_in → email/senha membro T4H com acesso ao projecto cliente
```

### 2. Criar página de documentação

Tool: `operis_create_page` (`domain: pages`)

| Parâmetro        | Valor                                                |
| ---------------- | ---------------------------------------------------- |
| `workspace_slug` | slug do workspace cliente                            |
| `project_id`     | UUID do projecto                                     |
| body `name`      | título legível (ex. «PRD Pós-Contemplação — Magalu») |

Guardar `page_id` da resposta.

### 3. Publicar HTML (embed fullBleed)

**Opção A — UI:** editor da página → bloco `html-document-embed` apontando ao asset HTML.

**Opção B — MCP:** `operis_update_page_description` com HTML contendo:

```html
<html-document-embed src="{asset_id}" title="PRD Cliente" fullBleed="true"></html-document-embed>
```

O asset HTML deve incluir o manifesto `#operoz-prd-config` e conteúdo PRD. Sem manifesto válido, a sessão review pode falhar na validação interna.

### 4. Criar sessão de review

Tool: `operis_create_prd_review_session`

| Parâmetro              | Valor                              |
| ---------------------- | ---------------------------------- |
| `workspace_slug`       | slug                               |
| `project_id`           | UUID projecto                      |
| `page_id`              | UUID página                        |
| body `send`            | `true` (marca sessão como enviada) |
| body `page_version_id` | opcional — versão específica       |

Resposta: `id` da sessão (`session_id`).

### 5. Convites por e-mail

Tool: `operis_add_prd_review_invites`

| Parâmetro              | Valor                              |
| ---------------------- | ---------------------------------- |
| `session_id`           | da etapa anterior                  |
| body `emails`          | `["stakeholder@cliente.com", ...]` |
| body `expires_in_days` | ex. `14` (default 7)               |
| body `message`         | opcional — texto no e-mail         |

Resposta: lista com `url`, `token`, `email` por convite. URLs guest: `/guest/prd-review/{token}`.

E-mail transacional dispara via Celery (`prd_review_invite_email`) quando fila activa.

### 6. Acompanhar estado

Tool: `operis_get_prd_review_status` (GET detalhe sessão)

Estados: `draft` → `sent` → `approved` | `changes_requested`.

Poll até `approved` ou `changes_requested` antes de fechar entrega.

### 7. Ler comentários

Tool: `operis_list_prd_review_comments` (mesmo endpoint detalhe sessão)

Output inclui `section_comments` e `inline_comments` — usar para cards de ajuste (Fase 4: sync épico).

## Verificação (gate Harness)

Antes de marcar cards Done:

```bash
docker compose -f Operis/docker-compose-local.yml exec -T api \
  python -m pytest operis/tests/contract/app/test_prd_review.py -q
```

Todos os testes devem passar, incluindo `test_guest_render_html_includes_sdk`.

## Marcar backlog

1. Acrescentar títulos verificados a `COMPLETED_CARD_TITLES` em `mark_operoz_cards_done.py`.
2. Executar:

```bash
docker compose -f Operis/docker-compose-local.yml exec api \
  python manage.py mark_operoz_cards_done --workspace operoz
```

## Erros comuns

| Sintoma              | Acção                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| 404 page/project     | Confirmar `project_id` e membership                                        |
| Guest 410            | Convite expirado — criar novo convite                                      |
| Aprovar bloqueado    | Cliente tem comentários — usar `feedback`                                  |
| SDK ausente no guest | Verificar volume `templates/prd` no Docker e `inject_guest_prd_review_sdk` |

## Fora de âmbito (Fase 4+)

- Sync automático comentários → card épico (`epic_key` no manifesto)
- Inbox workspace «PRDs aguardando feedback»
- Card épico linked na criação (manual por agora)
