---
name: code-review
description: Revisão de código no nível de engenheiro sênior — correção, segurança, performance, manutenibilidade e testes. Use sempre que o usuário pedir para revisar um PR, um diff, um arquivo, ou perguntar "isso está bom?"/"pode mergear?" sobre código. Também use proativamente antes de considerar uma tarefa de código "concluída".
---

# Code Review Sênior

Revisão estruturada em camadas, da mais crítica para a menos crítica. Não pare na
primeira camada — passe por todas, mas priorize o que reportar primeiro pelo que
seria mais caro deixar passar.

## Camada 1 — Correção

- O código faz o que deveria fazer em todos os casos, não só no caminho feliz?
- Edge cases: entrada vazia, nula, muito grande, concorrência (duas requisições
  simultâneas), timezone/locale, valores no limite (0, -1, MAX_INT).
- Há alguma condição de corrida (race condition) entre leitura e escrita?
- Erros são tratados ou podem vazar como exceção não capturada / crash?

## Camada 2 — Segurança

Aplique o checklist da rule/skill de segurança: injeção, XSS, autorização (IDOR),
dados sensíveis em log, segredos hardcoded, SSRF, CSRF. Se o diff toca em input
externo, auth, ou dado de usuário, essa camada é obrigatória, não opcional.

## Camada 3 — Performance

- Alguma query nova roda dentro de um loop (N+1)?
- Alguma operação O(n²) ou pior em um dado que pode crescer?
- Chamada de rede/banco sem timeout ou sem tratamento de falha?
- Algo que deveria ser paginado/streamed está sendo carregado inteiro em memória?

## Camada 4 — Manutenibilidade

- Nomes de variáveis/funções comunicam intenção sem precisar de comentário extra?
- Há duplicação que deveria ser extraída, ou abstração prematura que deveria ser
  simplificada?
- A mudança segue os padrões já existentes no resto do código (não introduz um
  estilo/paradigma novo sem necessidade)?
- Comentários explicam o "porquê" de decisões não óbvias, não narram o "o quê" que o
  código já deixa claro.

## Camada 5 — Testes

- A mudança tem teste cobrindo o comportamento novo/corrigido?
- Os testes existentes ainda fazem sentido, ou viraram teste de mock sem valor?
- Bug corrigido → tem teste de regressão?

## Como reportar

Separe os achados em três baldes, nessa ordem:

1. **Bloqueante** — precisa ser corrigido antes de mergear (bug, falha de segurança,
   quebra de contrato).
2. **Deveria mudar** — problema real mas não impede merge imediato se houver
   justificativa/prazo (ex. dívida técnica documentada).
3. **Nit / sugestão** — estilo, preferência, melhoria opcional. Deixe claro que é
   opcional.

Para cada achado: aponte o arquivo/linha, explique o problema concreto (não "isso
está feio"), e proponha a correção quando possível. Nunca faça suposição sobre a
intenção ou o nível de quem escreveu o código — trate o fato técnico, não a pessoa.

## Saída esperada

Um resumo no topo (aprovar / aprovar com ressalvas / bloquear) seguido da lista de
achados nos três baldes acima. Se tudo estiver bem, diga isso claramente e curto —
não invente ressalvas para parecer minucioso.
