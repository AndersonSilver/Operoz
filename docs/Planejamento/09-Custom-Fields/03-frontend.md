# 03 — Frontend · Custom Fields

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/custom-fields/
├── field-definition-list.tsx     # gerir campos do workspace
├── field-definition-modal.tsx    # criar/editar campo (form do schema do tipo)
├── field-configuration-editor.tsx# required/hidden/readonly/default por contexto
├── widgets/                       # render por tipo (reusa @operoz/ui)
│   ├── text-field.tsx
│   ├── number-field.tsx
│   ├── select-field.tsx
│   ├── multi-select-field.tsx
│   ├── date-field.tsx
│   ├── user-picker-field.tsx
│   ├── url-field.tsx
│   ├── checkbox-field.tsx
│   ├── radio-field.tsx
│   └── cascading-field.tsx
├── issue-custom-fields.tsx        # secção na issue: render dos valores
└── component-manager.tsx          # Components do projeto
```

- **`issue-custom-fields`** lê a field configuration do contexto (tipo de issue)
  e rende­riza só os campos visíveis, marcando obrigatórios e desabilitando
  readonly. Um único componente despacha por `field_type` para o widget certo.
- Widgets reutilizam primitivos de `@operoz/ui` (não recriar inputs).

## Store

```text
core/store/custom-fields/custom-field.store.ts → CustomFieldStore
```

- `fieldsByWorkspace`, `valuesByIssue`, `configurations`. Actions CRUD +
  `setValue`. `computedFn` `visibleFieldsFor(issueType)`.

## Service

`custom-field.service.ts`: `listFields`, `fieldTypes`, `saveField`,
`configurations`, `setValue`, `components`, `resolutions`.

## Tipos (`@operoz/types`)

```ts
export type TCustomField = {
  id: string;
  key: string;
  field_type: string;
  settings: Record<string, unknown>;
};
export type TCustomValue = { field: string; value: unknown };
```

## Rotas

```text
:workspaceSlug/settings/custom-fields
:workspaceSlug/settings/field-configurations
:workspaceSlug/settings/projects/:pid/components
```

Valores aparecem no **issue detail** existente (secção "Campos").

## i18n (pt-BR)

`cf.type.number`, `cf.required`, `cf.config.hidden`, `component.lead`,
`resolution.fixed`, etc.

## UX

- Form de definição muda conforme o tipo (opções para select, formato para
  number, etc.) — gerado do schema do tipo.
- Na issue, validação inline (obrigatório vazio fica marcado) antes do save.
- Cascading: child filtra conforme parent.
