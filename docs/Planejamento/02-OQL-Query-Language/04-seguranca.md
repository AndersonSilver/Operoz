# 04 — Segurança · OQL

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).
A OQL é executa-query-arbitrária — a secção mais sensível do programa.

## Princípio nuclear

> **OQL nunca vê SQL.** O pipeline é `texto → AST → Q object → ORM`. Não existe
> concatenação de strings SQL em ponto nenhum. Isto elimina, por construção, a
> classe de injeção SQL.

## Threat-model específico

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| SQL injection | Valor malicioso na query | Parser→`Q`; ORM parametrizado; zero SQL string |
| Fuga de dados (campo arbitrário) | `secret_field = ...` apontando a coluna sensível | **Whitelist**: só campos no `FIELD_REGISTRY` traduzem; resto → `400` |
| Cross-tenant | Query tenta ler outro workspace | `base_qs` já filtrado por workspace **antes** de aplicar o `Q` |
| Elevação por OQL | Ver issues sem permissão via query | `visibility_for(user)` aplicada sempre; OQL só restringe, nunca alarga |
| ReDoS / parser DoS | Query gigante ou patológica | Limite de tamanho da query, profundidade do AST, timeout de parse |
| Query pesada (DoS) | `ORDER BY` sem índice, joins enormes | Throttle no endpoint; paginação obrigatória; `ORDER BY` whitelisted |
| Injeção via custom field | `cf[<id>]` com id de outro workspace | Validar id contra `WorkspaceCustomField` do workspace |
| IDOR em `values/` | Listar valores de campo sensível | `values/` respeita visibilidade e só campos do registry |

## Limites de robustez do parser

- Tamanho máximo da query (ex.: 4 KB).
- Profundidade máxima do AST (ex.: 50 níveis) → evita stack overflow / ReDoS.
- Número máximo de cláusulas (ex.: 100).
- Timeout de parse e de compilação.
- Gramática sem backtracking exponencial (lark LALR).

## Whitelisting (defesa principal)

- Campos: só `FIELD_REGISTRY`.
- Operadores: só os declarados por campo (`OqlField.operators`).
- Funções: só o registry de funções; argumentos validados por tipo.
- `ORDER BY`: só campos com `orm_path` ordenável marcado.
- Tradução campo→ORM é explícita; **não** há `getattr` dinâmico sobre o modelo.

## Permissões e visibilidade

```python
qs = (Issue.objects
      .filter(workspace=workspace)
      .filter(visibility_for(request.user))   # projetos/issues visíveis
      .filter(compiled_q))                     # OQL aplicada por último
```

- A ordem importa: visibilidade **antes** da OQL garante que nenhuma query
  contorna RBAC.
- `GUEST` sem acesso ao endpoint.

## NL→OQL

- O texto do utilizador vai ao LLM; a saída é **sempre** revalidada pelo parser
  e pelo whitelist antes de executar. O LLM é tratado como fonte não-confiável.
- Sem execução automática: o utilizador vê a OQL gerada antes de correr.

## Rate limiting

- Throttle por utilizador/workspace no `search/oql/` (reusar abordagem do
  `throttles/`); `validate/` tem limite mais alto (é barato), `run` mais baixo.

## Auditoria

- `OqlSearchHistory` regista queries (sem PII além do necessário).
- Picos anómalos de queries pesadas → métrica para alerta.
