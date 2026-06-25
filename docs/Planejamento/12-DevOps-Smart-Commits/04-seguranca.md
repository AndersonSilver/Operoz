# 04 — Segurança · DevOps & Smart Commits

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).
Webhooks de entrada + ações automáticas a partir de texto externo = superfície
sensível.

## Threat-model específico

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Webhook forjado | POST falso a simular o provider | Verificar assinatura HMAC (segredo por integração); rejeitar sem assinatura válida |
| Replay de webhook | Reenviar evento antigo | Idempotência (`upsert_dev_link` por chave única) + dedupe por delivery id |
| Smart commit como vetor de privilégio | Commit "OPS-1 #close" de quem não pode | Resolver committer → membro; aplicar só se `can_apply(user, cmd)`; senão registar erro e ignorar |
| Committer não mapeável | Email externo sem conta | Nenhuma ação aplicada; só regista link (sem transição/worklog) |
| Injeção via mensagem de commit | Payload em `#comment` | Tratar como texto puro; escapar no render; sem execução |
| SSRF via create-branch | `repo` aponta para alvo interno | Usar só repos da integração configurada; token com escopo mínimo |
| Token leak | Token do provider exposto | Encriptado (`secrets.py`); nunca devolvido em claro; redigido em logs |
| Build/deploy spoof | CI webhook falso marca "success" | `/webhooks/ci/` assinado; segredo por workspace |

## Princípio dos smart commits

> Um smart commit **nunca** tem mais poder do que o membro a quem o committer
> corresponde. Sem mapeamento confiável committer→membro com permissão, a ação
> é registada como não-aplicada, não executada.

```python
def can_apply(user, cmd, issue):
    return {
        "transition": lambda: has_permission(user, "issue.transition", issue.project),
        "assign":     lambda: has_permission(user, "issue.assign", issue.project),
        "time":       lambda: has_permission(user, "worklog.create", issue.project),
        "comment":    lambda: has_permission(user, "comment.create", issue.project),
        "label":      lambda: has_permission(user, "issue.edit", issue.project),
    }[cmd.kind]()
```

## Webhook hardening

- Verificação de assinatura **antes** de qualquer parse pesado.
- Timeout e tamanho máximo de payload.
- Processamento assíncrono (Celery) após validar assinatura, para não bloquear.
- Transições disparadas respeitam o workflow (feature 01) — incl. condições.

## create-branch / tokens

- Token do provider com escopo mínimo (criar branch), encriptado.
- `repo` validado contra a lista de repos da integração; sem repos arbitrários.

## Auditoria

- `SmartCommitLog` regista cada comando (aplicado/erro) — rasto completo.
- DevLinks e deployments auditáveis; sem segredos em claro.
