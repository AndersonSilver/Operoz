# 03 — Frontend · DevOps & Smart Commits

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/devops/
├── development-panel.tsx       # secção na issue: branches | PRs | commits | builds
├── dev-link-item.tsx           # linha com estado (open/merged) + ícone do provider
├── build-status-badge.tsx      # pending/success/failed
├── deployment-list.tsx         # ambientes onde a issue foi deployed
├── create-branch-modal.tsx     # repo + base → cria branch
└── smart-commit-help.tsx       # ajuda do formato de smart commit
```

- **`development-panel`** aparece no issue detail quando há `DevLink`s; agrupa
  por tipo (branches, PRs, commits) e mostra build/review status.
- **`dev-link-item`** é provider-agnóstico (ícone deriva de `provider`).

## Settings de integração

```text
core/components/settings/integrations/
├── github-config.tsx           # já há base
├── gitlab-config.tsx
└── ci-webhook-config.tsx       # URL + segredo de assinatura
```

## Store

```text
core/store/devops/devops.store.ts → DevOpsStore
```

- `devLinksByIssue`, `buildsByIssue`, `deploymentsByIssue`. Actions de fetch +
  `createBranch`.

## Service

`devops.service.ts`: `devLinks`, `builds`, `deployments`, `createBranch`,
`integrationConfig`.

## Tipos (`@operis/types`)

```ts
export type TDevLink = {
  id: string; provider: "github" | "gitlab";
  link_type: "branch" | "pull_request" | "commit";
  title: string; url: string; state: string; review_state?: string;
};
```

## Rotas

```text
:workspaceSlug/settings/integrations/:provider
```

Development panel vive no **issue detail** (não rota nova).

## i18n (pt-BR)

`dev.panel.branches`, `dev.panel.pull_requests`, `build.success`,
`deployment.production`, `smartcommit.help.title`, etc.

## UX

- Painel só visível quando há atividade Git ligada.
- Build/review status com cor; link direto para o provider.
- `create-branch-modal` sugere nome a partir da chave + título da issue.
- Ajuda de smart commit acessível a partir do painel.
