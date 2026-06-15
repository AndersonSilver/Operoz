# Guia do utilizador — Assistente Operoz

O **Assistente Operoz** é o chat nativo do workspace: responde com dados reais de cards, páginas, automações e Cliente 360, respeitando as suas permissões.

## Como abrir

- Ícone do assistente na barra lateral do workspace
- Atalho **Cmd+K** → «Perguntar ao Operoz» (quando `VITE_ENABLE_OPEROZ_ASSISTANT=1`)

## O que perguntar

| Tema             | Exemplos                                                                        |
| ---------------- | ------------------------------------------------------------------------------- |
| **Cards**        | «Quais issues abertas no projeto X?», «Detalhes do card OPEROZ-42»              |
| **Documentação** | «Resumo da página de arquitetura», «O que diz o PRD do módulo Y?»               |
| **Cliente 360**  | «Como está o cliente Acme no board OPS?»                                        |
| **Automação**    | «Por que falhou a regra Status Report ontem?», «Métricas de automação do board» |
| **Operacional**  | «Cards pendentes no intake», «Estatísticas do projeto Z»                        |

## Exemplos práticos

```text
Quantos cards em progresso no projeto Operoz DP?

Explique a última falha da automação "Status Report Semanal".

Quais páginas mencionam RAG ou pgvector?

Crie uma regra: quando um card for movido para Done, comentar no Slack.
  → O assistente propõe a regra; você confirma no UI antes de publicar.

Instala o pack de automação para onboarding de clientes.
  → Proposta de instalação com dry-run opcional.
```

## Contexto da conversa

- Use o **context picker** para fixar board ou projeto
- Na rota de um board/projeto, o contexto é herdado automaticamente
- O histórico de sessões fica na barra do chat

## Citações e confiança

Respostas podem incluir **links clicáveis** para issues, páginas e execuções de automação. Prefira respostas com citações; se algo parecer inventado, use **thumbs down** e reporte ao admin.

## Ações que exigem confirmação

Estas ferramentas só **propõem** alterações — nada é aplicado sem o seu clique em Confirmar:

- Comentário em card
- Mudança de estado de card
- Nova regra de automação
- Instalação de automation pack

## Limitações

| Limitação                  | Detalhe                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| Rate limit                 | Por defeito 60 mensagens/utilizador/hora e 500/workspace/hora                |
| Orçamento de tokens        | Alerta admin ao atingir ~80% do budget diário                                |
| Sem acesso cross-workspace | Só vê dados do workspace atual                                               |
| LLM pode errar             | Valide números críticos nas fontes citadas                                   |
| RAG                        | Depende de conteúdo indexado; use `reindex_assistant` após migrações grandes |
| Convidadoss (guest)        | Podem usar o chat com permissões reduzidas nas tools                         |

## Feedback

- **Thumbs up/down** em cada resposta do assistente
- Admins veem agregados em **Configurações → Assistente Operoz**

## Documentação relacionada

- [Segurança](./operis-assistant-security.md)
- [Métricas de qualidade](./assistant-quality-metrics.md)
- [Guia admin](./assistant-admin-guide.md)
