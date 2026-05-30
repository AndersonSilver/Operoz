---
name: operis-contexto
description: >-
  Contexto de produto e linguagem para desenvolvimento no fork Operis
  (Tech4Humans). Usar em qualquer tarefa neste monorepo para manter
  nomenclatura, modelo de domínio e tom em português.
---

# Contexto Operis (para o agente)

Skill de **contexto geral**. Aplicar em conjunto com as outras skills em `.cursor/skills/`.

## Marca e tom

- Produto: **Operis** (gestão de trabalho para a organização).
- Usar sempre a marca **Operis** em documentação, PRs, copy de interface e respostas ao utilizador.
- Comunicar com o utilizador em **português**, salvo pedido em outro idioma.
- Código, comentários e nomes técnicos em inglês quando for convenção do repositório.

## Modelo de domínio (resumo)

| Conceito | Significado Operis |
|----------|-------------------|
| Workspace | Organização / tenant |
| Board | Time ou carteira de entrega |
| Projeto | Frequentemente = **cliente** (modelo Cliente 360: 1 projeto = 1 cliente) |
| Módulo | Frente de entrega dentro do cliente |
| Card / issue | Item de trabalho |
| Status report | Relatório semanal por board/projeto/módulo para stakeholders |

## Stack típica do monorepo

- Frontend: `apps/web` (React), pacotes em `packages/`
- API: `apps/api` (Django)
- Comandos: `pnpm dev`, `pnpm check`, `pnpm fix`
- Feature boards: flag `VITE_ENABLE_BOARDS`

## Documentação interna

Procurar em `docs/`:

- `operis-*` — specs Operis (ex. Cliente 360, automação)
- `tech4humans-*` — roadmap boards, config, rebranding

## Ao implementar

- Reutilizar padrões existentes no código (MobX, serviços em `core/services`, rotas de board).
- Escopo mínimo; manter copy e interface alinhados à marca Operis.
- Traduções: `packages/i18n` (pt-BR e en).

## Identificadores de trabalho

Commits e branches podem usar prefixos (`WEB-`, `API-`, etc.) — preservar nas PRs e release notes.
