---
name: feature-ideation
description: Sugere e prioriza novas funcionalidades para o Operoz com base no estado real do workspace (boards, work items, automações) e no domínio do produto (Cliente 360, squads, custos de pipeline). Use quando o usuário pedir "sugere funcionalidades", "o que eu deveria construir a seguir", "ideias para o roadmap", "que feature falta", ou pedir para pensar no produto/roadmap do Operoz.
---

# Ideação de Funcionalidades — Operoz

Objetivo: gerar sugestões de features que resolvem uma dor concreta observada no
produto real do usuário — não uma lista genérica de ideias de mercado copiadas de
"o que a concorrência tem".

## Domínio do Operoz (contexto sempre relevante)

- Gestão de work items/boards por projeto e squad.
- "Cliente 360" — cliente modelado como projeto, com visão consolidada de entregas.
- Custos de pipelines de CI/CD via Harness, atribuídos a squad/cliente.
- Automações, incluindo formulários públicos de intake.
- Portal leve para stakeholders externos ("Space").
- Work items linkados a PRs/commits de Git.
- Módulo `assistant` (IA) e MCP server para agentes.

## Processo

1. **Puxe o estado real do workspace via MCP do Operoz**, não invente hipóteses.
   - `operoz_discover` com `query` descrevendo a intenção (ex.: `"list work items
     sem responsável"`, `"boards com maior atraso"`, `"automações configuradas"`)
     e `domain` (`work_items`, `boards`, `automation`, `cycles`, `modules`,
     `notifications`, `intake`, `analytics`, etc.).
   - `operoz_execute` com o `operation` retornado pelo discover para de fato buscar
     os dados (work items parados, ciclos atrasados, automações existentes,
     squads/membros, uso do Cliente 360).
   - Se o MCP do Operoz não estiver configurado/disponível na sessão, diga isso
     explicitamente ao usuário antes de prosseguir com ideias — deixe claro que as
     sugestões abaixo, sem esse passo, são hipóteses genéricas e não baseadas em
     dado real.
2. **Identifique lacunas e fricções reais**, cruzando o que foi encontrado com o
   domínio:
   - Work items sem dono, sem estimativa, ou parados há muito tempo — falta
     automação/alerta?
   - Squads sem visibilidade de custo (Harness) atribuído a eles?
   - Clientes (Cliente 360) sem um resumo/status consolidado fácil de compartilhar?
   - Automações manuais repetidas que poderiam virar regra automática?
   - Lacunas entre o que o portal "Space" expõe hoje e o que um stakeholder externo
     precisaria ver sem pedir para o time?
3. **Não sugira feature sem amarrar a uma dor observada.** Cada sugestão cita o
   dado/padrão do workspace que a motivou (ex.: "14 work items sem estimativa no
   board X → sugiro estimativa obrigatória antes de mover para 'Em progresso'").
4. **Priorize por impacto x esforço**, não por ordem de ocorrência. Separe em
   "rápido de fazer, resolve dor real" vs "maior esforço, maior alavancagem".

## Formato de saída

Para cada sugestão:

```
### <nome curto da feature>
- **Dor observada**: <o que foi encontrado no workspace/domínio que motiva isso>
- **O que seria**: <descrição objetiva, 1-3 frases>
- **Impacto x esforço**: <baixo/médio/alto> x <baixo/médio/alto>
- **Onde entraria**: <módulo/app do monorepo mais provável, ex. apps/api/operoz/automation>
```

Feche com uma recomendação direta de por onde começar (não deixe a decisão de
priorização só para o usuário se os dados apontam claramente para uma opção).

## Armadilhas a evitar

- Sugerir feature que já existe no produto (confira via `operoz_discover` antes de
  propor algo — ex. não sugira "board Kanban" se boards já existem).
- Ideias sem relação com o domínio real do Operoz (features genéricas de SaaS sem
  ligação com squads/Cliente 360/custos/automação).
- Lista longa e rasa. Prefira 3-5 sugestões bem fundamentadas a 15 genéricas.
