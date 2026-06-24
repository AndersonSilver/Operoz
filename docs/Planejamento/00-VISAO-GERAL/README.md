# 00 — Visão Geral & Princípios de Arquitetura

Esta pasta é a **fonte única de verdade** dos padrões transversais. As pastas de
feature referenciam estes documentos em vez de repetir convenções (DRY aplicado
à própria documentação).

## Documentos

| Ficheiro | Conteúdo |
| --- | --- |
| [01-padroes-backend.md](./01-padroes-backend.md) | Modelos, views, serializers, URLs, paginação, migrações |
| [02-padroes-frontend.md](./02-padroes-frontend.md) | Split CE/core/app, MobX, services, React Flow, i18n |
| [03-seguranca-transversal.md](./03-seguranca-transversal.md) | RBAC, secrets, validação, isolamento, threat-model base |
| [04-clean-code-global.md](./04-clean-code-global.md) | Nomenclatura, SOLID, limites, lint, code review |
| [05-estrategia-de-testes.md](./05-estrategia-de-testes.md) | Pirâmide de testes pytest + Playwright |

## Princípios de arquitetura do programa

### 1. Camadas e fronteiras

```text
┌────────────────────────────────────────────────────────────┐
│  apps/web (React Router + MobX)                            │
│   ├── core/   → implementação base                         │
│   ├── ce/     → extensões (stubs sobrepõem core)           │
│   └── app/    → rotas (mergeRoutes core+extended)          │
├────────────────────────────────────────────────────────────┤
│  packages/services (APIService)  ←→  packages/types        │
├────────────────────────────────────────────────────────────┤
│  apps/api (Django REST)                                    │
│   ├── app/views        → ViewSets (BaseViewSet)            │
│   ├── app/serializers  → DynamicBaseSerializer            │
│   ├── app/permissions  → @allow_permission, ROLE          │
│   ├── db/models        → BaseModel / ProjectBaseModel     │
│   └── automation/      → compiler → dispatcher → executor │
├────────────────────────────────────────────────────────────┤
│  Postgres (UUID, soft-delete) · Redis/Valkey · RabbitMQ   │
│  Celery workers · MinIO/S3                                 │
└────────────────────────────────────────────────────────────┘
```

### 2. Regras de ouro (aplicam-se a toda feature nova)

1. **Workspace-scoped sempre.** Nenhuma query sem filtro de workspace. Entidades
   project-scoped herdam `ProjectBaseModel` (que auto-preenche `workspace`).
2. **UUID + soft-delete.** Toda entidade herda `BaseModel`: id UUID, audit
   (`created_by`/`updated_by`/`created_at`/`updated_at`), soft-delete
   (`deleted_at`). Nunca usar `delete()` físico em dados de utilizador.
3. **Permissão explícita por endpoint.** Cada action declara
   `@allow_permission([...], level=...)`. Sem decorator = bug de segurança.
4. **Serializer Base/Dynamic/Lite.** Nunca expor o `ModelSerializer` cru; usar
   a hierarquia para controlar campos e expansão.
5. **Frontend em `core/` com stub em `ce/`.** Toda UI nova segue o split para
   permitir feature-flag sem fork.
6. **Reutilizar o canvas React Flow.** Workflow Designer e Rule Builder NÃO
   reimplementam editor de grafo — reusam `automation-utils.ts`
   (`flowToGraph`/`graphToFlow`) e os node types existentes.
7. **i18n pt-BR.** Toda string visível passa pelo `TranslationStore`.

### 3. Decisões macro

| # | Decisão | Alternativa rejeitada |
| --- | --- | --- |
| 1 | Estender o motor de automação existente (graph JSON) para Workflow e Rule Builder | Construir motor novo — duplicação e risco |
| 2 | OQL compila para Django `Q` objects (não SQL cru) | SQL string interpolada — risco de injeção |
| 3 | Gadgets/dashboards guardam layout como JSON versionado | Tabela rígida por tipo de gadget — pouco flexível |
| 4 | PermissionScheme reutiliza `BoardRolePermission` como base de chaves | Sistema de permissões paralelo — fragmentação |
| 5 | Worklog é entidade `ProjectBaseModel` independente do Issue | Campos no Issue — perde histórico e auditoria |

### 4. Faseamento global

As features estão ordenadas por prioridade do roadmap (P0 → P2). Recomenda-se
implementar **uma feature de cada vez, verticalmente** (modelo → API → frontend
→ testes), em vez de fazer todos os modelos primeiro. Cada pasta documenta as
suas próprias fases internas.

## Referências de código (baseline)

- `apps/api/operis/db/models/base.py` — `BaseModel`, `ProjectBaseModel`
- `apps/api/operis/app/views/base.py` — `BaseViewSet`
- `apps/api/operis/app/permissions/base.py` — `ROLE`, `@allow_permission`
- `apps/api/operis/app/serializers/base.py` — `DynamicBaseSerializer`
- `apps/api/operis/automation/` — `compiler.py`, `dispatcher.py`, `executor.py`
- `apps/web/core/components/settings/board/automation/board-automation-canvas.tsx`
- `packages/services/src/api.service.ts` — `APIService`
