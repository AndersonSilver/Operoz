# 12 — DevOps & Smart Commits (P2)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis já tem integração GitHub básica (`integration/github.py`, sync de
issues/comentários). Faltam o **painel de desenvolvimento** na issue (branches/
PRs/commits/builds), os **smart commits** (mensagens de commit que transicionam
issues e registam tempo) e o **deployment tracking** (roadmap §18). Esta feature
fecha o ciclo dev↔issue.

## Mapeamento ao roadmap

Cobre §18 (`18.1`–`18.11`): development panel, smart commits, branch
auto-creation, build status, deployment tracking, code review status, GitLab.

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Normalizar eventos Git num modelo `DevLink` agnóstico do provider | Acoplar a GitHub |
| 2 | Smart commits parseados no webhook handler, ações via motor existente | Lógica espalhada |
| 3 | Smart commit corre no contexto do committer (se mapeável a membro) | Ações sem dono |
| 4 | Deployment tracking reusa `DeployBoard` (modelo já existe) | Modelo novo |
| 5 | Build/CI status via webhook receiver genérico | Integração por ferramenta |

## Escopo

**Inclui:** DevLink normalizado, development panel na issue, smart commits,
branch auto-creation, build status, deployment tracking, GitLab.

**Exclui:** Bitbucket e feature flags pagos (P3/P4, ficam notas).

## Fases

1. **F1 — Dev panel + smart commits:** normalizar PRs/branches/commits, painel
   na issue, parser de smart commits.
2. **F2 — Builds + deployments:** receiver de CI status, deployment tracking.
3. **F3 — GitLab + branch creation:** paridade GitLab, criar branch a partir da
   issue.

## Ficheiros

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso

- `integration/github.py`, `integration/slack.py` (padrão de integração).
- `DeployBoard` (modelo já existe) para deployments.
- Motor de automação (feature 03) para ações de smart commit; Time Tracking
  (feature 05) para `#time`.
