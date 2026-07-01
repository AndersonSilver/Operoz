# Architecture Decision Records — Assistente Operoz

Índice de ADRs do programa Plataforma Violenta / Assistente Operoz.

| ADR                                               | Título                             | Status   |
| ------------------------------------------------- | ---------------------------------- | -------- |
| [001](./operoz-assistant-adr-001-governanca.md)   | Governança e decisões iniciais     | Aprovado |
| [002](#adr-002-pgvector-vs-qdrant)                | pgvector vs Qdrant para RAG        | Aprovado |
| [003](#adr-003-tool-subset-vs-379-tools-mcp)      | Tool subset vs 379 tools MCP       | Aprovado |
| [004](./operoz-assistant-adr-004-chat-scaling.md) | Escala do chat (150+ utilizadores) | Aprovado |

---

## ADR-002 — pgvector vs Qdrant

| Campo      | Valor      |
| ---------- | ---------- |
| **Status** | Aprovado   |
| **Data**   | 2026-06-10 |

### Contexto

O RAG do assistente precisa de busca vetorial + FTS híbrida. Opções avaliadas: **pgvector** no Postgres existente vs **Qdrant** (ou similar) como vector DB dedicado.

### Decisão

Usar **pgvector** na mesma instância Postgres do Operoz.

### Motivos

1. **Operação:** um único datastore; backups e migrations unificados
2. **Transações:** embeddings (`SearchEmbedding`) no mesmo DB que issues/pages
3. **Permissões:** filtros SQL por workspace/projeto antes do ranking
4. **Custo:** sem cluster adicional na Fase 2
5. **Maturidade:** migration `0151`, imagem `pgvector/pgvector:pg15` no Compose

### Consequências

- Escala vertical do Postgres para volumes muito grandes (>10M chunks)
- Revisitar Qdrant se latência P95 de retrieval degradar com carga documentada
- `reindex_assistant` + fila `assistant` para backfill

### Alternativa rejeitada

**Qdrant:** melhor isolamento de carga vetorial, mas duplica governança de ACL, sync de deletes e infra extra.

---

## ADR-003 — Tool subset vs 379 tools MCP

| Campo      | Valor      |
| ---------- | ---------- |
| **Status** | Aprovado   |
| **Data**   | 2026-06-10 |

### Contexto

O MCP externo (`mcp-server/`) expõe **379 tools** (uma por rota HTTP). O assistente in-app usa tool-calling do LLM com contexto limitado.

### Decisão

**Subset curado (~17 tools)** no registry interno `operoz/assistant/tools/`, não espelhar 379 tools no chat.

### Motivos

1. **Qualidade do modelo:** menos confusão na escolha de ferramenta
2. **Segurança:** superfície de ataque menor; cada tool com permission gate explícito
3. **UX:** tools orientadas a perguntas naturais (search, explain, propose)
4. **Separação de papéis:**
   - **MCP externo** → automação de agentes (Cursor, CI) com API completa
   - **Assistente interno** → utilizador humano no produto Operoz

### Tools atuais (Fase 5)

`search_issues`, `get_issue`, `get_client_360_summary`, `search_pages`, `get_page_content`, `get_automation_metrics`, `get_automation_run`, `list_intake_pending`, `get_project_stats`, `list_board_projects`, `propose_automation_rule`, `explain_automation_run`, `list_automation_packs`, `propose_automation_pack_install`, `propose_issue_comment`, `propose_issue_state_change`

### Consequências

- Novas capacidades entram via ADR + implementação deliberada
- Nó `action.mcp_call` na automação permite chamar MCP para casos avançados
- Documentação cruzada: [operoz-mcp.md](./operoz-mcp.md)

### Alternativa rejeitada

**Expor 379 tools no chat:** degradação de tool usage, timeouts e risco de writes não intencionais.

---

## Como propor novo ADR

1. Adicionar secção neste ficheiro ou ficheiro `operoz-assistant-adr-NNN-*.md`
2. Card no OPEROZDP se mudança de roadmap
3. Link no [roadmap](./operoz-plataforma-violenta-roadmap.md)
