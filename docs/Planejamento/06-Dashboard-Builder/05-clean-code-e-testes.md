# 05 — Clean Code & Testes · Dashboard Builder

Baseline em [`00-VISAO-GERAL/04-clean-code-global.md`](../00-VISAO-GERAL/04-clean-code-global.md)
e [`05-estrategia-de-testes.md`](../00-VISAO-GERAL/05-estrategia-de-testes.md).

## Organização de ficheiros

```text
apps/api/operis/
├── db/models/dashboard.py
├── app/views/dashboard/base.py      # DashboardViewSet, GadgetViewSet
├── app/serializers/dashboard.py
├── app/urls/dashboard.py
└── dashboards/
    ├── gadgets.py        # GADGET_REGISTRY + GadgetSpec
    ├── resolver.py       # resolve_gadget_data(gadget, user) → dados
    └── aggregation.py    # group_by / time_series sobre issues
```

## Princípios específicos

- **Registry de gadgets** (Open/Closed): novo gadget = nova `GadgetSpec` +
  componente de render. Sem tocar no resolver genérico.
- **Resolver único** (`resolve_gadget_data`) que despacha por `source`
  (oql/metric/activity/static) — um só ponto onde a permissão do viewer é
  aplicada.
- Frontend: `gadget-frame` centraliza loading/erro/refresh; cada gadget só
  desenha `data`. Sem duplicar lógica de fetch por gadget.
- Reutilizar OQL e métricas; o dashboard não recalcula nada que já exista.

## Casos de teste

### Unit

| Caso | Esperado |
| --- | --- |
| `resolve_gadget_data` source=oql | usa `run_oql` com o user dado |
| agregação `group_by=assignee` | série correta |
| time_series created_vs_resolved | pontos por dia |
| gadget_type inválido | erro |

### Integração

| Caso | Esperado |
| --- | --- |
| viewer vê dashboard partilhado | só dados que pode ver |
| owner com mais acesso vs viewer | viewer não vê dados restritos |
| viewer (permission=view) edita gadget | `403` |
| membro partilha com workspace | `403` se não owner/admin |
| `gid` de outro dashboard | `404` (IDOR) |
| auto-refresh abaixo do mínimo | rejeitado/normalizado |

### e2e

- Criar dashboard, adicionar gadget pizza com OQL, partilhar com colega, e
  confirmar (com utilizadores de permissões diferentes) que o recorte de dados
  funciona.

## Definition of Done

- [ ] 3 modelos + registry de gadgets + resolver único.
- [ ] Dados resolvidos no contexto do viewer (teste de fuga bloqueante).
- [ ] Grid drag/resize persistente; gráficos Recharts.
- [ ] Reuso de OQL/métricas confirmado; lint/format/types verdes.
