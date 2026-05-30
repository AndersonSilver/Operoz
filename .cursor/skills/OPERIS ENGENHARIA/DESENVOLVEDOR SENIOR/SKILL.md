---
name: operis-desenvolvedor-senior
description: >-
  Desenvolvimento full-stack no Operis com arquitetura do monorepo, segurança
  rigorosa (auth, RBAC, filtros de projeto, validação) e entregas mínimas e
  corretas. Usar em qualquer pedido de feature, bugfix ou refactor no Operis.
---

# Desenvolvedor sênior — Operis OS

Skill de **execução técnica**. Antes de escrever código, raciocinar como arquiteto + segurança + produto Operis. Combinar com `operis-contexto`, `DESIGN SISTEMA` e `.cursorrules`.

## Fluxo obrigatório (todo pedido)

### 1. Entender

- Ler o pedido e inferir **critério de aceite** (o que prova que está feito).
- Identificar camada: API, web, ambos, i18n, docs.
- Procurar implementação existente (`grep`, rotas, serviços) — **estender, não duplicar**.

### 2. Mapear arquitetura

| Camada | Onde | Responsabilidade |
|--------|------|------------------|
| API REST | `apps/api/operis/app/views/` | HTTP, permissões, orquestração fina |
| Regras de negócio | `apps/api/operis/utils/` | Agregações, export, invariantes reutilizáveis |
| Modelos | `apps/api/operis/db/models/` | Persistência, relações |
| Serializers | `apps/api/operis/app/serializers/` | Validação entrada/saída |
| URLs board | `apps/api/operis/app/urls/board.py` | Rotas `workspaces/<slug>/boards/<board_slug>/…` |
| Tipos partilhados | `packages/types/src/` | Contratos FE/BE |
| Serviços FE | `apps/web/core/services/` | Chamadas API tipadas |
| UI board Operis | `apps/web/core/components/board/` | Componentes, rotas hub |
| i18n | `packages/i18n/src/locales/` | pt-BR e en |
| Design tokens | `packages/tailwind-config/` | Cores e surfaces |

Documentação interna: `docs/operis-*`, `docs/tech4humans-*`, `docs/arquitetura-devops-azure.md`.

### 3. Plano mínimo (mental ou 3–5 bullets)

- Ficheiros a tocar (só os necessários).
- Endpoint + permissão + filtro de projeto (se aplicável).
- Componente + serviço + chaves i18n.
- O que **não** fazer (scope creep).

### 4. Implementar

- Diff pequeno, legível, mesmo estilo do ficheiro vizinho.
- Sem `any` em TypeScript; validação explícita em serializers Django.

### Cabeçalhos de copyright

Os blocos upstream `Copyright … Plane Software` + `SPDX-License-Identifier` foram **removidos em massa** do monorepo (mai/2026). **Não** voltar a acrescentar esse cabeçalho em ficheiros novos ou copiados. Licença do projeto: `LICENSE.txt` (AGPL) na raiz.

### 5. Verificar

- `pnpm check:types` / lint nos pacotes tocados quando fizer sentido.
- Cenários de segurança abaixo (mentais ou testes existentes do módulo).
- UI: tokens Operis (`DESIGN SISTEMA`), não hex fixos.

---

## Modelo de domínio Operis (decisões de arquitetura)

```
Workspace
  └── Board (time / carteira)
        └── Project (muitas vezes = cliente)
              ├── Module (frente)
              ├── Issue (card)
              └── BoardStatusReport
```

- Features **board-scoped**: URL sempre com `workspaceSlug` + `boardSlug`.
- **Cliente 360:** 1 projeto = 1 cliente; agregações em `plane/utils/client_360.py`.
- **Permissões board:** catálogo `permission_key` (ex. `board.administer`); ver `board_access.py`, `board_permission_enforcement.py`.
- **Guest:** só vê projetos/issues permitidos — nunca listar sem filtro.

---

## Segurança — nível alto (não negociável)

### Autenticação e autorização

- API: `DEFAULT_PERMISSION_CLASSES = IsAuthenticated`; sessão/cookies com CSRF em produção.
- Decorar views com `@allow_permission` e nível correto (`WORKSPACE`, `PROJECT`).
- Settings sensíveis do board: `@allow_workspace_or_board_admin` ou chave `board.administer`.
- **Listagens e detalhes** de dados por projeto/issue:
  - Reutilizar `_project_permission_filters(user)` (ver `board/meta.py`, `client_360.py`).
  - Projetos acessíveis: membro ativo em `project_projectmember`.
- Retornar **404** para recurso inexistente ou **sem acesso** (evitar 403 que revela existência quando o padrão do código for 404).

### Validação de entrada

- Query params: validar datas (`parse_date`), intervalos (`period_end >= period_start`), UUIDs.
- Body: serializers com `validate_*`; nunca confiar só no frontend.
- Slugs: validadores existentes (`slug_validator`, listas restritas).
- Limitar listas (`[:15]` em snippets), paginação em listas grandes.

### IDOR e vazamento de dados

- Toda query filtrada por `workspace__slug`, `board_id`, `project_id` do contexto da URL — não aceitar IDs de outro tenant.
- Não expor campos internos (tokens, emails em massa, `deleted_at` bypass).
- Exportações (status report): mesmas regras de leitura do utilizador.

### Frontend

- Não guardar segredos em `VITE_*` além do que já é público por desenho.
- Renderizar texto de utilizador com escape padrão React; cuidado com `dangerouslySetInnerHTML` (só onde já houver sanitização do editor).
- Não logar tokens/sessão em `console.log` em código commitado.

### Dados sensíveis e compliance

- Não commitar `.env`, chaves API, passwords.
- IA (`ai-assistant`): enviar só payload necessário; sem PII desnecessária no prompt.
- Rate limit: respeitar throttles DRF; não criar endpoints abertos sem auth.

### Checklist antes de dar por concluído

- [ ] Endpoint exige utilizador autenticado
- [ ] Papel/permissão board ou workspace corretos
- [ ] Queryset filtrado por projeto/issue do utilizador
- [ ] Input validado; erros 400 claros, sem stack trace ao cliente
- [ ] Sem segredos no diff
- [ ] Sem bypass de `deleted_at` / `archived_at` sem regra de negócio
- [ ] FE não assume permissão que a API nega (esconder ação se capability false)
- [ ] Sem cabeçalho copyright upstream reintroduzido nos ficheiros tocados

---

## Padrões de implementação

### Nova API (board)

1. Lógica pesada em `plane/utils/<feature>.py`.
2. View fina em `app/views/board/<feature>.py` com `BaseViewSet` ou `APIView`.
3. Registar em `app/urls/board.py` e export em `views/board/__init__.py`.
4. Tipos em `packages/types/src/board/`.
5. `BoardService` em `apps/web/core/services/board/board.service.ts`.

Exemplo de referência: `client_360.py` + `client_360.py` (utils).

### Frontend

- Rotas: `apps/web/app/routes/core.ts` + hub `board-hub-nav-link`.
- Estado: MobX stores em `core/store` ou SWR com config explícita (evitar retry agressivo — ver `CLIENT_360_SWR_CONFIG`).
- Componentes Operis em `core/components/board/<feature>/`.
- Traduções: `boards.*` em pt-BR e en.

### Performance

- `select_related` / `prefetch_related` em listas.
- `use_read_replica = True` em leituras pesadas quando o padrão da view já usar.
- Agregações no DB (`annotate`, `values`) em vez de N+1 em Python.

### O que evitar

- Reintroduzir cabeçalho `Plane Software` / `SPDX-License-Identifier` por ficheiro (removido globalmente).
- Lógica de negócio crítica só no frontend.
- Endpoints «admin» sem verificação de papel.
- Copiar código de outro módulo sem adaptar filtros de permissão.
- Refactors largos não pedidos.
- Novas dependências npm/pip sem necessidade.

---

## Comunicação com o utilizador

- Responder em **português**.
- Explicar **o que** mudou e **porquê** (1 parágrafo).
- Se houver risco de segurança ou migração DB, **avisar explicitamente**.
- Marca: **Operis**, não nomes de produtos externos na copy.

---

## Skills relacionadas

| Pasta | Uso |
|-------|-----|
| `OPERIS FLUXO/CONTEXTO` | Domínio e marca |
| `OPERIS ENGENHARIA/DESIGN SISTEMA` | UI e tokens |
| `OPERIS ENGENHARIA/EXPERIÊNCIA JIRA` | Layout denso de issues |
| `OPERIS FLUXO/DESCRIÇÃO PR` | Ao fechar entrega |

---

## Referência rápida de comandos

```bash
pnpm dev          # frontends
pnpm check        # format + lint + types
pnpm check:types  # só TypeScript
```

API local: ver `docker-compose-local.yml` / `CONTRIBUTING.md`.
