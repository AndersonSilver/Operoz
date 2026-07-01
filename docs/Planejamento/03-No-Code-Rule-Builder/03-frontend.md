# 03 — Frontend · No-Code Rule Builder

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).
Base já existe em `core/components/settings/board/automation/`.

## O que já existe (reuso)

- `board-automation-canvas.tsx` — canvas React Flow com `nodeTypes`
  (`AutomationFlowNode`, `DecisionFlowNode`, `ParallelFlowNode`,
  `ScheduleCronFlowNode`).
- `automation-utils.ts` — `flowToGraph`/`graphToFlow`, copy-paste, remoção.

## O que é novo (camada no-code)

```text
core/components/settings/board/automation/
├── palette/
│   ├── block-palette.tsx        # paleta WHEN/IF/THEN, arrastar para o canvas
│   └── block-card.tsx
├── inspector/
│   ├── node-form.tsx            # formulário gerado do JSON Schema do bloco
│   ├── widgets/
│   │   ├── state-select.tsx     # x-source: states
│   │   ├── oql-input.tsx        # x-widget: oql (reusa editor da feature 02)
│   │   └── user-picker.tsx
│   └── smart-value-helper.tsx   # inserir {{issue.summary}} etc.
├── templates/
│   └── template-gallery.tsx     # criar regra a partir de template
└── dry-run/
    └── dry-run-timeline.tsx     # passos simulados
```

- **Formulários gerados:** `node-form.tsx` lê o `schema` do catálogo e rende­riza
  o widget certo via `x-widget`/`x-source`. Adicionar um bloco novo no backend
  não exige código de formulário novo no frontend.
- **Smart values:** helper que sugere variáveis disponíveis no contexto
  (`{{issue.*}}`, `{{triggerUser.*}}`, `{{now}}`) com autocomplete.

## Store

`AutomationStore` (provavelmente já existe parcialmente) ganha:
`catalog`, `templates`, `dryRunByRule`. Padrão observable + actions.

## Service

`automation.service.ts`: além do CRUD existente — `getCatalog`, `listTemplates`,
`createFromTemplate`, `dryRun`.

## Tipos (`@operoz/types`)

Reusar `TAutomationGraph`/`TAutomationGraphNode`/`TAutomationGraphEdge` (já
definidos em `board-automation.ts`). Adicionar `TCatalogBlock`,
`TRuleTemplate`, `TDryRunStep`.

## Rotas

As settings de automação do board já existem
(`settings/boards/:boardSlug/automacao*`). A paleta no-code integra-se na rota
`automacao` (canvas principal); galeria de templates em `automacao/templates`
(já existe rota).

## i18n (pt-BR)

`automation.palette.when`, `automation.block.issue.transitioned`,
`automation.smartvalue.help`, `automation.dryrun.run`, etc.

## UX

- Três zonas visuais: **Quando** (trigger), **Se** (condições),
  **Então** (ações), mapeando para o grafo.
- Validação ao vivo: nó sem config obrigatória fica marcado.
- Botão **Testar (dry-run)** antes de **Publicar** — publicar bloqueado até
  passar dry-run (regra de governança, ver segurança).
