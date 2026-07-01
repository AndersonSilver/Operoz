# ADR-001 — Assistente Operoz: Governança e Decisões

| Campo       | Valor                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| **Status**  | Aprovado                                                                         |
| **Data**    | 2026-06-10                                                                       |
| **Projeto** | `[ OPEROZ ] - DESENVOLVIMENTO DE PRODUTO`                                        |
| **Roadmap** | [operoz-plataforma-violenta-roadmap.md](./operoz-plataforma-violenta-roadmap.md) |

## Contexto

O Operoz evolui para plataforma operacional inteligente com Assistente conversacional (tools + RAG futuro) e motor de automação estilo Claude Code.

## Decisões

### D1 — Prioridade: Chat antes do Motor

**Decisão:** Implementar Fase 0 e Fase 1 do Assistente antes de Automation Packs e nós avançados.

**Motivo:** Entrega valor imediato (cards, Cliente 360, docs); valida LLM + permissões antes de escalar automação.

### D2 — Segurança por camadas (defense in depth)

1. **Sessão:** usuário só acessa próprias `AssistantSession` no workspace.
2. **Tools:** toda consulta passa por `AssistantActorContext` + filtros de projeto/board.
3. **RAG (futuro):** retrieval filtrado por permissão antes do LLM.
4. **Rate limit:** Redis por user e workspace.
5. **Auditoria:** mensagens persistidas; tool calls registrados em metadata.
6. **Dados sensíveis:** truncar descrições; nunca retornar tokens/secrets.

### D3 — LLM provider abstraction

Refatorar `get_llm_config` para `operoz/assistant/llm/`. OpenAI com tool-calling na Fase 0; Anthropic na mesma interface na Fase 0.4.

### D4 — Tools subset (não 379 MCP)

Fase 0: 5 tools curadas. Evita confusão do modelo e reduz superfície de ataque.

### D5 — Squad (inicial)

| Pilar                        | Responsável inicial |
| ---------------------------- | ------------------- |
| Backend assistant + security | Dev backend         |
| Frontend chat                | Dev frontend        |
| DevOps pgvector/workers      | DevOps (parcial)    |

## Métricas de sucesso (baseline)

| Métrica               | Fase 0 | Fase 1 |
| --------------------- | ------ | ------ |
| Tool usage %          | > 40%  | > 60%  |
| Satisfação (thumbs)   | —      | > 70%  |
| P95 primeira resposta | < 5s   | < 3s   |
| Cross-workspace leak  | 0      | 0      |

## Ritual de execução

1. Card em **In Progress** ao iniciar.
2. PR + critério de pronto → **Done**.
3. Review semanal no projeto OPEROZDP.

## Referências

- [operoz-assistant-security.md](./operoz-assistant-security.md)
- Código: `apps/api/operoz/assistant/`
