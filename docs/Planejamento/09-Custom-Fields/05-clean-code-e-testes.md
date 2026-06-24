# 05 — Clean Code & Testes · Custom Fields

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operis/
├── db/models/custom_field.py          # JÁ EXISTE — estender tipos
├── db/models/issue_custom_value.py
├── custom_fields/
│   ├── types.py        # schema de settings por tipo
│   ├── validators.py   # VALIDATORS por field_type (puros)
│   ├── columns.py      # mapeia tipo → coluna de valor; leitura/escrita
│   └── config.py       # field_config_item(field, issue_type)
├── app/views/custom_field/…
└── app/serializers/custom_field.py
```

## Princípios específicos

- **Tabela de despacho por tipo** (`VALIDATORS`, `columns`): adicionar um tipo =
  uma entrada, sem `if/elif` gigantes. Open/Closed.
- Validadores **puros** (valor cru + settings → valor normalizado | erro).
- `columns.py` é a única peça que sabe que coluna corresponde a que tipo —
  encapsula o EAV controlado.
- Frontend: um dispatcher de widget por tipo; sem ramos espalhados.

## Casos de teste

### Unit

| Caso | Esperado |
| --- | --- |
| validar NUMBER respeitando min/max | aceita/rejeita |
| SELECT fora de options | erro |
| CASCADING parent/child incoerente | erro |
| URL inválida | erro |
| USER de outro workspace | erro |
| coluna correta por tipo | valor na coluna tipada certa |

### Integração

| Caso | Esperado |
| --- | --- |
| set valor em campo readonly | `403` |
| required vazio no contexto | `422` |
| cf[] em OQL filtra por valor | resultados certos |
| apagar campo (soft) | valores recuperáveis |
| editar valor sem `issue.edit` | `403` |

### e2e

- Criar campo SELECT, configurá-lo como obrigatório para tipo Bug, e confirmar
  validação ao criar/editar uma issue Bug.

## Definition of Done

- [ ] Tipos completos + EAV controlado com colunas tipadas e índices.
- [ ] Field configuration (required/hidden/readonly) aplicada server-side.
- [ ] Components e Resolution entregues.
- [ ] Integração OQL `cf[]` testada (incl. cross-tenant negado).
- [ ] Render seguro (escape/URL); lint/format/types verdes.
