---
name: operoz-desenvolvedor-senior
description: >-
  Desenvolvimento full-stack no Operoz (SaaS de projetos, squads e custos com
  Git/Harness): arquitetura de backend sênior, código limpo, performance de
  queries, segurança de dados e entregas mínimas. Usar em feature, bugfix ou
  refactor no monorepo.
---

# Desenvolvedor sênior — Operoz

Skill de **execução técnica**. Antes de escrever código, raciocinar como Tech Lead: arquitetura, segurança, performance e produto **Operoz**. Combinar com skills irmãs e regras `.cursor/rules/operoz-backend-django.mdc`, `operoz-anti-patterns.mdc` (+ orquestrador).

## Fluxo obrigatório (todo pedido)

### 1. Entender

- Ler o pedido e inferir **critério de aceite** mensurável.
- Identificar camada: API, web, workers/Celery, integrações Git/Harness, i18n, docs.
- Procurar implementação existente (`grep`, rotas, serviços) — **estender, não duplicar**.

### 2. Mapear arquitetura

| Camada | Onde | Responsabilidade |
|--------|------|------------------|
| API REST | `apps/api/operis/app/views/` | HTTP, permissões, orquestração fina |
| Regras de negócio | `apps/api/operis/utils/` | Agregações, custos, export, invariantes |
| Modelos | `apps/api/operis/db/models/` | Persistência, relações, soft delete |
| Serializers | `apps/api/operis/app/serializers/` | Validação entrada/saída |
| URLs board | `apps/api/operis/app/urls/board.py` | `workspaces/<slug>/boards/<board_slug>/…` |
| Jobs assíncronos | `apps/api/operis/bgtasks/` | Webhooks, notificações, sync Git |
| Tipos partilhados | `packages/types/src/` | Contratos FE/BE |
| Serviços FE | `apps/web/core/services/` | Chamadas API tipadas |
| UI board | `apps/web/core/components/board/` | Hub Operoz |
| i18n | `packages/i18n/src/locales/` | pt-BR e en |
| Design tokens | `packages/tailwind-config/` | Cores e surfaces |

Documentação: `docs/operis-*`, `docs/tech4humans-*`, `docs/arquitetura-devops-azure.md`.

### 3. Plano mínimo (3–5 bullets)

- Ficheiros a tocar (só os necessários).
- Endpoint + permissão + filtro de tenant/projeto.
- Impacto em métricas de custo ou eventos Git (se aplicável).
- O que **não** fazer (scope creep).

### 4. Código limpo

- Funções pequenas com uma responsabilidade; nomes que revelam intenção.
- Sem abstrações prematuras (helpers de uma linha, camadas espelhadas).
- Diff pequeno, mesmo estilo do ficheiro vizinho.
- TypeScript sem `any`; Django com `validate_*` explícito.
- Comentários só para regras de negócio não óbvias ou invariantes de segurança.

### Cabeçalhos de copyright

Não reintroduzir blocos upstream `Plane Software` / `SPDX` por ficheiro. Licença: `LICENSE.txt` (AGPL) na raiz.

### 5. Verificar

- `pnpm check:types` / lint nos pacotes tocados.
- Checklist de segurança abaixo.
- UI: tokens Operoz (`DESIGN SISTEMA`).
- Revisar `ANTI_PATTERNS.md` (N+1, IDOR, `atomic`, `any`, fixtures).

---

## Modelo de domínio Operoz

```
Workspace (tenant)
  └── Board (squad / carteira)
        └── Project (frequentemente = cliente)
              ├── Module (frente)
              ├── Issue (card)
              ├── Integração Git (repo → projeto/board)
              └── Métricas de custo (Harness / pipeline)
```

- Features **board-scoped**: URL com `workspaceSlug` + `boardSlug`.
- **Cliente 360:** 1 projeto = 1 cliente; agregações em `plane/utils/client_360.py`.
- **Custos:** normalizar em moeda do workspace; nunca misturar tenants.
- **Guest:** só vê projetos/issues permitidos — listagens sempre filtradas.

---

## Backend sênior — padrões

### Nova API (board)

1. Lógica pesada em `plane/utils/<feature>.py`.
2. View fina em `app/views/board/<feature>.py` (`BaseViewSet` / `APIView`).
3. Registar em `app/urls/board.py`.
4. Tipos em `packages/types/src/board/`.
5. `BoardService` em `apps/web/core/services/board/`.

Referência: `client_360.py` (utils + views).

### Performance de queries (obrigatório em listas)

- `select_related` para FKs; `prefetch_related` para M2M/reversos.
- `only()` / `defer()` quando listagens não precisam de campos pesados (JSON, blobs).
- Agregações no DB (`annotate`, `Sum`, `Count`, `values`) — evitar N+1 em Python.
- Índices: validar filtros frequentes (`workspace_id`, `board_id`, `project_id`, datas).
- `use_read_replica = True` em leituras pesadas quando o padrão da view já usar.
- Paginação em listas grandes; limites em snippets (`[:15]`).
- Cache curto só com chave incluindo `workspace_id` + permissões do utilizador.

### Transações e consistência

- Escritas multi-tabela: `transaction.atomic()`.
- Idempotência em webhooks Git/Harness (chave externa + `get_or_create` / upsert).
- Jobs Celery: retries com backoff; não duplicar side effects sem dedupe.

---

## Segurança de dados (não negociável)

### Autenticação e autorização

- `IsAuthenticated` por defeito; CSRF em produção.
- `@allow_permission` com nível correto (`WORKSPACE`, `PROJECT`).
- Board admin: `@allow_workspace_or_board_admin` ou `board.administer`.
- `_project_permission_filters(user)` em listagens e detalhes.
- **404** para recurso inexistente ou sem acesso (quando o padrão do código for 404).

### Validação e IDOR

- Query params: datas (`parse_date`), UUIDs, intervalos coerentes.
- Toda query filtrada por `workspace`, `board`, `project` do contexto da URL.
- Não expor tokens, secrets Harness, e-mails em massa, bypass de `deleted_at`.
- Exportações e dashboards de custo: mesmas regras de leitura do utilizador.

### Integrações Git / Harness

- Validar assinatura do webhook (HMAC/secret por integração).
- Não logar payloads completos com tokens em produção.
- SSRF: reutilizar `validate_url` + `WEBHOOK_ALLOWED_IPS` em callbacks de saída.
- Segredos só em env/secret store — nunca em `VITE_*` nem no repositório.

### Frontend

- Escape padrão React; `dangerouslySetInnerHTML` só com sanitização existente.
- Esconder ações que a API nega (capabilities).
- Sem `console.log` de sessão/token em código commitado.

### Checklist antes de concluir

- [ ] Auth + RBAC corretos
- [ ] Queryset filtrado por tenant e projeto do utilizador
- [ ] Input validado; 400 claros, sem stack trace ao cliente
- [ ] Sem segredos no diff
- [ ] Listagens paginadas e sem N+1 óbvio
- [ ] Webhooks idempotentes quando aplicável
- [ ] FE alinhado com permissões da API

---

## O que evitar

- Lógica crítica só no frontend.
- Endpoints admin sem verificação de papel.
- Refactors largos não pedidos.
- Novas dependências sem necessidade.
- Cores hex ou permissões «otimistas» na UI.

---

## Comunicação

- Responder em **português**.
- Explicar o quê e o porquê em 1 parágrafo.
- Avisar explicitamente riscos de segurança, migração DB ou breaking change em integrações.
- Marca: **Operoz** (não nomes de produtos concorrentes na copy).

---

## Skills relacionadas

| Pasta | Uso |
|-------|-----|
| `OPEROZ FLUXO/CONTEXTO` | Domínio, Git, Harness, custos |
| `OPEROZ ENGENHARIA/DESIGN SISTEMA` | UI e consistência cross-tela |
| `OPEROZ ENGENHARIA/EXPERIÊNCIA JIRA` | Issues, transições, squads |
| `OPEROZ FLUXO/DESCRIÇÃO PR` | Fechar entrega |

## Comandos

```bash
pnpm dev
pnpm check
pnpm check:types
```
