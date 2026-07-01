---
name: architecture-decisions
description: Ajuda a tomar e documentar decisões de arquitetura (ADR) para escolhas técnicas relevantes — banco de dados, mensageria, monolito vs microsserviço, padrão de comunicação entre serviços, etc. Use quando o usuário pedir para "decidir entre X e Y", "desenhar a arquitetura de", "criar um ADR", ou quando uma escolha técnica tem trade-offs relevantes e consequências de longo prazo.
---

# Decisões de Arquitetura (ADR)

Objetivo: transformar uma escolha técnica ambígua em uma decisão registrada, com
trade-offs explícitos, para que daqui a um ano alguém entenda _por que_ aquilo foi
escolhido — não só o que foi escolhido.

## Processo

1. **Entenda o problema real antes de comparar tecnologias.** Pergunte: qual é a
   restrição que mais importa aqui — latência, custo, consistência de dado, tempo
   de entrega, tamanho do time, ou facilidade operacional? Escolhas de arquitetura
   sem restrição clara viram debate de gosto pessoal.
2. **Liste as opções realistas** (normalmente 2-3, não mais). Descarte opções
   claramente inadequadas com uma frase, sem gastar espaço comparando.
3. **Compare pelos critérios que importam para _este_ contexto**, não uma lista
   genérica de prós/contras copiada da internet. Ex.: "equipe já conhece Postgres,
   zero curva de aprendizado" pesa mais que "tecnologia X é teoricamente mais
   escalável" se a escala atual não justifica.
4. **Decida e declare a decisão de forma inequívoca.** Uma ADR que termina em "pode
   ser A ou B dependendo" não decidiu nada.
5. **Declare as consequências**, incluindo as ruins. Toda decisão tem custo — nomeie
   o que está sendo aceito de pior em troca do benefício escolhido.

## Formato do documento (ADR)

```markdown
# ADR-NNN: <título curto da decisão>

## Status

Proposto | Aceito | Substituído por ADR-XXX

## Contexto

Qual problema estamos resolvendo? Qual é a restrição principal (a que mais pesa
na decisão)? Que opções foram consideradas?

## Decisão

O que foi decidido, em uma frase direta.

## Alternativas consideradas

- **Opção A** — prós / contras / por que não foi escolhida (ou foi)
- **Opção B** — prós / contras / por que não foi escolhida (ou foi)

## Consequências

- Positivas: o que essa decisão nos dá
- Negativas / custos aceitos: o que essa decisão nos tira ou dificulta
- O que reavaliar no futuro (sinal de que a decisão deveria ser revisitada)
```

## Armadilhas comuns a evitar

- **Resume-driven design**: escolher tecnologia porque é a mais nova/impressionante,
  não porque resolve o problema atual melhor que a alternativa mais simples.
- **Escalar para um problema que não existe ainda**: arquitetura de microsserviços
  para um produto com 3 usuários. Comece pelo mais simples que atende o requisito
  atual com um caminho razoável de evolução, não pelo mais "correto" na teoria.
- **Decisão sem dono nem data**: toda ADR relevante deveria ter quem decidiu e
  quando, para dar contexto histórico.
- **Ignorar o custo operacional**: toda peça nova na arquitetura (fila, cache,
  serviço) é algo que o time vai ter que operar, monitorar e debugar às 3h da manhã.
  Conte esse custo, não só o benefício.
