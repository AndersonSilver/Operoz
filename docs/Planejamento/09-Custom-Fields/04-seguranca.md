# 04 — Segurança · Custom Fields

Baseline em [`00-VISAO-GERAL/03-seguranca-transversal.md`](../00-VISAO-GERAL/03-seguranca-transversal.md).

## Threat-model específico

| Ameaça | Vetor | Mitigação |
| --- | --- | --- |
| Bypass de readonly/hidden | Cliente envia valor para campo readonly/hidden | Validação server-side contra `FieldConfigItem` do contexto; UI não basta |
| Injeção via valor | XSS no render de campo texto/URL | Escapar no render; validar URL (esquema http/https) |
| Tipo confundido | Enviar JSON onde se espera número | Validador por tipo escreve só na coluna tipada certa |
| Fuga via OQL cf[] | `cf[<id>]` de outro workspace | Validar id contra `WorkspaceCustomField` do workspace (feature 02) |
| Opção fora do domínio | SELECT com valor não listado | `validate_in_options` rejeita |
| User picker cross-tenant | Atribuir user de outro workspace | `validate_workspace_member` |
| EAV abuse (DoS) | Milhares de valores por issue | Limitar nº de campos por workspace e por contexto |

## Validação como fronteira

```python
def set_custom_value(issue, field, raw, user):
    cfg = field_config_item(field, issue.type)       # contexto
    if cfg.is_hidden or cfg.is_readonly:
        raise PermissionDenied("Campo não editável neste contexto.")
    value = VALIDATORS[field.field_type](raw, field.settings)  # tipo + settings
    write_typed_column(issue, field, value)          # coluna certa
```

- Required vazio → `422`. O servidor decide required/hidden/readonly, não o
  cliente.

## Render seguro

- Texto/paragraph: escapar HTML; sem render de markup arbitrário.
- URL: validar esquema; `rel="noopener noreferrer"` em links.
- JSON (select/user/cascade): só estrutura esperada; nunca `eval`.

## Permissões

- Definir campos/configurations → ADMIN.
- Editar valor → `issue.edit` + campo editável no contexto.
- Components → `project.admin`.

## Auditoria

- Mudanças de valor entram no `IssueActivity` (histórico da issue).
- Alterações de definição/configuration registam ator (audit do `BaseModel`).
