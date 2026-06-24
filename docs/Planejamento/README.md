# Planejamento — Arquitetura de Paridade Jira do Operis

Esta pasta transforma o roadmap de alto nível
([operis-jira-paridade-roadmap-completo.md](../operis-jira-paridade-roadmap-completo.md))
em **blueprints de arquitetura executáveis**. Cada subpasta numerada é uma
feature/épico do roadmap, com a arquitetura completa a usar — sempre alinhada
aos padrões reais já existentes no codebase Operis e com ênfase em
**segurança** e **clean code**.

## Como usar

1. Leia primeiro a pasta [`00-VISAO-GERAL/`](./00-VISAO-GERAL/). Ela define os
   padrões transversais (backend, frontend, segurança, clean code, testes) que
   **todas** as features herdam. Os ficheiros das features referenciam estes
   padrões em vez de os repetir.
2. Escolha a feature a implementar e leia os 6 ficheiros da pasta na ordem:
   `README` → `01-modelo-de-dados` → `02-contrato-de-api` → `03-frontend` →
   `04-seguranca` → `05-clean-code-e-testes`.
3. Cada documento é um ADR no formato interno do Operis
   (Contexto → Decisões → API → Segurança → Rollback → Referências).

## Estrutura de cada pasta de feature

| Ficheiro | Conteúdo |
| --- | --- |
| `README.md` | Visão, escopo, mapeamento ao roadmap, fases de entrega |
| `01-modelo-de-dados.md` | Modelos Django (herdam `BaseModel`/`ProjectBaseModel`), campos, índices, migração |
| `02-contrato-de-api.md` | Endpoints REST, serializers, permissões, exemplos request/response |
| `03-frontend.md` | Componentes React, stores MobX, services, rotas, i18n |
| `04-seguranca.md` | Threat-model, RBAC, validação, isolamento, auditoria |
| `05-clean-code-e-testes.md` | Convenções, organização de ficheiros, casos de teste |

## Índice de features

| NN | Feature | Prioridade | Gap-chave que resolve |
| --- | --- | --- | --- |
| [00](./00-VISAO-GERAL/) | **Visão Geral & Padrões** | — | Fundamentos transversais |
| [01](./01-Workflow-Engine/) | **Workflow Engine** | P0 | Sem workflow designer; estados sem transições/condições |
| [02](./02-OQL-Query-Language/) | **OQL (Operis Query Language)** | P0 | Sem linguagem de query tipo JQL |
| [03](./03-No-Code-Rule-Builder/) | **No-Code Rule Builder** | P0 | Automação só por código/grafo técnico |
| [04](./04-Board-Hub-Cross-Project/) | **Board Hub Cross-Project** | P0 | Vistas agregadas do board incompletas |
| [05](./05-Time-Tracking/) | **Time Tracking** | P1 | Sem worklog/timesheet |
| [06](./06-Dashboard-Builder/) | **Dashboard Builder** | P1 | Sem dashboards com gadgets |
| [07](./07-Permission-Scheme-Seguranca/) | **Permission Scheme & Segurança** | P1 | RBAC pouco granular |
| [08](./08-Relatorios-Analytics/) | **Relatórios & Analytics** | P1 | Sem burndown/velocity/CFD prontos |
| [09](./09-Custom-Fields/) | **Custom Fields** | P2 | Campos personalizados limitados |
| [10](./10-Advanced-Roadmaps-Plans/) | **Advanced Roadmaps (Plans)** | P2 | Sem capacity/cenários cross-project |
| [11](./11-Service-Management-SLA/) | **Service Management & SLA** | P2 | SLA/filas incompletos |
| [12](./12-DevOps-Smart-Commits/) | **DevOps & Smart Commits** | P2 | Sem dev panel / smart commits |

## Princípios não-negociáveis

- **Reuso primeiro.** Antes de criar algo novo, reutilizar padrões existentes:
  `BaseModel`, `@allow_permission`, `DynamicBaseSerializer`, `APIService`,
  o canvas React Flow da automação, e a paginação cursor.
- **Segurança por padrão.** Toda nova rota nasce autenticada e com RBAC
  explícito; todo input é validado; todo segredo é encriptado; toda execução
  arbitrária (OQL, scripts) é isolada e com limites.
- **Clean code.** Funções pequenas e com responsabilidade única, nomes
  descritivos, sem duplicação, testes a acompanhar a feature.
- **Self-host e multi-tenant.** Tudo é workspace-scoped; nada vaza entre
  workspaces.

## Estado

Documentação de planeamento — **não altera código de aplicação**. Nenhuma
migração ou alteração em `apps/` decorre diretamente destes ficheiros; eles
são o guia para quem implementar.
