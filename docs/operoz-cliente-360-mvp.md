# Cliente 360 — MVP (Operoz)

**Objetivo:** vista executiva no **board** para acompanhar cada cliente (projeto) sem abrir dezenas de ecrãs.

**Modelagem assumida (Modelo A):** 1 projeto Operoz = 1 cliente; módulos = frentes de entrega.

---

## Personas

| Persona        | Necessidade                                                  |
| -------------- | ------------------------------------------------------------ |
| Gestão (chefe) | Semáforo por cliente: report da semana, atrasos, sustentação |
| PM / líder     | Atalhos para projeto, status report e lista filtrada         |

---

## Escopo MVP (esta entrega)

### API

| Endpoint                                       | Descrição                                                 |
| ---------------------------------------------- | --------------------------------------------------------- |
| `GET …/boards/{slug}/client-360/`              | Lista todos os projetos do board com KPIs agregados       |
| `GET …/boards/{slug}/client-360/{project_id}/` | Detalhe de um cliente: módulos × report, amostra de cards |

Query opcional: `period_start`, `period_end` (ISO date; default = semana corrente seg–dom).

### UI

| Rota                                  | Conteúdo                                   |
| ------------------------------------- | ------------------------------------------ |
| `/boards/{slug}/clientes`             | Tabela/cards com semáforo, filtros rápidos |
| `/boards/{slug}/clientes/{projectId}` | Detalhe + atalhos                          |

Tab **Clientes** no header do board (junto a Resumo, Lista, …).

### Métricas por cliente

| Bloco             | Regra                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Status report** | Por módulo ativo: `complete` (todos publicados), `partial`, `missing`, `n/a` (sem módulos) |
| **Atrasados**     | Cards em aberto com `target_date` &lt; hoje                                                |
| **Sustentação**   | Cards em aberto cujo tipo contém «sustent» (case insensitive)                              |
| **Saúde**         | `critical` / `warning` / `ok` (derivado)                                                   |

### Fora do MVP

- Entidade `Client` separada de `Project`
- Matriz histórica de semanas
- SLA engine / Intake configurável por board
- Alertas por automação

---

## Saúde (semáforo)

| Nível      | Condição (qualquer uma)                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- |
| `critical` | Report `missing` com módulos &gt; 0 **ou** atrasados ≥ 5 **ou** sustentação com SLA estourado |
| `warning`  | Atrasados &gt; 0 **ou** report `partial` **ou** sustentação aberta &gt; 0                     |
| `ok`       | Caso contrário                                                                                |

---

## Entregue na v2 (UI rica)

- Navegação **semana anterior / atual / seguinte**
- **Gráficos:** saúde da carteira (donut), cobertura de status report (donut), atrasos por cliente (barras)
- **Briefing executivo (IA)** na **página do cliente** (detalhe), via `ai-assistant`
- Painel **«Requer atenção»** com links rápidos
- Cards com **barra de progresso** do report por módulo
- Layout em grelha (2 colunas em ecrãs largos)

## Próximos passos (pós-v2)

1. Filtro por tipo de sustentação configurável no board (settings)
2. Widget no Resumo do board («3 clientes sem report»)
3. Export CSV da matriz cliente × semana
4. Integração automação (lembrete sexta-feira)
5. Histórico multi-semana (tendência em linha)
