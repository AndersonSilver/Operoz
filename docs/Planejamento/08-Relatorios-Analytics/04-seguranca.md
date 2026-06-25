# 04 — Segurança · Relatórios & Analytics

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).

## Risco central: agregação revela o que o detalhe esconde

Métricas agregam muitas issues. O risco é uma contagem/curva revelar dados de
issues que o utilizador não pode ver individualmente.

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Fuga por agregação | Métrica conta issues restritas/de projeto sem acesso | `scoped_issue_qs(user, scope)` aplica visibilidade + `visible_security` **antes** de computar |
| Fuga via scope OQL | `scope=oql` tenta alargar | Reusa whitelist/visibilidade da feature 02 |
| Export como bypass | Export ignora permissão | Export herda a mesma verificação; download com token TTL |
| DoS por métrica pesada | CFD/time-in-status sobre histórico enorme | Snapshots + janela `from/to` obrigatória em métricas pesadas; throttle |
| Inferência por diferença | Comparar agregados para inferir issue restrita | Métricas só sobre conjunto visível; sem expor contagens de níveis a que não pertence |
| Export PDF SSRF/injeção | Render server-side com input do user | Sanitizar template; sem fetch de URLs do utilizador no render |

## Regra de ouro

```python
base = scoped_issue_qs(request.user, scope)  # visibilidade SEMPRE primeiro
series = spec.compute(base, scope, context)  # métrica só vê o permitido
```

- `scoped_issue_qs` combina projetos acessíveis + `visible_security` (feature
  07). Toda métrica parte daqui — função única.

## Validação

- `metric_key` no `METRIC_REGISTRY`; `scope` kind compatível com a métrica.
- `scope_id` pertence ao workspace e é acessível.
- `from/to` com limite de janela (evita varrer anos).

## Export

- Geração assíncrona (Celery) para exports grandes; ficheiro em storage com URL
  assinada e TTL curto.
- PDF/PNG renderizados a partir de dados já recortados — nunca recomputam com
  mais privilégio.

## Auditoria e privacidade

- Métricas de workload/time podem ser sensíveis (desempenho individual) —
  restringir a admin/lead quando aplicável (reusa permissões da feature 07).
- Sem PII desnecessária nos exports.
