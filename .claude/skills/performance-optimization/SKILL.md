---
name: performance-optimization
description: Diagnostica e resolve problemas de performance em aplicações web — frontend (renderização, bundle, Core Web Vitals) e backend (queries, latência, throughput). Use quando o usuário mencionar lentidão, timeout, "está travando", Lighthouse baixo, ou pedir para otimizar uma rota/página/query específica.
---

# Otimização de Performance

## Regra de ouro: meça antes de otimizar

Nunca otimize por suposição. Primeiro identifique onde o tempo/recurso está
realmente sendo gasto (profiler, `EXPLAIN ANALYZE`, Network tab, APM), depois
otimize o gargalo real. Otimizar a parte errada custa tempo e complexidade sem
ganho.

## Frontend

### Diagnóstico

- Lighthouse / PageSpeed Insights para métricas de Core Web Vitals (LCP, INP, CLS).
- React/Vue DevTools Profiler para identificar re-renders desnecessários.
- Network tab: tamanho de bundle, número de requisições, waterfall de carregamento.

### Causas comuns e correção

- **LCP alto**: imagem/recurso principal não é priorizado — use preload no recurso
  crítico, otimize tamanho de imagem, evite bloquear render com CSS/JS não crítico.
- **CLS alto**: elementos sem dimensão reservada (imagem, ad, fonte) causando salto
  de layout — sempre reserve espaço (width/height ou aspect-ratio) antes de carregar.
- **INP alto / travamento em interação**: trabalho pesado na main thread durante
  clique/digitação — mova cálculo pesado para depois do frame (debounce, `requestIdleCallback`)
  ou para um Web Worker.
- **Bundle grande**: code splitting por rota, lazy load de componentes pesados
  (modais, editores ricos, gráficos) que não são necessários no carregamento inicial,
  tree-shaking de dependências não usadas.
- **Re-renders excessivos**: componente pai re-renderiza filhos que não mudaram —
  memoização pontual (`React.memo`/`useMemo`) só nos pontos identificados pelo
  profiler, não em tudo preventivamente.

## Backend

### Diagnóstico

- `EXPLAIN ANALYZE` na query lenta antes de qualquer mudança — identifique se é
  falta de índice, scan completo de tabela, ou join ineficiente.
- APM (latência por endpoint, breakdown de tempo por chamada externa/query) para
  achar o endpoint/operação real que está lento, não o que parece lento.
- Verifique se o problema é CPU, I/O (rede/disco) ou espera de lock — cada um tem
  solução diferente.

### Causas comuns e correção

- **Query lenta**: índice faltando no campo de filtro/join/order, ou query trazendo
  colunas/linhas demais quando só um subconjunto é necessário.
- **N+1**: uma query "de fora" dispara uma query por item de uma lista — resolva com
  eager loading/join ou batching (dataloader).
- **Latência de chamada externa**: paralelize chamadas independentes (`Promise.all`
  em vez de sequencial), adicione cache para dado que não muda a cada request,
  considere circuit breaker se a dependência é instável.
- **Serialização/payload grande**: retornando mais dado do que o consumidor precisa —
  aplique projeção/campos seletivos, pagine.
- **Falta de cache**: dado caro de computar e lido com frequência muito maior do que
  muda — cache com TTL adequado e estratégia de invalidação clara (não cache "para
  sempre" sem plano de invalidação).

## Escalabilidade vs otimização local

Antes de propor infraestrutura mais cara (mais réplicas, mais memória) pergunte se o
problema é algorítmico/de query — throwing hardware at an O(n²) problem custa mais a
longo prazo do que corrigir a causa.

## Reportando o resultado

Sempre inclua: o que foi medido antes, a mudança feita, e o que foi medido depois
(número concreto, não "ficou mais rápido"). Se não for possível medir depois (ex.
ambiente sem dados de produção), diga isso explicitamente em vez de assumir sucesso.
