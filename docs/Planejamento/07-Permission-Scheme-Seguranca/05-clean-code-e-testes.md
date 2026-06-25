# 05 — Clean Code & Testes · Permission Scheme & Segurança

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operis/
├── db/models/permission_scheme.py
├── app/permissions/
│   ├── base.py          # JÁ EXISTE — ROLE, @allow_permission
│   ├── keys.py          # PERMISSION_KEYS (fonte única)
│   ├── evaluator.py     # has_permission(user, key, project)
│   ├── security.py      # visible_security(user, workspace)
│   └── decorators.py    # @require_permission(key)
├── app/views/permission/…
├── authentication/sso/  # saml.py, oidc.py
└── authentication/twofactor.py
```

## Princípios específicos

- **Uma fonte de verdade por preocupação:** chaves em `keys.py`, avaliação em
  `evaluator.py`, visibilidade em `security.py`. Nunca duplicar a regra.
- `evaluator`/`security` são funções puras (dado user+contexto → bool/Q),
  triviais de testar exaustivamente.
- Default deny explícito; sem ramos implícitos que concedam acesso.
- SSO/2FA usam libs maduras; código próprio só na fronteira de mapeamento.

## Casos de teste (segurança = bloqueante)

### Unit — matriz de permissões

| Caso | Esperado |
| --- | --- |
| chave concedida a role do user | `True` |
| chave não concedida | `False` (default deny) |
| chave desconhecida | `False` |
| workspace admin | `True` em tudo |
| special `assignee` quando é assignee | `True` |
| `visible_security` sem nível | inclui issue |
| `visible_security` com nível não pertencente | exclui issue |

### Integração

| Caso | Esperado |
| --- | --- |
| editar scheme por MEMBER | `403` + sem alteração |
| issue restrita em lista/OQL/board/dashboard | invisível ao não-membro |
| auto-concessão de permissão | impossível (só admin) + audit |
| SSO com assinatura inválida | login recusado |
| replay de SAML assertion | recusado |
| 2FA tentativas excessivas | rate-limited |
| audit log: tentar editar entrada | sem endpoint (405/404) |

### Teste estrutural (anti-regressão)

- Teste que enumera rotas de issue e **falha** se alguma não aplicar
  `visible_security` — garante aplicação consistente.

### e2e

- Configurar um security level e confirmar, com dois utilizadores, que a issue
  restrita só aparece para quem pertence ao nível.

## Definition of Done

- [ ] `keys.py` única; `evaluator`/`security` puros e testados exaustivamente.
- [ ] Data migration mantém acessos atuais (sem regressão).
- [ ] `visible_security` aplicado em todas as queries de issue (teste estrutural).
- [ ] SSO/2FA com libs maduras; replay e assinatura testados.
- [ ] Audit append-only; lint/format/types verdes.
