# 05 — Clean Code & Testes · No-Code Rule Builder

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operis/automation/
├── catalog/
│   ├── registry.py      # CatalogBlock + TRIGGERS/CONDITIONS/ACTIONS
│   ├── triggers.py      # to_node por trigger
│   ├── conditions.py    # to_node por condição (inclui oql.matches)
│   └── actions.py       # to_node por ação
├── templates_registry.py  # JÁ EXISTE — estender com AutomationRuleTemplate
└── (compiler/dispatcher/executor/policy/governance — JÁ EXISTEM)

app/views/board/automation_catalog.py   # GET catalog
app/views/board/automation_templates.py  # JÁ EXISTE — from-template
```

## Princípios específicos

- **Catálogo declarativo** (Open/Closed): um bloco no-code = uma `CatalogBlock`
  com `schema` (JSON Schema) + `to_node`. Não se toca no compiler/executor para
  adicionar blocos.
- **Uma fonte de verdade do contrato:** o `schema` do bloco gera o formulário no
  frontend e valida a config no backend — sem duplicar regras de validação.
- Reaproveitar OQL (feature 02) para `oql.matches` em vez de reinventar matching.
- Não duplicar o runtime: o builder é UI + catálogo; a execução é o motor.

## Casos de teste

### Unit

| Caso | Esperado |
| --- | --- |
| `to_node` de cada trigger/condition/action | nó válido para o compiler |
| `from-template` com params | grafo parametrizado correto |
| smart value escaping (HTML/JSON/URL) | escapado por contexto |
| smart value tenta `{{secret:x}}` | não expande |
| profundidade de cadeia > limite | execução cortada (anti-loop) |

### Integração

| Caso | Esperado |
| --- | --- |
| `GET catalog` | blocos + schemas; respeita i18n |
| criar regra no-code → dry-run | timeline sem efeitos colaterais |
| publish sem dry-run (policy on) | `400` exige dry-run |
| webhook action fora da allowlist | bloqueado |
| from-template por MEMBER sem `automation.manage` | `403` |

### e2e

- Construir regra "quando issue vai para Done, enviar e-mail ao lead" pela
  paleta, testar com dry-run, publicar, e confirmar execução num evento real
  (ou simulado).

## Definition of Done

- [ ] Catálogo declarativo com schemas; formulários gerados no frontend.
- [ ] `from-template` + galeria.
- [ ] Dry-run integrado e obrigatório antes de publicar (quando policy on).
- [ ] Testes de SSRF/allowlist, anti-loop e escaping verdes.
- [ ] Reuso confirmado (sem motor novo); lint/format/types verdes.
