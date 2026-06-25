# 05 — Clean Code & Testes · DevOps & Smart Commits

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operis/
├── db/models/devops.py          # DevLink, BuildStatus, Deployment, SmartCommitLog
├── devops/
│   ├── normalize.py    # payload provider → DevEvent agnóstico (puro)
│   ├── smart_commit.py # parse_commands + apply (usa motor existente)
│   ├── matching.py     # match_issue_keys(text) → issues
│   └── providers/
│       ├── github.py   # estende integration/github.py
│       └── gitlab.py
├── app/views/webhook/git.py     # handlers (verificam assinatura)
└── app/views/devops/…           # dev panel (leitura)
```

## Princípios específicos

- **`normalize.py` puro**: cada provider mapeia para um `DevEvent` comum; o resto
  do sistema não sabe de GitHub vs GitLab. Adicionar provider = um normalizador.
- **`smart_commit.py`**: `parse_commands` (puro) separado de `apply` (efeitos).
  Parse testável sem DB; apply reusa o motor de ações (transição/worklog/
  comentário) — não reimplementa.
- Webhooks finos: validam assinatura, enfileiram, devolvem rápido.
- Sem acoplar UI a provider: `dev-link-item` desenha qualquer `DevLink`.

## Casos de teste

### Unit

| Caso | Esperado |
| --- | --- |
| `normalize(github PR)` | DevEvent correto |
| `normalize(gitlab MR)` | mesmo formato |
| `match_issue_keys("OPS-1 e OPS-2")` | [OPS-1, OPS-2] |
| `parse_commands("#close #time 3h")` | [close, time(3h)] |
| smart commit de committer não mapeado | nenhuma ação aplicada |
| `#transition` que viola workflow | não aplicada + erro registado |

### Integração

| Caso | Esperado |
| --- | --- |
| webhook sem assinatura | `401` |
| webhook assinado | `200`, DevLink criado |
| replay do mesmo evento | idempotente (sem duplicado) |
| smart commit "#close" por user sem permissão | não fecha; log com erro |
| smart commit "#time 2h" | cria worklog (feature 05) |
| create-branch repo fora da integração | `400` |
| CI webhook assinado | build status atualizado |

### e2e

- Simular webhook de PR aberto e ver o development panel na issue; simular
  commit com smart commit e confirmar a transição (com committer mapeado).

## Definition of Done

- [ ] `DevLink` normalizado; panel provider-agnóstico.
- [ ] Smart commit: parse puro + apply via motor existente; sempre auditado.
- [ ] Assinatura HMAC verificada; idempotência testada (bloqueante).
- [ ] Permissão do committer respeitada; tokens encriptados.
- [ ] Lint/format/types verdes.
