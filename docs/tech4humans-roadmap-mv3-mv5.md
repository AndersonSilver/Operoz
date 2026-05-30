# Tech4Humans — Roadmap pós-MVP-2 (MV3 → MV5)

Visão de produto alinhada com o utilizador (maio/2026). Complementa [tech4humans-boards-mvp2-plano.md](./tech4humans-boards-mvp2-plano.md).

**Regra:** cada MV é fechado com validação antes do seguinte (igual MVP-1 / MVP-2).

---

## Visão geral

```text
MVP-2 (fechado)      Hub board + vistas agregadas (M2-0…M2-12)
        │
        ▼
BC-0…BC-4            Config board (Jira: campos, tipos, projeto, acesso)
        │              Ver tech4humans-board-config-mvp3-plano.md
        ▼
MV3                  Status Report (relatório de status do board/time)
        │
        ▼
MV4                  PRD (documento de requisitos ligado ao board/projeto)
        │
        ▼
MV5                  Papéis de acesso customizáveis (RBAC além de Guest/Member/Admin)
        │
        ▼
MV6 (fecho)          Rebranding **Kortex** (marca + opcional `@kortex/*`) — **última fase do MVP**
```

---

## Tipo de card vs etiqueta (decisão de produto)

| | **Etiqueta (Label)** | **Tipo de card (IssueType)** |
|--|----------------------|------------------------------|
| **O que classifica** | Tema transversal (ex.: «urgente», «cliente X») | **Natureza do trabalho** (Kickoff, Deploy, Bug…) |
| **Escopo no Plane hoje** | Por **projeto** | Por **workspace**, ligado ao projeto via `ProjectIssueType` |
| **Quem cria hoje** | Membros do projeto (conforme permissões) | Plane EE / God mode; no fork CE os stubs estão vazios |
| **UI Jira** | Labels coloridas | Ícone + tipo fixo no card |
| **Tech4Humans (alvo)** | Mantém como está no projeto | **Catálogo do board**, CRUD só **ADMIN** em configurações |

**Não misturar:** um card tem **um** `type_id` (tipo) e **várias** etiquetas.

---

## M2-16 — Tipos de card: personalização (admin) — fecho do MVP-2

**Objetivo:** o admin do workspace define os tipos de card do time (board), com nome + ícone (`logo_props`), semelhante à experiência de gerir etiquetas — mas **centralizado** e **restrito a ADMIN**.

### Onde fica na UI (proposta)

```text
Configurações do workspace
└── Boards
    └── [Board: Squad as a Service]
        └── Tipos de card          ← nova secção (M2-16)
            ├── Lista (nome, ícone, ativo, ordem)
            ├── Criar tipo
            ├── Editar / arquivar
            └── Tipo por defeito para novos cards
```

Alternativa futura: entrada também em **God mode** para tipos globais do workspace; no MVP preferir **settings do board** para alinhar com «criar no board».

### Modelo de dados (recomendado — reutilizar Plane)

O fork **já tem** `IssueType` (workspace) + `ProjectIssueType` (quais tipos cada projeto usa).

| Camada | Entidade | Papel |
|--------|----------|--------|
| Catálogo | `IssueType` | Nome, `logo_props`, `is_active`, `is_default`, `level` |
| Board | `BoardIssueType` **(nova)** | `board_id` + `issue_type_id` + `sort_order` + `is_enabled` |
| Projeto | `ProjectIssueType` | Ao associar projeto ao board, sincronizar tipos habilitados do board → projeto |

**Porquê `BoardIssueType` e não duplicar `IssueType` por board?**

- Um tipo «Deploy» tem o mesmo ícone em todos os projetos do mesmo time.
- Evita lixo de tipos órfãos quando um projeto sai do board.
- Admin edita uma vez; todos os projetos do board herdam.

**Fluxo ao criar projeto no board:** copiar `BoardIssueType` ativos para `ProjectIssueType` do novo projeto.

### API (esboço)

| Método | Path | Quem |
|--------|------|------|
| GET | `/api/workspaces/{slug}/boards/{board_slug}/issue-types/` | ADMIN, MEMBER (leitura), GUEST (leitura) |
| POST | `…/issue-types/` | **ADMIN** |
| PATCH | `…/issue-types/{id}/` | **ADMIN** |
| DELETE | `…/issue-types/{id}/` | **ADMIN** (soft / `is_active=false`) |

POST cria `IssueType` no workspace **e** liga em `BoardIssueType`. PATCH atualiza nome/ícone. DELETE desativa no board (não apaga issues históricas).

### Frontend

- Substituir stubs CE: `IssueTypeSelect`, `IssueTypeSwitcher`, `FilterIssueTypes`.
- Modal criar card: dropdown só tipos **habilitados no board** do projeto.
- **M2-15** passa a depender de M2-16 para ícones reais (ou seed manual temporário).

### Critérios de aceite M2-16

- [ ] ADMIN cria tipo «Kickoff» com ícone; aparece no modal de novo card em projetos do board.
- [ ] MEMBER não acede à página de configuração de tipos.
- [ ] Card existente mantém `type_id` se tipo for desativado (só deixa de aparecer em novos).
- [ ] ≥2 boards no workspace podem ter catálogos de tipos diferentes.

**Estimativa:** 1–1,5 semanas (API + settings UI + stubs CE).

---

## MV3 — Status Report

**Objetivo:** relatório de status periódico do **board** (time), para stakeholders — distinto do Resumo (KPIs ao vivo) da M2-9.

### Escopo provável (a detalhar na abertura do MV3)

| Área | Ideia |
|------|--------|
| Conteúdo | Progresso por projeto, riscos, bloqueios, entregas da semana, métricas do `meta/` |
| Formato | Página no board + export PDF/Markdown + opcional envio email |
| Período | Semanal / quinzenal; comparação com período anterior |
| Permissões | Leitura: MEMBER+; publicar/editar template: ADMIN |
| Dados | Reutilizar `GET …/boards/{slug}/meta/` + issues filtradas por data |

### Fora de MV3.0 (10a — MVP)

- Integração Confluence automática (pode ser MV3.1).
- IA a redigir o report (pós-MV3).
- **Modelos/templates dinâmicos** — MV3.1 / Fase **10b–10c** (após OK na 10a). Ver [board-config-mvp3-plano §10.8](./tech4humans-board-config-mvp3-plano.md#108-modelos-dinâmicos-pós-mvp--10b10c).

**Estimativa MV3.0 (10a):** 2–3 semanas. **Modelos (10b):** +1–1,5 sem quando priorizado.

---

## MV4 — PRD

**Objetivo:** **Product Requirements Document** associado ao board ou ao projeto (épico), versionado e colaborativo.

### Escopo provável

| Área | Ideia |
|------|--------|
| Entidade | `PRD` ligado a `board_id` e/ou `project_id` |
| Conteúdo | Editor rich text (reutilizar `@operis/editor` / Pages) |
| Secções | Objetivo, requisitos, fora de escopo, critérios de aceite, ligação a cards |
| Ligação | Cards referenciam PRD; filtro «cards deste PRD» |
| Permissões | Editar: ADMIN + MEMBER (definir); ver: GUEST se projeto público |

### Relação com Plane hoje

- **Pages** existem por projeto — MV4 pode evoluir Pages com template PRD ou entidade nova.
- Não confundir com **Módulo** (cronograma M2-11).

**Estimativa inicial:** 3–4 semanas.

---

## MV5 — Papéis e permissões customizáveis

**Objetivo:** além de Guest / Member / Admin (workspace e projeto), criar **papéis** (ex.: «Tech Lead», «Cliente», «PMO») com permissões granulares escolhidas pelo admin.

### Escopo provável

| Área | Ideia |
|------|--------|
| Modelo | `CustomRole` + `Permission` flags (criar board, editar tipo de card, publicar status report, editar PRD, …) |
| Atribuição | Por workspace e/ou por board e/ou por projeto |
| UI | Settings → Acessos → criar papel → checklist de permissões |
| Migração | Mapear roles atuais (`ROLE.ADMIN`, etc.) para não quebrar instalações |

### Complexidade

- Hoje `allow_permission` só tem níveis **WORKSPACE** e **PROJECT** ([implementacao](./tech4humans-boards-implementacao.md) §6.3).
- MV5 exige camada de autorização nova (middleware ou decorator com matriz de permissões).
- **Não antecipar no MVP-2** — só desenhar extensão para não bloquear M2-16.

**Estimativa inicial:** 4–6 semanas.

---

## MV6 — Rebranding Kortex (fecho do MVP)

**Objetivo:** o produto deixa de se apresentar como «Plane» e passa a **Kortex** para utilizadores e stakeholders — **sem bloquear** entregas funcionais (Boards, Status Report, PRD, RBAC).

**Quando executar:** **uma das últimas coisas do MVP**, depois de MV3 (Status Report) estável e preferencialmente após MV4/MV5 (ou BC-4…BC-9) fechados. Não misturar com features em curso.

**Plano detalhado:** [tech4humans-rebranding-remocao-plane.md](./tech4humans-rebranding-remocao-plane.md) (substituir marca alvo **Tech4Humans** → **Kortex** na Fase 0).

### Escopo por ondas (resumo)

| Onda | O quê | Esforço | Risco |
|------|--------|---------|-------|
| **MV6.1** | Marca visível: i18n, `SITE_NAME`, logos, favicon, emails, remover links `plane.so` | 1–3 dias | Baixo |
| **MV6.2** | Instância self-hosted: nome/logo em God Mode | 1–2 dias | Baixo |
| **MV6.3** | (Opcional) Renomear pacotes npm `@operis/*` → `@kortex/*` | 1–2 semanas | Médio |
| **Fora do MVP** | Pacote Python `plane/`, Docker `operis-db`, pasta monorepo | — | Alto — adiar |

### Critérios de aceite MV6 (mínimo para fechar MVP)

- [ ] Utilizador não vê «Plane» na UI principal (login, sidebar, títulos, toasts de produto).
- [ ] Título do browser / metadata = **Kortex** (ou nome comercial acordado).
- [ ] Logos e favicon Kortex.
- [ ] `pnpm dev` + smoke Boards + Status Report sem regressão (checklist §8 do doc de rebranding).
- [ ] Licença AGPL e copyright upstream **mantidos** no código (obrigação legal).

**Estimativa MV6.1+6.2:** ~1 semana. Pacotes npm já renomeados para `@operis/*` (mai/2026).

---

## Ordem recomendada (resumo)

| Fase | Entregável | Depende de |
|------|------------|------------|
| **BC-0…BC-3** | Config board (shell, tipos, campos, schema Projeto) | M2-12 |
| **BC-4** | Acesso (4a simples ou 4b RBAC) | BC-0 |
| **MV3** | Status Report | M2-9 meta, BC-0; plano em [board-config-mvp3-plano](./tech4humans-board-config-mvp3-plano.md) |
| MV4 | PRD | MV3 opcional |
| MV5 | RBAC custom (se BC-4b não couber antes) | BC-0 |
| **MV6** | **Rebranding Kortex** (marca; pacotes opcionais) | MV3 estável; ideal MV4/MV5 ou BC fechado |

**Cancelado:** M2-13…M2-15 (ícones).

---

## Próximo passo

Plano mestre: **[tech4humans-board-config-mvp3-plano.md](./tech4humans-board-config-mvp3-plano.md)**.

1. Responder às 5 decisões em aberto no fim desse doc.
2. Implementar **BC-0** → … → **MV3** (uma etapa de cada vez).

Catálogo de tipos: **por board** (`BoardIssueType`), `IssueType` partilhado no workspace — inalterado.
