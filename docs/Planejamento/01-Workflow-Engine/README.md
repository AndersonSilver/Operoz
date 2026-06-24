# 01 — Workflow Engine (P0)

> Pré-requisito de leitura: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).

## Visão

O Operis tem **estados** (`State`) por projeto com grupos (backlog, started,
done…), mas não tem **transições** com nome, **condições**, **validadores**,
**post-functions** nem um **designer visual**. Esta feature traz o motor de
workflow ao nível do Jira, reutilizando o canvas React Flow já usado na
automação.

## Mapeamento ao roadmap

Cobre os itens §5 do roadmap (`5.1.1`–`5.1.12`): designer visual, transições,
condições, validadores, post-functions, screens, workflow scheme, draft
workflows, transições globais.

## Escopo

**Inclui:** modelo de Workflow/Transition/Condition/Validator/PostFunction/
Screen/Scheme; API de CRUD e de execução de transição; editor visual; ligação
de workflow a tipo de issue por projeto.

**Exclui (fora desta pasta):** automação por eventos genéricos (ver feature 03);
analytics de tempo-em-estado (ver feature 08, que consome o histórico aqui
gerado).

## Decisões-chave

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Reusar o canvas React Flow da automação, parametrizando node types | Editor de grafo novo — duplicação |
| 2 | Workflow guardado como grafo (estados=nós, transições=arestas) + versão publicada, como `BoardAutomationRule` | Tabelas rígidas sem versionamento |
| 3 | Transição valida via pipeline: condições → validadores → muda estado → post-functions | Lógica espalhada na view |
| 4 | `WorkflowScheme` mapeia (issue_type → workflow) por projeto | Um workflow fixo por projeto |
| 5 | Draft vs published: editar sem afetar issues até publicar | Edição direta no workflow ativo |

## Fases de entrega

1. **F1 — Núcleo:** modelos Workflow/Transition + designer visual (estados e
   transições, sem condições). Estado inicial configurável.
2. **F2 — Regras:** condições, validadores, post-functions; execução de
   transição via API com pipeline.
3. **F3 — Esquemas:** WorkflowScheme por tipo de issue; draft/publish;
   transições globais; screens.

## Ficheiros desta pasta

- [01-modelo-de-dados.md](./01-modelo-de-dados.md)
- [02-contrato-de-api.md](./02-contrato-de-api.md)
- [03-frontend.md](./03-frontend.md)
- [04-seguranca.md](./04-seguranca.md)
- [05-clean-code-e-testes.md](./05-clean-code-e-testes.md)

## Reuso direto

- `automation-utils.ts` (`flowToGraph`/`graphToFlow`) e o canvas em
  `core/components/settings/board/automation/`.
- `State` existente (`db/models/state.py`) como nós do workflow.
- `IssueActivity` para registar cada transição (consumido pela feature 08).
