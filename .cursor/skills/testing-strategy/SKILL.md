---
name: testing-strategy
description: Define ou revisa a estratégia de testes de uma feature, serviço ou projeto — o que testar em cada camada da pirâmide, cobertura de edge cases e fluxo de CI. Use quando o usuário pedir "como eu testo isso", "escreve os testes para", "monta um plano de testes", ou quando uma feature nova está sendo projetada e ainda não tem abordagem de teste definida.
---

# Estratégia de Testes

## Passo 1 — Entenda o que precisa de garantia

Antes de escrever qualquer teste, identifique:

- Qual é o comportamento crítico que não pode quebrar silenciosamente?
- Quais são as regras de negócio (não só o CRUD óbvio)?
- Quais integrações externas existem (banco, API terceira, fila) e como isolá-las
  nos testes?

## Passo 2 — Distribua pela pirâmide

- **Unitário** (maioria): lógica pura, regras de negócio, funções utilitárias,
  reducers/transformações de dado. Rápido, sem I/O real.
- **Integração** (parte relevante): componentes reais colaborando — service +
  banco de teste, handler de rota + middleware real, componente de UI + estado real
  (sem mock de tudo). Pega bugs que testes unitários isolados não pegam (contrato
  entre peças).
- **E2E** (poucos, críticos): fluxos de negócio de ponta a ponta que, se quebrarem,
  são catastróficos (checkout, login, fluxo de pagamento). Caro e lento — reserve
  para o que realmente precisa da garantia de "funciona de verdade, de ponta a
  ponta".

## Passo 3 — Liste os casos, não só o feliz

Para cada comportamento, cubra:

- Caminho feliz com dado típico
- Entrada vazia/nula/ausente
- Entrada no limite (0, valor máximo, string muito longa)
- Entrada inválida (tipo errado, formato errado)
- Concorrência, se aplicável (duas operações simultâneas no mesmo recurso)
- Falha de dependência externa (timeout, erro 500, resposta malformada)
- Permissão negada (usuário sem acesso tentando a operação)

## Passo 4 — Defina o que NÃO testar

- Não teste a biblioteca/framework em si (ex. não teste se o `useState` do React
  funciona).
- Não teste detalhe de implementação que pode mudar sem mudar o comportamento
  (nome de variável interna, estrutura de classe privada).
- Não duplique a mesma cobertura em unitário e E2E "por garantia" — isso deixa a
  suíte lenta sem ganho de confiança proporcional.

## Passo 5 — Integre ao fluxo de desenvolvimento

- Testes rodam em CI a cada push/PR, bloqueando merge se falharem.
- Testes de regressão: todo bug relatado em produção ganha um teste que reproduz o
  bug (falha antes do fix) antes de ser corrigido.
- Testes flaky (que falham intermitentemente sem mudança real) são tratados como
  bug prioritário, não silenciados com retry automático — flakiness corrói a
  confiança do time na suíte inteira.

## Entregável esperado

Um plano com: lista de comportamentos críticos, mapeamento de cada um para o nível
da pirâmide adequado, casos de edge por comportamento, e o que fica explicitamente
fora do escopo de teste automatizado (se houver).
