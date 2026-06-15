"""Catálogo de módulos e cards — Visão 360 Operoz (programa completo).

Ref: docs/operis-visao-360-roadmap.md, docs/operis-cliente-360-mvp.md
"""

from __future__ import annotations

# (módulo, status, [(título, descrição HTML, prioridade)])
# Títulos e módulos usam sufixo após "[ OPEROZ ] - " em MAIÚSCULAS (prefixo aplicado pelo seed).

VISAO_360_CATALOG: list[tuple[str, str, list[tuple[str, str, str]]]] = [
    (
        "- VISAO 360 — GOVERNANÇA E ROADMAP",
        "in-progress",
        [
            (
                "- ADR — ARQUITETURA VISÃO 360 OPERoz",
                """<p><strong>Objetivo:</strong> Formalizar decisões arquiteturais do programa Visão 360 Operoz — cockpit de carteira de clientes, health engine, comunicação e FinOps — com alternativas avaliadas e caminho de evolução MVP → enterprise.</p>
<p><strong>Contexto:</strong> O MVP actual expõe <code>GET /api/workspaces/{slug}/client-360/</code> e detalhe por <code>project_id</code>, com semáforo derivado em <code>client_360.py</code>. O roadmap G–6 define dezenas de incrementos que precisam de ADR para evitar divergência FE/BE e retrabalho em score, matriz e integrações.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Documento ADR em <code>Operis/docs/adr/</code> cobrindo: modelo 1 projeto = 1 cliente vs entidade Client; health score 0–100 vs semáforo; agregação workspace vs board; estratégia de cache e read replica; extensibilidade PSA/CRM.</li>
<li>Diagramas: fluxo lista → detalhe → assistente; boundaries entre <code>utils/client_360.py</code> e futuros serviços Health/FinOps.</li>
<li>Decisões sobre paginação server-side, saved views (localStorage vs API) e feature flags por fase.</li>
<li>Plano de rollback e compatibilidade com board-level <code>/boards/{slug}/client-360/</code> legado.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado que o ADR está publicado, Quando tech lead revisa, Então todas as fases G–6 têm owner e dependências explícitas.</li>
<li>Dado alternativa «entidade Client imediata», Quando comparada com Modelo A, Então trade-offs de migração estão documentados.</li>
<li>Dado endpoint workspace 360, Quando FE consome, Então contrato OpenAPI ou exemplos JSON estão anexados ao ADR.</li>
<li>Dado deploy parcial Fase 1, Quando semáforo legado coexiste com score, Então estratégia de transição está definida.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Nenhuma implementação de fase 1+ sem ADR aprovado.</li>
<li>Alinhamento com card de roadmap doc e matriz de dependências.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "urgent",
            ),
            (
                "- ROADMAP DOC — VISÃO 360 E FASES G-6",
                """<p><strong>Objetivo:</strong> Manter documento vivo do programa Visão 360 com fases, entregáveis, métricas de sucesso e ligação ao backlog OPEROZDP.</p>
<p><strong>Contexto:</strong> Existe <code>operis-visao-360-roadmap.md</code> inicial; o programa cresce para 70+ cards. Produto e engenharia precisam de fonte única sincronizada com catálogo seed e estado real da API/UI.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Actualizar <code>Operis/docs/operis-visao-360-roadmap.md</code> com tabela fase × módulo × API × rotas UI.</li>
<li>Secções: visão, personas, health actual vs alvo, FinOps, IA, enterprise, comandos seed/mark done.</li>
<li>Ligação cruzada com <code>operis-cliente-360-mvp.md</code> e checklist go-live assistente se aplicável.</li>
<li>Versionamento: data de última revisão e changelog por fase.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado novo card implementado, Quando fase concluída, Então roadmap reflecte estado «entregue» com link PR.</li>
<li>Dado leitor PM, Quando abre roadmap, Então entende rotas <code>/visao-360</code> e endpoints workspace.</li>
<li>Dado card de catálogo seed, Quando importado, Então títulos de módulo batem certo com doc.</li>
<li>Dado Fase 4 FinOps, Quando documentada, Então dependências Harness estão explícitas.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>ADR aprovado (recomendado em paralelo).</li>
<li>Catálogo <code>operoz_visao_360_catalog.py</code> como espelho do backlog.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "urgent",
            ),
            (
                "- MATRIZ DEPENDÊNCIAS — PROGRAMA VISÃO 360",
                """<p><strong>Objetivo:</strong> Visualizar caminho crítico e paralelização entre módulos G, 0–6 do Visão 360 Operoz.</p>
<p><strong>Contexto:</strong> Fases têm dependências naturais: UX Command Center antes de saved views avançado; Health Engine antes de alertas IA; comunicação antes de QBR guest link enterprise.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Diagrama Mermaid no card: G → 0 → (1 ∥ 2 parcial) → 3 → 4 → 5 → 6.</li>
<li>Marcar bloqueios: score 0–100 bloqueia sparklines e explainer IA; matriz semanas bloqueia comparador N vs N-1.</li>
<li>Identificar quick wins paralelos: empty states, export CSV, widget board.</li>
<li>Publicar ordem sugerida de sprint para squad Operoz.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado matriz publicada, Quando PM prioriza sprint, Então cards bloqueados têm dependência na descrição.</li>
<li>Dado Fase 0 incompleta, Quando Fase 3 saved views avançado, Então card marcado como bloqueado.</li>
<li>Dado caminho crítico, Quando estimado, Então ≤ 3 dependências serializam go-live MVP+.</li>
<li>Dado revisão mensal, Quando dependência muda, Então matriz actualizada no card.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Roadmap doc actualizado.</li>
<li>ADR Visão 360.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- SLAS E METAS — COMMAND CENTER CARTEIRA",
                """<p><strong>Objetivo:</strong> Definir metas quantitativas de performance, frescura de dados e UX para a Visão 360 Operoz.</p>
<p><strong>Contexto:</strong> Gestores abrem a lista workspace diariamente; latência e exactidão do semáforo/report afectam confiança. SLAs alimentam alertas operacionais e critérios de aceite das fases seguintes.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Metas propostas: p95 <code>GET …/client-360/</code> &lt; 800ms com 200 clientes; p95 detalhe &lt; 500ms.</li>
<li>Frescura: agregados reflectem alterações de issue/report em &lt; 60s (ou documentar cache TTL).</li>
<li>UX: lista utilizável em mobile; filtros respondem &lt; 200ms client-side.</li>
<li>Qualidade: 0 discrepâncias semáforo vs regras documentadas em testes contract.</li>
<li>Publicar tabela SLAs no card e referenciar no roadmap.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado workspace com 100 projetos, Quando lista 360, Então p95 dentro do SLA em staging.</li>
<li>Dado alteração target_date, Quando refresh lista, Então contagem atrasados actualizada conforme SLA frescura.</li>
<li>Dado SLAs definidos, Quando Fase 7 alertas, Então thresholds mapeados.</li>
<li>Dado teste carga, Quando executado, Então relatório referencia estas metas.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Baseline API actual documentada em MVP.</li>
<li>ADR e matriz de dependências.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
        ],
    ),
    (
        "- VISAO 360 — FASE 0 — COMMAND CENTER UX",
        "planned",
        [
            (
                "- KPI STRIP INLINE NA LISTA WORKSPACE",
                """<p><strong>Objetivo:</strong> Exibir faixa de KPIs agregados (total clientes, críticos, warnings, reports em falta, atrasados, sustentação) no topo da lista Visão 360 workspace.</p>
<p><strong>Contexto:</strong> A API já devolve <code>summary</code> em <code>WorkspaceClient360ViewSet.list</code> com <code>total_clients</code>, <code>health_critical</code>, etc. A UI workspace deve espelhar o padrão do board client-360.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Componente KPI strip em <code>workspace-client-360-list.tsx</code> consumindo <code>response.summary</code>.</li>
<li>Badges clicáveis aplicando filtros rápidos (ex.: só critical).</li>
<li>Sincronizar com selector de período <code>period_start</code>/<code>period_end</code>.</li>
<li>i18n pt-BR/en; responsivo (wrap em mobile).</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado lista 360 carregada, Quando summary presente, Então KPI strip mostra 6 métricas correctas.</li>
<li>Dado clique em «críticos», Quando filtro aplicado, Então lista mostra só clientes health=critical.</li>
<li>Dado mudança de semana, Quando API refetch, Então KPIs actualizam sem reload completo.</li>
<li>Dado guest read-only, Quando acede lista, Então vê KPI strip sem acções admin.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>API workspace client-360 estável.</li>
<li>Rota UI <code>/{workspaceSlug}/visao-360</code>.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "urgent",
            ),
            (
                "- GRÁFICOS INLINE CARTEIRA (DONUT E BARRAS)",
                """<p><strong>Objetivo:</strong> Adicionar visualizações inline na lista workspace: donut saúde da carteira, donut cobertura status report, barras atrasos por cliente.</p>
<p><strong>Contexto:</strong> Board client-360 v2 já prevê gráficos similares; workspace Visão 360 deve reutilizar componentes de <code>board/client-360/*</code> adaptados à agregação multi-board.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Reutilizar/adaptar componentes chart existentes no board.</li>
<li>Dados derivados de <code>clients[]</code> ou endpoint dedicado se performance exigir.</li>
<li>Lazy load gráficos abaixo da fold; skeleton loading.</li>
<li>Acessibilidade: tabela alternativa para screen readers.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado ≥ 5 clientes, Quando gráfico saúde renderiza, Então soma fatias = total_clients.</li>
<li>Dado cliente sem módulos, Quando report coverage, Então classificado n/a no agregado.</li>
<li>Dado período alterado, Quando refetch, Então gráficos reflectem novo período.</li>
<li>Dado ecrã estreito, Quando mobile, Então gráficos empilham verticalmente.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>KPI strip (recomendado antes).</li>
<li>Componentes board client-360 charts.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- PAINEL REQUER ATENÇÃO NA LISTA",
                """<p><strong>Objetivo:</strong> Painel lateral ou secção destacada listando clientes acima de thresholds (critical, report missing, top atrasados) com links directos para detalhe e acções.</p>
<p><strong>Contexto:</strong> MVP v2 board inclui «Requer atenção»; workspace multi-board amplia necessidade de priorização cross-squad.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Secção «Requer atenção» em workspace list com até N itens ordenados por severidade.</li>
<li>Links: detalhe 360, lista issues filtrada, status report do módulo em falta.</li>
<li>Regras alinhadas a <code>build_client_row</code> health e report coverage.</li>
<li>Empty state quando nenhum cliente requer acção.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 3 clientes critical, Quando painel aberto, Então aparecem ordenados por overdue desc.</li>
<li>Dado cliente report missing, Quando link report, Então navega para fluxo correcto de publicação.</li>
<li>Dado todos ok, Quando painel, Então mensagem positiva sem lista vazia confusa.</li>
<li>Dado filtro board activo, Quando painel, Então atenção respecta filtro.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>KPI strip e filtros básicos.</li>
<li>Utils health rules testadas.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- FILTRO MULTI-BOARD NA VISÃO 360",
                """<p><strong>Objetivo:</strong> Permitir filtrar a lista workspace por um ou mais boards (squads), persistindo selecção na sessão.</p>
<p><strong>Contexto:</strong> Project traz <code>board</code> via <code>select_related</code>; clientes de squads diferentes convivem na mesma carteira workspace.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Multi-select boards com busca; query param opcional <code>board_ids</code> ou filtro client-side.</li>
<li>Se server-side: estender viewset list com filtro e testes.</li>
<li>Chip removível por board; contador «X de Y clientes».</li>
<li>URL shareable com boards pré-seleccionados.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 2 boards seleccionados, Quando filtro aplicado, Então só projectos desses boards visíveis.</li>
<li>Dado filtro activo, Quando KPI strip, Então summary recalculado para subset.</li>
<li>Dado URL com board_ids, Quando abrir, Então filtro restaurado.</li>
<li>Dado membro sem acesso a board, Quando filtro, Então board não aparece no selector.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Lista workspace funcional.</li>
<li>Permissões project member activas.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- AGRUPAMENTO POR BOARD NA LISTA",
                """<p><strong>Objetivo:</strong> Modo de visualização agrupando clientes sob cabeçalho de board (squad) colapsável.</p>
<p><strong>Contexto:</strong> Com dezenas de clientes, agrupamento por squad melhora scanability para gestão de portfolio.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Toggle lista plana vs agrupada; grupos ordenados por board.name.</li>
<li>Contadores por grupo: clientes, critical, overdue.</li>
<li>Expand/collapse all; estado persistido localStorage.</li>
<li>Compatible com virtual scroll.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado modo agrupado, Quando render, Então cada board tem cabeçalho sticky opcional.</li>
<li>Dado collapse grupo, Quando expand, Então clientes do board visíveis.</li>
<li>Dado filtro multi-board, Quando agrupado, Então só grupos seleccionados.</li>
<li>Dado export CSV, Quando agrupado, Então inclui coluna board.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Filtro multi-board.</li>
<li>Coluna board visível na lista.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- DRILL-DOWN COLUNAS CONFIGURÁVEIS",
                """<p><strong>Objetivo:</strong> Permitir mostrar/ocultar e reordenar colunas na tabela lista (saúde, report, overdue, sustentação, lead, board, módulos).</p>
<p><strong>Contexto:</strong> PMs e gestores preferem densidades diferentes; padrão similar a saved views e listas de issues.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Menu colunas com checkboxes; drag reorder opcional fase 0.</li>
<li>Defaults sensatos alinhados ao MVP; persistência localStorage por utilizador.</li>
<li>Colunas derivadas de payload <code>build_client_row</code>.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado ocultar coluna sustentação, Quando guardar, Então preferência persiste após refresh.</li>
<li>Dado reorder, Quando tabela renderiza, Então ordem reflectida.</li>
<li>Dado reset, Quando acção, Então volta ao default produto.</li>
<li>Dado mobile, Quando poucas colunas, Então layout card-first.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Lista tabela base.</li>
<li>Saved views básico (integração futura).</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- VISTA GRID COMO DEFAULT EM ECRÃS LARGOS",
                """<p><strong>Objetivo:</strong> Layout grid 2 colunas (cards ricos) como default em viewport ≥ lg, mantendo tabela em ecrãs pequenos ou preferência utilizador.</p>
<p><strong>Contexto:</strong> Board client-360 v2 adoptou grid; workspace deve consistência visual Operoz.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Breakpoint Tailwind; card com barra progresso report por módulo.</li>
<li>Toggle grid/lista; preferência persistida.</li>
<li>Reutilizar card component do board adaptado a workspace.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado viewport 1440px, Quando primeira visita, Então grid 2 colunas activo.</li>
<li>Dado toggle lista, Quando seleccionado, Então tabela full width.</li>
<li>Dado card grid, Quando semáforo critical, Então destaque visual consistente.</li>
<li>Dado 1 cliente, Quando grid, Então layout não quebra.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Componentes card board client-360.</li>
<li>KPI strip acima da grelha.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- EMPTY STATES E ONBOARDING VISÃO 360",
                """<p><strong>Objetivo:</strong> Estados vazios instructivos quando workspace sem projectos com board, sem permissões, ou filtros sem resultados.</p>
<p><strong>Contexto:</strong> First-run experience evita página branca confusa para novos workspaces Operoz.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Cenários: zero projectos; zero após filtro; guest sem clientes; erro API.</li>
<li>CTAs: criar projecto, associar board, limpar filtros, documentação.</li>
<li>Ilustração leve + copy pt-BR marca Operoz.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado workspace sem projectos board-linked, Quando abrir 360, Então empty state com CTA criar projecto.</li>
<li>Dado filtro impossível, Quando 0 resultados, Então sugestão limpar filtros.</li>
<li>Dado erro 403, Quando render, Então mensagem permissão clara.</li>
<li>Dado primeiro acesso admin, Quando tooltip tour opcional, Então dismiss persistido.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Rotas e permissões workspace.</li>
<li>i18n keys dedicadas.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- VIRTUAL SCROLL OU PAGINAÇÃO SERVER-SIDE",
                """<p><strong>Objetivo:</strong> Garantir performance com 100+ clientes via virtualização FE ou paginação/cursor BE.</p>
<p><strong>Contexto:</strong> SLA p95 lista exige não renderizar 500 DOM nodes; ADR deve preferir abordagem.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Avaliar react-virtual vs <code>?page=&page_size=</code> no list endpoint.</li>
<li>Se paginação: meta total, links next; summary global ou por página documentado.</li>
<li>Manter sort estável; loading incremental.</li>
<li>Teste com fixture 200 projectos.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 200 clientes, Quando scroll/paginação, Então FPS aceitável e p95 API dentro SLA.</li>
<li>Dado página 2, Quando carregar, Então sort e filtros preservados.</li>
<li>Dado virtual scroll, Quando scroll rápido, Então sem blank rows prolongados.</li>
<li>Dado teste contract, Quando paginação activa, Então schema documentado.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>SLAs command center.</li>
<li>ADR performance.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- SAVED VIEWS BÁSICO — FILTROS E COLUNAS",
                """<p><strong>Objetivo:</strong> Guardar combinações nomeadas de filtros, colunas e modo grid/lista por utilizador no workspace.</p>
<p><strong>Contexto:</strong> Produto enterprise espera vistas «Minha carteira critical» ou «Squad Alpha» reutilizáveis.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>CRUD views localStorage ou API mínima (nome, payload JSON filtros/colunas).</li>
<li>Selector dropdown vistas; vista default do utilizador.</li>
<li>Máximo 20 vistas por user; validação schema.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado vista guardada, Quando seleccionar, Então filtros e colunas restaurados.</li>
<li>Dado renomear vista, Quando guardar, Então nome actualizado.</li>
<li>Dado eliminar vista, Quando confirmar, Então removida da lista.</li>
<li>Dado logout/login mesmo browser, Quando localStorage, Então vistas persistem.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Drill-down colunas.</li>
<li>Filtro multi-board.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- EXPORT CSV LISTA WORKSPACE VISÃO 360",
                """<p><strong>Objetivo:</strong> Exportar CSV da lista filtrada com colunas visíveis e metadados de período.</p>
<p><strong>Contexto:</strong> Gestores partilham snapshots sem captura ecrã; base para FinOps fase 4.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Botão export; BOM UTF-8; filename com workspace slug e data.</li>
<li>Respeita filtros activos; inclui period_start/end no header comment.</li>
<li>Limite 5000 linhas com aviso.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado lista filtrada 10 clientes, Quando export CSV, Então 10 linhas + header.</li>
<li>Dado colunas ocultas, Quando export, Então só colunas visíveis ou opção «todas».</li>
<li>Dado Excel, Quando abrir, Então acentuação correcta.</li>
<li>Dado guest, Quando export, Então permitido se pode ver lista.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Lista e filtros estáveis.</li>
<li>Colunas configuráveis.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- ATALHOS TECLADO E DENSIDADE DE LINHA",
                """<p><strong>Objetivo:</strong> Atalhos produtividade (busca foco, toggle grid, export) e densidade compacta/confortável na tabela.</p>
<p><strong>Contexto:</strong> Power users PMO navegam dezenas de clientes diariamente.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Atalhos: <code>/</code> busca, <code>g</code> grid, <code>l</code> lista, <code>e</code> export.</li>
<li>Toggle densidade; persistência localStorage.</li>
<li>Documentação tooltip «?» atalhos.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado tecla /, Quando lista focada, Então input busca recebe foco.</li>
<li>Dado densidade compacta, Quando toggle, Então row height reduzido mensurável.</li>
<li>Dado screen reader, Quando atalhos, Então não conflitam com inputs.</li>
<li>Dado preferência densidade, Quando refresh, Então mantida.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Lista tabela funcional.</li>
<li>Acessibilidade base WCAG.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
        ],
    ),
    (
        "- VISAO 360 — FASE 1 — HEALTH ENGINE",
        "planned",
        [
            (
                "- SCORE SAÚDE 0-100 NO BACKEND",
                """<p><strong>Objetivo:</strong> Substituir/complementar semáforo ok/warning/critical por score numérico 0–100 calculado em <code>utils/client_360.py</code>.</p>
<p><strong>Contexto:</strong> Roadmap define alvo score configurável; actual regras fixas em MVP limitam granularidade portfolio.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Função <code>compute_health_score(project_stats, weights)</code> retornando int 0–100 + label RAG.</li>
<li>Dimensões: report coverage, overdue, sustentação, opcionalmente velocity.</li>
<li>Incluir score em list e retrieve API; manter <code>health</code> legado mapeado por threshold.</li>
<li>Testes unitários extensivos em <code>tests/unit/utils/test_client_360.py</code>.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado projecto sem atrasos e report complete, Quando score, Então ≥ 85.</li>
<li>Dado report missing com módulos, Quando score, Então ≤ 40.</li>
<li>Dado API list, Quando payload, Então campo <code>health_score</code> presente.</li>
<li>Dado pesos default, Quando calcular, Então resultado determinístico e documentado.</li>
<li>Dado regressão semáforo, Quando thresholds default, Então critical ⊆ score baixo.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>ADR health model.</li>
<li>SLAs e testes contract API actual.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "urgent",
            ),
            (
                "- BREAKDOWN UI DO HEALTH SCORE",
                """<p><strong>Objetivo:</strong> Visualizar decomposição do score por dimensão no detalhe cliente e tooltip na lista.</p>
<p><strong>Contexto:</strong> Gestores precisam entender «porque 62?» além do semáforo.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Componente breakdown barras ou radar com peso % por dimensão.</li>
<li>Dados de API: <code>health_breakdown: [{dimension, score, weight, detail}]</code>.</li>
<li>Tooltip na lista ao hover badge score.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado score 62, Quando detalhe, Então breakdown soma ponderada coerente.</li>
<li>Dado dimensão overdue zero, Quando UI, Então barra máxima nessa dimensão.</li>
<li>Dado mobile, Quando breakdown, Então layout legível empilhado.</li>
<li>Dado loading, Quando skeleton, Então sem flash valores incorrectos.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Score 0-100 backend.</li>
<li>Página detalhe workspace 360.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- BOARD SETTINGS — PESOS E THRESHOLDS SAÚDE",
                """<p><strong>Objetivo:</strong> Configuração por board dos pesos das dimensões e limiares RAG (verde/amarelo/vermelho).</p>
<p><strong>Contexto:</strong> Squads diferentes ponderam sustentação vs entrega de forma distinta.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Modelo ou JSON em Board settings: weights, thresholds.</li>
<li>UI settings board admin-only; validação soma pesos = 100%.</li>
<li>Fallback global default se board não configurado.</li>
<li>API apply weights em agregação por project.board_id.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado admin altera peso overdue para 40%, Quando score recalculado, Então reflecte novo peso.</li>
<li>Dado guest, Quando settings, Então read-only ou oculto.</li>
<li>Dado pesos inválidos, Quando save, Então 400 com mensagem clara.</li>
<li>Dado board sem config, Quando score, Então usa default global.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Score backend.</li>
<li>Permissões admin board.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- API HISTÓRICO HEALTH — 8 SEMANAS",
                """<p><strong>Objetivo:</strong> Endpoint série temporal health score por projecto (8 semanas) para sparklines e tendência.</p>
<p><strong>Contexto:</strong> Comparador N vs N-1 e IA explainer dependem de histórico persistido.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Novo endpoint <code>GET …/client-360/{project_id}/health-history/</code> ou embed no retrieve.</li>
<li>Snapshot semanal job (ver card cron); tabela <code>Client360HealthSnapshot</code>.</li>
<li>Query <code>weeks=8</code> default.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 8 snapshots, Quando API, Então array ordenado por semana.</li>
<li>Dado projecto novo, Quando histórico, Então array vazio ou parcial sem erro.</li>
<li>Dado sem snapshot job, Quando on-demand backfill, Então documentado limitação.</li>
<li>Dado contract test, Quando schema, Então estável versionado.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Score 0-100.</li>
<li>Job snapshot semanal.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- SPARKLINES SAÚDE NA LISTA",
                """<p><strong>Objetivo:</strong> Mini gráfico tendência 8 semanas ao lado do score na lista workspace.</p>
<p><strong>Contexto:</strong> Scan visual rápido de deterioração/recuperação sem abrir detalhe.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Componente sparkline SVG/ canvas; dados health-history.</li>
<li>Cor tendência: subindo verde, descendo vermelho.</li>
<li>Lazy fetch batch opcional para performance lista.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado histórico 8 pontos, Quando lista, Então sparkline renderiza.</li>
<li>Dado histórico vazio, Quando lista, Então placeholder «—».</li>
<li>Dado hover sparkline, Quando tooltip, Então valores semana a semana.</li>
<li>Dado 200 linhas virtualizadas, Quando scroll, Então sparklines não degradam FPS.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>API histórico health.</li>
<li>Virtual scroll lista.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- RAG MULTIDIMENSIONAL — REGRAS POR DIMENSÃO",
                """<p><strong>Objetivo:</strong> Estado Red/Amber/Green independente por dimensão (report, delivery, support) além do score global.</p>
<p><strong>Contexto:</strong> PMO quer ver «report verde mas delivery vermelho».</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Extender <code>build_client_row</code> com <code>health_dimensions</code>.</li>
<li>Regras configuráveis alinhadas a board settings.</li>
<li>UI chips RAG por dimensão no card e detalhe.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado overdue alto report ok, Quando dimensions, Então delivery red report green.</li>
<li>Dado API list, Quando payload, Então dimensions presente.</li>
<li>Dado settings board, Quando limiares, Então RAG por dimensão recalculado.</li>
<li>Dado testes unitários, Quando fixtures, Então cobertura 3 dimensões.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Score e board settings.</li>
<li>Utils client_360.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- ALERTAS THRESHOLD SAÚDE NO COMMAND CENTER",
                """<p><strong>Objetivo:</strong> Destaque visual e contagem KPI quando scores cruzam limiares configuráveis (ex.: &lt; 50).</p>
<p><strong>Contexto:</strong> Antecipar Fase 5 IA; alertas determinísticos imediatos.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Config workspace ou board: score_alert_threshold.</li>
<li>KPI «Em alerta»; filtro rápido; badge lista.</li>
<li>Opcional: notificação in-app futura — preparar hook evento.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado threshold 50, Quando cliente score 45, Então aparece em «alerta».</li>
<li>Dado filtro alerta, Quando activo, Então subset correcto.</li>
<li>Dado score sobe para 55, Quando refresh, Então sai de alerta.</li>
<li>Dado config ausente, Quando default 40, Então aplicado.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Score backend.</li>
<li>KPI strip Fase 0.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- RECALIBRAÇÃO PESOS HEALTH SCORE",
                """<p><strong>Objetivo:</strong> Ferramenta admin simular impacto de novos pesos na carteira antes de publicar.</p>
<p><strong>Contexto:</strong> Evita surpresas ao alterar modelo saúde em 50+ clientes.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>UI preview: slider pesos + tabela before/after scores.</li>
<li>Endpoint simulação read-only ou client-side se dados lista carregados.</li>
<li>Audit log alteração pesos (prep Fase 6).</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado simulação +10% overdue, Quando preview, Então scores recalculados sem persistir.</li>
<li>Dado publicar, Quando confirm, Então settings board actualizados.</li>
<li>Dado cancelar, Quando sair, Então sem alteração.</li>
<li>Dado admin, Quando aceder, Então feature visível; member não.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Board settings pesos.</li>
<li>Score backend.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- CRON SNAPSHOT SEMANAL HEALTH",
                """<p><strong>Objetivo:</strong> Job agendado persistindo snapshot health score por projecto no fecho da semana.</p>
<p><strong>Contexto:</strong> Alimenta histórico API e sparklines de forma consistente.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Celery/cron task domingo 23:59 ou segunda 06:00 timezone workspace.</li>
<li>Bulk insert snapshots; idempotente por (project, week).</li>
<li>Monitorização falha job; alerta ops.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado job executado, Quando segunda, Então histórico inclui semana anterior.</li>
<li>Dado re-run, Quando mesma semana, Então upsert sem duplicados.</li>
<li>Dado 500 projectos, Quando job, Então completa &lt; 5 min staging.</li>
<li>Dado falha parcial, Quando retry, Então retoma projectos faltantes.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Score 0-100.</li>
<li>Modelo Client360HealthSnapshot.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- MIGRAÇÃO SEMÁFORO LEGADO → SCORE",
                """<p><strong>Objetivo:</strong> Plano e implementação convivência semáforo <code>health</code> e <code>health_score</code> sem breaking FE.</p>
<p><strong>Contexto:</strong> Consumidores board legado e assistente tool dependem de campos actuais.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Mapping documentado threshold → label legado.</li>
<li>Feature flag exibir score vs só semáforo.</li>
<li>Deprecation timeline no roadmap.</li>
<li>Actualizar tool <code>get_client_360_summary</code>.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado flag off, Quando UI board, Então só semáforo como hoje.</li>
<li>Dado flag on workspace, Quando lista, Então score + semáforo coerentes.</li>
<li>Dado assistente tool, Quando summary, Então inclui ambos campos.</li>
<li>Dado testes contract, Quando regressão, Então verde.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Score backend.</li>
<li>ADR transição.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
        ],
    ),
    (
        "- VISAO 360 — FASE 2 — COMUNICAÇÃO E RITUAIS",
        "planned",
        [
            (
                "- HEATMAP MATRIZ CLIENTE × SEMANA",
                """<p><strong>Objetivo:</strong> Grelha visual clientes (linhas) × semanas (colunas) com cor coverage status report.</p>
<p><strong>Contexto:</strong> Ritual semanal PMO depende de visão matricial histórica fora do MVP.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Nova view ou tab «Matriz» em workspace 360.</li>
<li>API agregação multi-semana ou client-side fetch N períodos.</li>
<li>Legenda complete/partial/missing/n/a; scroll horizontal semanas.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 10 clientes 8 semanas, Quando heatmap, Então 80 células correctas.</li>
<li>Dado hover célula, Quando tooltip, Então módulo breakdown se partial.</li>
<li>Dado click célula, Quando navegar, Então detalhe semana correcta.</li>
<li>Dado performance, Quando 50 clientes, Então usable com paginação vertical.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>API period parse existente.</li>
<li>Status report aggregation.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- COMPARADOR PERÍODO N VS N-1",
                """<p><strong>Objetivo:</strong> Comparar KPIs carteira e por cliente entre semana actual e anterior (delta overdue, score, report).</p>
<p><strong>Contexto:</strong> QBR e stand-ups usam «melhorou/piorou».</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Toggle comparador no header período; fetch dual period.</li>
<li>UI setas ▲▼ com cores; summary delta agregado.</li>
<li>Cache segundo request período anterior.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado overdue 5 vs 8 semana anterior, Quando comparador, Então delta -3 verde.</li>
<li>Dado report missing igual, Quando delta coverage, Então 0 neutro.</li>
<li>Dado N-1 indisponível, Quando UI, Então graceful hide comparador.</li>
<li>Dado export CSV, Quando comparador activo, Então colunas delta incluídas.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Selector período Fase 0.</li>
<li>Heatmap matriz (opcional paralelo).</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- EXPORT QBR PDF E MARKDOWN",
                """<p><strong>Objetivo:</strong> Gerar pacote QBR por cliente ou carteira em PDF e MD com KPIs, matriz resumo, wins/riscos.</p>
<p><strong>Contexto:</strong> Entrega executiva trimestral automatizada reduz horas PMO.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Template MD Jinja + conversão PDF (weasyprint ou serviço).</li>
<li>Secções: capa, score, report, overdue, sustentação, gráficos embed.</li>
<li>Download async se pesado; link expira 24h.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado cliente seleccionado, Quando export QBR, Então PDF &lt; 5MB staging.</li>
<li>Dado MD, Quando gerado, Então válido GitHub preview.</li>
<li>Dado período Q trimestre, Quando agregação, Então 13 semanas resumo.</li>
<li>Dado erro gráfico, Quando export, Então PDF parcial com aviso.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Dados detalhe 360.</li>
<li>Comparador N vs N-1.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- GUEST LINK READ-ONLY QBR",
                """<p><strong>Objetivo:</strong> Link partilhável tokenizado para visualizar QBR/snapshot 360 sem login completo.</p>
<p><strong>Contexto:</strong> Clientes externos veem resumo acordado sem licença Operoz full.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Token signed TTL; rota pública read-only branded Operoz.</li>
<li>Revogação manual; scope project ou workspace.</li>
<li>Sem PII além do acordado; audit access log.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado link válido, Quando guest abre, Então vê QBR sem auth.</li>
<li>Dado token expirado, Quando abrir, Então 410 com mensagem.</li>
<li>Dado revogação, Quando link antigo, Então 403.</li>
<li>Dado admin, Quando gera link, Então copia URL clipboard.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Export QBR.</li>
<li>Portal guest Fase 6 prep.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- AUTOMAÇÃO LEMBRETE STATUS REPORT SEXTA",
                """<p><strong>Objetivo:</strong> Automação Operoz dispara lembrete sexta-feira para leads com report missing/partial.</p>
<p><strong>Contexto:</strong> MVP doc lista integração automação como próximo passo.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Trigger cron sexta 14h timezone workspace.</li>
<li>Acção: notificação in-app + email opcional; deep link status report.</li>
<li>Config board opt-in; template i18n.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 3 clientes report missing, Quando sexta trigger, Então 3 notificações.</li>
<li>Dado report publicado antes, Quando trigger, Então excluído.</li>
<li>Dado automação desactivada board, Quando trigger, Então skip.</li>
<li>Dado log automação, Quando admin, Então histórico visível.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Board automations engine.</li>
<li>Report aggregation.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- WIDGET RESUMO BOARD — CLIENTES SEM REPORT",
                """<p><strong>Objetivo:</strong> Widget no Resumo do board: «N clientes sem report esta semana» com link Visão 360 filtrada.</p>
<p><strong>Contexto:</strong> Líder squad vê alerta no contexto board sem ir ao workspace command center.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Componente widget board home reutilizando API board client-360 summary.</li>
<li>Click → board clientes filtrado missing.</li>
<li>Refresh hourly ou on focus.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 2 missing, Quando widget, Então «2 clientes sem report».</li>
<li>Dado 0 missing, Quando widget, Então estado sucesso verde.</li>
<li>Dado click, Quando navega, Então filtro missing activo.</li>
<li>Dado board arquivado, Quando widget, Então oculto.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Board client-360 API.</li>
<li>Filtros lista board.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- EXPORT CSV MATRIZ STATUS REPORT",
                """<p><strong>Objetivo:</strong> Export CSV da matriz cliente × semana para Excel/BI.</p>
<p><strong>Contexto:</strong> Complementa heatmap visual com dados tabulares.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Export a partir dados heatmap; colunas client, board, week_start, coverage, modules_complete.</li>
<li>UTF-8 BOM; até 52 semanas × clientes.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado matriz 8 semanas, Quando export, Então CSV rectangular completo.</li>
<li>Dado filtro board, Quando export, Então subset.</li>
<li>Dado Excel PT, Quando separador, Então locale configurável vírgula.</li>
<li>Dado guest export, Então negado se policy restrita.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Heatmap matriz.</li>
<li>Export CSV lista Fase 0.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- NARRATIVA WINS E RISCOS NO DETALHE",
                """<p><strong>Objetivo:</strong> Secções editáveis wins, riscos e próximos passos no detalhe cliente persistidas por período.</p>
<p><strong>Contexto:</strong> QBR e comunicação executiva precisam narrativa humana além de KPIs.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Modelo <code>Client360Narrative</code> project+period; markdown leve.</li>
<li>UI tabs ou accordion; permissão edit project lead/admin.</li>
<li>Incluir em export QBR.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado lead edita riscos, Quando save, Então persistido e reload mostra texto.</li>
<li>Dado período muda, Quando navega, Então narrativa da semana correcta.</li>
<li>Dado guest, Quando detalhe, Então read-only narrativa publicada.</li>
<li>Dado QBR export, Quando narrativa preenchida, Então secção incluída.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Detalhe 360.</li>
<li>Export QBR.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- BRIEFING EXECUTIVO IA NA LISTA CARTEIRA",
                """<p><strong>Objetivo:</strong> Resumo IA da carteira workspace na lista (não só detalhe) via ai-assistant com contexto agregado.</p>
<p><strong>Contexto:</strong> Board v2 tem briefing no detalhe; command center beneficia overview IA.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Botão «Gerar briefing»; prompt com summary + top critical.</li>
<li>Streaming resposta; cache 1h por workspace+period.</li>
<li>Rate limit por workspace.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado carteira 20 clientes, Quando briefing, Então menciona top riscos factuais.</li>
<li>Dado cache válido, Quando segundo click, Então instantâneo.</li>
<li>Dado LLM indisponível, Quando erro, Então fallback mensagem.</li>
<li>Dado dados sensíveis, Quando prompt, Então sem vazar tokens secrets.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Assistente Operoz.</li>
<li>KPI strip e summary API.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
        ],
    ),
    (
        "- VISAO 360 — FASE 3 — OPERACIONAL PROFUNDO",
        "planned",
        [
            (
                "- INTAKE CONFIGURÁVEL POR BOARD",
                """<p><strong>Objetivo:</strong> Permitir configurar tipos/campos de intake por board para classificar trabalho entrante visível no 360.</p>
<p><strong>Contexto:</strong> Operacional profundo exige visibilidade fila entrada além de issues genéricas.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Board settings intake types; badge contagem intake aberto no detalhe.</li>
<li>API extend retrieve com bloco intake.</li>
<li>Filtro lista «com intake pendente».</li>
<li>Integração opcional webform Fase 6.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado intake configurado, Quando issue tipo intake, Então contabilizado no 360.</li>
<li>Dado 0 intake, Quando detalhe, Então secção collapsed.</li>
<li>Dado admin board, Quando settings, Então CRUD tipos.</li>
<li>Dado filtro intake, Quando lista, Então subset correcto.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Command Center UX.</li>
<li>Board settings pattern.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "urgent",
            ),
            (
                "- RAID LOG AGRUPADO NO DETALHE CLIENTE",
                """<p><strong>Objetivo:</strong> Secção RAID (Riscos, Assunções, Issues, Dependências) agregada no detalhe cliente.</p>
<p><strong>Contexto:</strong> PMO enterprise espera RAID junto ao health e report.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Modelo ou tags Issue; query agrupada por categoria R/A/I/D.</li>
<li>UI tabela editável inline links para issues.</li>
<li>Export QBR inclui RAID resumo.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 2 riscos abertos, Quando detalhe RAID, Então listados com severidade.</li>
<li>Dado criar risco, Quando save issue tagged, Então aparece no RAID.</li>
<li>Dado filtro closed, Quando default, Então só abertos.</li>
<li>Dado permissão guest, Quando RAID, Então read-only.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Detalhe 360.</li>
<li>Issue types/tags.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- PAINEL BLOQUEIOS E DEPENDÊNCIAS CRUZADAS",
                """<p><strong>Objetivo:</strong> Painel bloqueios: issues blocked, dependências externas, impedimentos com aging.</p>
<p><strong>Contexto:</strong> Delivery crítico visível no 360 reduz surpresas em steering.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Detect blocked via state/link types; aging dias.</li>
<li>Lista top 10 bloqueios detalhe; KPI bloqueios lista.</li>
<li>Link para board kanban filtrado.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado issue blocked 5 dias, Quando painel, Então aging=5.</li>
<li>Dado bloqueio resolvido, Quando refresh, Então removido.</li>
<li>Dado 0 bloqueios, Quando UI, Então empty positivo.</li>
<li>Dado KPI lista, Quando sum bloqueios, Então match detalhe.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Issue links e estados.</li>
<li>Throughput card relacionado.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- THROUGHPUT E CYCLE TIME POR CLIENTE",
                """<p><strong>Objetivo:</strong> Métricas throughput (cards done/semana) e cycle time médio por cliente.</p>
<p><strong>Contexto:</strong> Complementa health com velocidade entrega real.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Agregação issues closed no período; cycle time created→done.</li>
<li>Gráfico linha 8 semanas detalhe.</li>
<li>API campos throughput no retrieve.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 12 done semana, Quando throughput, Então 12.</li>
<li>Dado cycle time sample, Quando calcular, Então mediana exclui outliers opcional.</li>
<li>Dado período custom, Quando query, Então métricas período.</li>
<li>Dado gráfico, Quando 8 semanas, Então pontos alinhados snapshots.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Histórico temporal.</li>
<li>Utils aggregate_issue_stats extend.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- MILESTONES E ROADMAP VISUAL",
                """<p><strong>Objetivo:</strong> Timeline milestones por projecto/módulo no detalhe 360.</p>
<p><strong>Contexto:</strong> Roadmap visual alinha expectativa cliente e squad.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Usar Module milestones ou Issue type milestone.</li>
<li>UI timeline horizontal; status done/pending/overdue.</li>
<li>Filtro próximos 90 dias.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 3 milestones, Quando timeline, Então ordenados por data.</li>
<li>Dado milestone atrasado, Quando render, Então destaque vermelho.</li>
<li>Dado click, Quando issue, Então navega issue detail.</li>
<li>Dado sem milestones, Quando UI, Então CTA configurar.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Módulos project.</li>
<li>Detalhe 360 layout.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- VISTAS PERSONA — GESTÃO VS PM",
                """<p><strong>Objetivo:</strong> Vistas preset Gestão (KPIs, matriz) vs PM (operacional, bloqueios, intake).</p>
<p><strong>Contexto:</strong> Personas MVP doc diferem foco informação.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Toggle persona; reconfigura colunas, tabs detalhe, default landing.</li>
<li>Persistência user preference.</li>
<li>Gestão: score, matriz, QBR. PM: overdue, support, kanban.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado persona Gestão, Quando lista, Então colunas executivas.</li>
<li>Dado persona PM, Quando detalhe, Então tab operacional first.</li>
<li>Dado switch, Quando toggle, Então sem perder filtros base.</li>
<li>Dado novo user, Quando default, Então Gestão.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Saved views básico.</li>
<li>Drill-down colunas.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- KANBAN SAÚDE — COLUNAS POR ESTADO",
                """<p><strong>Objetivo:</strong> Mini kanban saúde no detalhe: colunas por estado health ou delivery.</p>
<p><strong>Contexto:</strong> Visual alternativo para líderes acostumados a quadros.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Colunas ok/warning/critical ou estados custom; cards cliente modules.</li>
<li>Drag não necessário fase 3 — read-only.</li>
<li>Link módulo → board view.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 2 módulos critical, Quando kanban, Então coluna critical count=2.</li>
<li>Dado click card módulo, Quando navega, Então board módulo.</li>
<li>Dado mobile, Quando kanban, Então scroll horizontal.</li>
<li>Dado dados loading, Quando skeleton, Então 3 colunas placeholder.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Health dimensions.</li>
<li>Module rows API.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- SAVED VIEWS AVANÇADO — PARTILHA WORKSPACE",
                """<p><strong>Objetivo:</strong> Saved views partilháveis a nível workspace (admin publica vistas equipa).</p>
<p><strong>Contexto:</strong> Extensão saved views básico Fase 0 para colaboração PMO.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Flag is_shared; creator admin; membros read-only adopt.</li>
<li>API WorkspaceSavedView ou extensão localStorage sync.</li>
<li>Max 50 shared workspace.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado admin publica vista, Quando member login, Então vê vista partilhada.</li>
<li>Dado member, Quando criar vista, Então privada only.</li>
<li>Dado duplicar shared, Quando acção, Então cópia privada.</li>
<li>Dado eliminar shared, Quando admin, Então removida para todos.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Saved views básico Fase 0.</li>
<li>Permissões workspace admin.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- MAPA CALOR ENTREGA POR MÓDULO",
                """<p><strong>Objetivo:</strong> Mapa calor módulos × métrica (overdue, report, intake) no detalhe cliente.</p>
<p><strong>Contexto:</strong> Identifica frentes problemáticas dentro do cliente.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Heatmap módulos linhas × métricas colunas.</li>
<li>Dados module_rows existentes extend.</li>
<li>Tooltip detalhe por célula.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 4 módulos, Quando heatmap, Então 4 linhas.</li>
<li>Dado módulo report missing, Quando célula report, Então vermelho.</li>
<li>Dado export detalhe PDF, Quando incluir, Então heatmap snapshot.</li>
<li>Dado 0 módulos, Quando n/a, Então mensagem.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>build_module_report_rows.</li>
<li>Heatmap matriz Fase 2 pattern.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- FILTRO SLA SUSTENTAÇÃO CONFIGURÁVEL",
                """<p><strong>Objetivo:</strong> Configurar SLA dias sustentação por board; filtrar destacar estouros no 360.</p>
<p><strong>Contexto:</strong> MVP usa tipo nome sustent*; SLA engine era fora MVP.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Board setting support_sla_days; cálculo aging vs SLA.</li>
<li>Badge «SLA estourado» lista e detalhe.</li>
<li>Filtro rápido SLA breach.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado SLA 3 dias e ticket 5 dias, Quando lista, Então breach true.</li>
<li>Dado config ausente, Quando default 7 dias.</li>
<li>Dado ticket fechado, Quando SLA, Então não conta.</li>
<li>Dado health critical, Quando SLA breach, Então reforço visual.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Support aggregation SUPPORT_TYPE_NAME_Q.</li>
<li>Board settings.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
        ],
    ),
    (
        "- VISAO 360 — FASE 4 — PSA E FINOPS",
        "planned",
        [
            (
                "- UTILIZAÇÃO SQUAD POR CLIENTE",
                """<p><strong>Objetivo:</strong> Exibir horas alocadas / utilizacao % squad por cliente no detalhe e lista.</p>
<p><strong>Contexto:</strong> PSA FinOps liga entrega a capacidade real consultores.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Integração timesheet Operoz ou import CSV horas.</li>
<li>Bloco utilization no retrieve; coluna opcional lista.</li>
<li>Período mensal rolling.</li>
<li>Warning over-allocation >100%.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 160h mês 200h capacidade, Quando utilização, Então 80%.</li>
<li>Dado sem dados timesheet, Quando UI, Então placeholder configurar.</li>
<li>Dado over 100%, Quando lista, Então badge alerta.</li>
<li>Dado filtro squad, Quando agregação, Então horas board.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>ADR PSA integration.</li>
<li>Detalhe 360.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "urgent",
            ),
            (
                "- INTEGRAÇÃO HARNESS COST POR PROJETO",
                """<p><strong>Objetivo:</strong> Puxar custo Harness (tokens, infra) mapeado por projecto/cliente Operoz.</p>
<p><strong>Contexto:</strong> Programa Harness Engineering regista custo; Visão 360 consolida margem.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>API interna Harness cost by project_id tag.</li>
<li>Campo cost_mtd no client row.</li>
<li>Sync diário job.</li>
<li>Doc env mapping project ↔ harness workspace.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado project tagged, Quando sync, Então cost_mtd preenchido.</li>
<li>Dado tag ausente, Quando sync, Então null graceful.</li>
<li>Dado admin, Quando detalhe FinOps tab, Então breakdown cost.</li>
<li>Dado job falha, Quando UI, Então last_sync timestamp stale.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Harness MCP/cost API.</li>
<li>Project metadata tags.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "urgent",
            ),
            (
                "- BUDGET VARIANCE CLIENTE VS PLANEADO",
                """<p><strong>Objetivo:</strong> Comparar budget planeado vs actual (horas + cost) por cliente.</p>
<p><strong>Contexto:</strong> Controllers precisam variance antes fim trimestre.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Campos budget_planned, budget_actual; variance %.</li>
<li>Gráfico bar plan vs actual detalhe.</li>
<li>Alert threshold configurable.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado planned 100k actual 120k, Quando variance, Então +20% vermelho.</li>
<li>Dado within 5%, Quando verde.</li>
<li>Dado budget zero, Quando UI, Então pedir config.</li>
<li>Dado export FinOps CSV, Então inclui variance.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Harness cost.</li>
<li>Utilização squad.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- MARGEM CLIENTE — RECEITA VS CUSTO",
                """<p><strong>Objetivo:</strong> Calcular margem bruta estimada receita contrato vs custo delivery.</p>
<p><strong>Contexto:</strong> Visão portfolio profitability estilo PSA.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Campo revenue_contract optional CRM;</li>
<li>margin_pct = (revenue - cost) / revenue.</li>
<li>Tab FinOps detalhe; agregado workspace summary opcional.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado revenue 50k cost 35k, Quando margem, Então 30%.</li>
<li>Dado revenue ausente, Quando margem, Então oculto não zero fake.</li>
<li>Dado lista, Quando coluna margem, Então sortable.</li>
<li>Dado negative margin, Quando critical FinOps flag.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Budget variance.</li>
<li>CRM sync prep Fase 6.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- CAPACIDADE FORWARD-LOOKING SQUAD",
                """<p><strong>Objetivo:</strong> Projeção capacidade squad próximas 4-8 semanas vs backlog cliente.</p>
<p><strong>Contexto:</strong> Antecipa overload antes sprint commitment.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Modelo capacity hours/week vs backlog estimate sum.</li>
<li>Gráfico stacked forward detalhe board.</li>
<li>Assumptions documentadas (velocity média).</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado backlog > capacity 4 sem, Quando projeção, Então alerta overload.</li>
<li>Dado velocity config, Quando recalcular, Então números updated.</li>
<li>Dado sem estimates, Quando fallback, Então usa histórico throughput.</li>
<li>Dado UI, Quando toggle semanas 4/8, Então gráfico ajusta.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Throughput Fase 3.</li>
<li>Utilização squad.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- HEATMAP CONSULTOR × CLIENTE",
                """<p><strong>Objetivo:</strong> Matriz alocação consultores (linhas) × clientes (colunas) com intensidade horas.</p>
<p><strong>Contexto:</strong> Resource manager visualiza conflitos alocação.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Dados timesheet; view dedicada tab Recursos workspace 360.</li>
<li>Célula horas/semana; click drill consultor.</li>
<li>Export CSV.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 5 consultores 10 clientes, Quando heatmap, Então dimensões correctas.</li>
<li>Dado célula 0h, Quando cor, Então neutra.</li>
<li>Dado >40h semana, Quando célula, Então destaque.</li>
<li>Dado filtro board, Quando subset clientes.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Utilização squad.</li>
<li>Timesheet source.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- FORECAST BACKLOG E BURN RATE",
                """<p><strong>Objetivo:</strong> Forecast conclusão backlog e burn rate semanal por cliente.</p>
<p><strong>Contexto:</strong> PMO pergunta «quando termina?» no steering.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Burn = done points/week; forecast date completion.</li>
<li>Cone incerteza simples optimistic/pessimistic.</li>
<li>Exibir detalhe cliente tab Delivery.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado burn 10/week backlog 50, Quando forecast, Então ~5 semanas.</li>
<li>Dado burn 0, Quando forecast, Então «indeterminado».</li>
<li>Dado histórico 8 sem, Quando burn calc, Então média móvel.</li>
<li>Dado QBR export, Então secção forecast.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Throughput.</li>
<li>Issue estimates.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- ALERTAS FINOPS — DESVIO ORÇAMENTO",
                """<p><strong>Objetivo:</strong> Alertas quando variance budget ou margem cruza limiares FinOps.</p>
<p><strong>Contexto:</strong> Proactivo antes fecho mês.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Rules workspace: variance >10%, margin <15%.</li>
<li>KPI strip FinOps; notificação in-app.</li>
<li>Config admin finance.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado variance 15%, Quando threshold 10%, Então alerta.</li>
<li>Dado recuperação, Quando variance 8%, Então alerta cleared.</li>
<li>Dado member, Quando config, Então denied.</li>
<li>Dado digest email mensal opcional.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Budget variance.</li>
<li>Margem cliente.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- EXPORT FINOPS CSV PARA CONTROLLER",
                """<p><strong>Objetivo:</strong> Export CSV financeiro consolidado workspace: cost, budget, margin, hours.</p>
<p><strong>Contexto:</strong> Integração controllers sem BI connector.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Botão export FinOps; colunas normalizadas.</li>
<li>Período mensal/trimestral.</li>
<li>Compatível Excel PT-BR.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado export mensal, Quando CSV, Então linha por cliente.</li>
<li>Dado filtros, Quando export, Então respeitados.</li>
<li>Dado campos vazios, Quando CSV, Então empty string.</li>
<li>Dado 1000 linhas, Quando limite, Então aviso split.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Campos FinOps populados.</li>
<li>Export CSV patterns Fase 0.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- DASHBOARD FINOPS RESUMO WORKSPACE",
                """<p><strong>Objetivo:</strong> Tab ou secção FinOps agregada: total cost, margem média, top variance.</p>
<p><strong>Contexto:</strong> Executivo vê saúde financeira carteira num ecrã.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Summary API extend ou client aggregate.</li>
<li>Cards top 5 variance negativa.</li>
<li>Drill link detalhe cliente.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 20 clientes cost data, Quando dashboard, Então totais correctos.</li>
<li>Dado clientes sem cost, Quando agregação, Então excluídos ou zero documentado.</li>
<li>Dado click top variance, Quando navega, Então detalhe FinOps.</li>
<li>Dado permissão guest, Quando FinOps, Então oculto.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Todos cards FinOps base.</li>
<li>Permissões finance role future.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
        ],
    ),
    (
        "- VISAO 360 — FASE 5 — INTELIGÊNCIA OPERoz",
        "planned",
        [
            (
                "- BRIEFING IA — CARTEIRA SEMANAL",
                """<p><strong>Objetivo:</strong> Job ou acção manual gera briefing IA executivo semanal da carteira workspace.</p>
<p><strong>Contexto:</strong> Fase 2 tem briefing lista; Fase 5 industrializa qualidade, cache e scheduling.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Prompt template versionado; facts grounding summary API.</li>
<li>Schedule segunda 8h; email slack opcional.</li>
<li>Human review flag before send.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado segunda 8h, Quando job, Então briefing gerado cache.</li>
<li>Dado facts changed, Quando regenerar, Então conteúdo updated.</li>
<li>Dado alucinação detectada checklist, Quando QA, Então blocked publish.</li>
<li>Dado rate limit LLM, Quando retry backoff.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Briefing lista Fase 2.</li>
<li>Assistente Operoz.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- QBR DRAFT IA A PARTIR DE DADOS 360",
                """<p><strong>Objetivo:</strong> Gerar draft QBR narrativo via IA usando health, matriz, RAID, FinOps.</p>
<p><strong>Contexto:</strong> Reduz horas escrita QBR trimestral.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Pipeline: fetch 360 data → prompt structured sections → MD output.</li>
<li>Editor humano before PDF export.</li>
<li>Trace sources footnotes issue ids.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado trimestre Q1, Quando draft, Então secções wins risks metrics.</li>
<li>Dado dados parciais, Quando draft, Então marca gaps explícitos.</li>
<li>Dado editor, Quando altera, Então versão humana prevalece export.</li>
<li>Dado token limit, Quando chunking, Então completa todas secções.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Export QBR Fase 2.</li>
<li>Narrativa wins/riscos.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- HEALTH EXPLAINER IA — BREAKDOWN NATURAL",
                """<p><strong>Objetivo:</strong> Explicar score saúde em linguagem natural no detalhe («Cliente X crítico porque…»).</p>
<p><strong>Contexto:</strong> Complementa breakdown visual Fase 1.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Botão «Explicar saúde»; prompt com health_breakdown facts.</li>
<li>Streaming; cite dimensions numeric.</li>
<li>No advice médico/legal — delivery only disclaimer.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado score 45 overdue high, Quando explicar, Então menciona overdue fact.</li>
<li>Dado score 90, Quando explicar, Então tom positivo fact-based.</li>
<li>Dado LLM down, Quando fallback, Então breakdown estático.</li>
<li>Dado guest, Quando explainer, Então permitido read.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Score e breakdown UI.</li>
<li>Assistente.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- AÇÕES SUGERIDAS IA NO DETALHE",
                """<p><strong>Objetivo:</strong> Lista acções sugeridas priorizadas (publicar report, revisar bloqueios) baseadas em 360 state.</p>
<p><strong>Contexto:</strong> Transforma insight em next steps acionáveis Operoz.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Rules + LLM hybrid; links deep Operoz actions.</li>
<li>Max 5 sugestões; dismiss persist.</li>
<li>Feedback thumbs up/down tuning.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado report missing, Quando sugestões, Então inclui publicar report link.</li>
<li>Dado dismiss, Quando reload, Então não reaparece mesma sessão.</li>
<li>Dado all ok, Quando sugestões, Então manutenção preventiva leve.</li>
<li>Dado feedback negativo, Quando log, Então telemetria.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Health explainer.</li>
<li>Issue/report deep links.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- RAG SNAPSHOTS PARA CONTEXTO HISTÓRICO",
                """<p><strong>Objetivo:</strong> Indexar snapshots semanais 360 no RAG assistente para perguntas históricas.</p>
<p><strong>Contexto:</strong> «Como estava cliente Y há 3 semanas?» requer RAG temporal.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Embeddings weekly snapshot summary per project.</li>
<li>Tool retrieve_client_360_history.</li>
<li>Retention policy 52 weeks.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado pergunta histórica, Quando tool, Então cita semana correcta.</li>
<li>Dado snapshot absent, Quando tool, Então informa lacuna.</li>
<li>Dado reindex job, Quando snapshot new, Então searchable <24h.</li>
<li>Dado privacy, Quando guest ask, Então denied cross-project.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Cron snapshot health.</li>
<li>Assistant RAG infra.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- PLAYBOOKS OPERACIONAIS POR CENÁRIO SAÚDE",
                """<p><strong>Objetivo:</strong> Biblioteca playbooks («report missing 2 semanas», «SLA breach») linkados no 360.</p>
<p><strong>Contexto:</strong> Codifica rituais Operoz best practice.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Markdown playbooks repo; mapping scenario → playbook id.</li>
<li>UI drawer playbook contextual.</li>
<li>Admin CRUD playbooks workspace.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado scenario report missing, Quando detalhe, Então sugere playbook SR-001.</li>
<li>Dado playbook aberto, Quando steps, Então checklist interactivo opcional.</li>
<li>Dado admin, Quando edit playbook, Então versionado.</li>
<li>Dado i18n, Quando EN workspace, Então playbook EN if available.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Alertas threshold.</li>
<li>Documentação operis.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- ASSISTENTE — TOOL GET_CLIENT_360_SUMMARY EXPANDIDA",
                """<p><strong>Objetivo:</strong> Expandir tool assistente com score, FinOps, RAID, últimas acções sugeridas.</p>
<p><strong>Contexto:</strong> Tool existente alimenta assistente; must stay sync 360 evolução.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Extend schema tool output; backward compatible fields.</li>
<li>Tests contract assistant tools.</li>
<li>Doc assistant-go-live-checklist.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado assistente pergunta carteira, Quando tool, Então JSON schema válido.</li>
<li>Dado score enabled, Quando tool, Então health_score included.</li>
<li>Dado legacy consumer, Quando health only, Então still present.</li>
<li>Dado permission, Quando project denied, Então tool error graceful.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Migração semáforo.</li>
<li>Assistant service.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- CHAT CONTEXTO 360 NO DETALHE CLIENTE",
                """<p><strong>Objetivo:</strong> Painel assistente embed no detalhe 360 pré-carregado contexto projecto.</p>
<p><strong>Contexto:</strong> UX conversacional in-context sem copiar dados.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Split pane detalhe + chat; session context project_id.</li>
<li>Suggested prompts contextual.</li>
<li>MobX store integration.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado abrir detalhe, Quando chat panel, Então context project loaded.</li>
<li>Dado pergunta health, Quando resposta, Então usa tool 360.</li>
<li>Dado mobile, Quando chat, Então fullscreen modal.</li>
<li>Dado guest, Quando chat, Então policy igual assistente workspace.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Tool expandida.</li>
<li>Detalhe 360 UI.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
        ],
    ),
    (
        "- VISAO 360 — FASE 6 — ENTERPRISE E ECOSSISTEMA",
        "planned",
        [
            (
                "- ENTIDADE CLIENT DESACOPLADA DE PROJECT",
                """<p><strong>Objetivo:</strong> Introduzir entidade Client separada com relação 1:N projects conforme ADR enterprise.</p>
<p><strong>Contexto:</strong> Modelo A MVP 1:1 limita multi-projecto mesmo cliente e CRM sync.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Migration Client model; FK optional project.client_id.</li>
<li>360 lista agrupa por client ou project conforme mode.</li>
<li>Backward compat projects sem client.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado client Acme 2 projects, Quando 360 rollup, Então linha consolidada.</li>
<li>Dado project orphan, Quando lista, Então behaves MVP.</li>
<li>Dado CRM id, Quando client, Então external_id unique.</li>
<li>Dado migration, Quando existing data, Então preserved.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>ADR enterprise model.</li>
<li>Governança.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "urgent",
            ),
            (
                "- CRM SYNC — BIDIRECIONAL CLIENTE",
                """<p><strong>Objetivo:</strong> Sincronizar Client com CRM (HubSpot/Salesforce) metadados contrato e contacts.</p>
<p><strong>Contexto:</strong> Fonte verdade comercial externa alimenta margem e QBR.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Connector config workspace; sync job hourly.</li>
<li>Field mapping revenue, segment, account owner.</li>
<li>Conflict resolution last-write-wins configurable.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado CRM update revenue, Quando sync, Então margin recalc.</li>
<li>Dado Operoz update name, Quando push enabled, Então CRM updated.</li>
<li>Dado sync fail, Quando UI, Então badge stale.</li>
<li>Dado sandbox CRM, Quando staging, Então isolated.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Entidade Client.</li>
<li>FinOps margem.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- WEBHOOKS EVENTOS VISÃO 360",
                """<p><strong>Objetivo:</strong> Emitir webhooks health_change, report_missing, sla_breach para integrações externas.</p>
<p><strong>Contexto:</strong> Ecossistema enterprise reage a eventos Operoz.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Webhook subscriptions workspace; HMAC signature.</li>
<li>Payload JSON schema versioned.</li>
<li>Retry 3x exponential.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado health critical, Quando change, Então webhook fired.</li>
<li>Dado invalid URL, Quando fail, Então retry log.</li>
<li>Dado admin, Quando CRUD subscription, Então UI settings.</li>
<li>Dado test button, Quando ping, Então 200 receiver.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Health engine.</li>
<li>Audit log.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "high",
            ),
            (
                "- BI CONNECTOR — EXPORT EMBEDDED",
                """<p><strong>Objetivo:</strong> Connector Power BI / Looker: dataset 360 refresh agendado ou SQL read replica view.</p>
<p><strong>Contexto:</strong> BI team consome sem CSV manual.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Views materialized client_360_fact; doc connection string read-only.</li>
<li>Embed iframe optional portal.</li>
<li>Row level security by workspace.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado Power BI connect, Quando refresh, Então dados match API.</li>
<li>Dado RLS, Quando user A, Então só workspace A.</li>
<li>Dado schema change, Quando version bump, Então migration doc.</li>
<li>Dado performance, Quando view, Então query <3s 10k rows.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Export CSV patterns.</li>
<li>FinOps fields.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- PORTAL GUEST MULTI-CLIENTE",
                """<p><strong>Objetivo:</strong> Portal guest vê múltiplos clientes autorizados QBR/360 read-only branded.</p>
<p><strong>Contexto:</strong> Extensão guest link single QBR para conta cliente enterprise.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Auth magic link; dashboard guest clients allowed.</li>
<li>Branding logo workspace.</li>
<li>Audit access per client.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado guest 3 clients, Quando login, Então lista 3.</li>
<li>Dado unauthorized client, Quando URL direct, Então 403.</li>
<li>Dado branding, Quando portal, Então logo workspace.</li>
<li>Dado session expire, Quando timeout, Então reauth.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Guest link QBR.</li>
<li>Entidade Client.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- MULTI-WORKSPACE ROLLUP EXECUTIVO",
                """<p><strong>Objetivo:</strong> Vista super-admin rollup métricas across workspaces (holding).</p>
<p><strong>Contexto:</strong> Grupos enterprise múltiplos workspaces Operoz.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Instance-level route; perm super admin only.</li>
<li>Aggregate health, cost, overdue cross slug.</li>
<li>Drill down workspace link.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado 3 workspaces, Quando rollup, Então KPIs soma documentada double-count rules.</li>
<li>Dado perm member, Quando rollup URL, Então 403.</li>
<li>Dado drill workspace, Quando click, Então visao-360 slug.</li>
<li>Dado cache, Quando refresh manual, Então invalida.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Workspace 360 stable.</li>
<li>FinOps aggregation.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- AUDIT LOG ALTERAÇÕES SAÚDE E REPORT",
                """<p><strong>Objetivo:</strong> Registar audit trail alterações pesos health, narrativa, settings 360.</p>
<p><strong>Contexto:</strong> Compliance enterprise exige quem alterou o quê.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>AuditLog model generic; UI admin filter entity client360.</li>
<li>Retain 365 days configurable.</li>
<li>Export audit CSV.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado admin muda peso, Quando save, Então audit entry user+timestamp.</li>
<li>Dado audit UI, Quando filter client, Então events list.</li>
<li>Dado guest change tentativa, Quando denied, Então audit failed attempt optional.</li>
<li>Dado export, Quando CSV, Então tamper-evident hash optional.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Board settings.</li>
<li>Recalibração pesos.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "medium",
            ),
            (
                "- FEATURE FLAGS POR FASE VISÃO 360",
                """<p><strong>Objetivo:</strong> Feature flags instance/workspace activar fases 0-6 incrementalmente.</p>
<p><strong>Contexto:</strong> Rollout enterprise controlado.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Flags VISAO_360_PHASE_N; check FE and BE.</li>
<li>Admin UI toggles; default off new phases.</li>
<li>Doc operis-visao-360-roadmap flags section.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado flag phase 4 off, Quando UI, Então FinOps tab hidden.</li>
<li>Dado flag on, Quando workspace, Então features visible.</li>
<li>Dado API, Quando flag off, Então 404 endpoints new phase optional.</li>
<li>Dado mixed workspaces, Quando instance, Então independent.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Todas fases implementadas parcial.</li>
<li>ADR rollout.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- SSO ENTERPRISE PORTAL GUEST",
                """<p><strong>Objetivo:</strong> SSO SAML/OIDC para portal guest enterprise em vez só magic link.</p>
<p><strong>Contexto:</strong> Clientes Fortune exigem IdP próprio.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>SAML config instance; JIT provisioning guest role.</li>
<li>Map IdP groups client access.</li>
<li>Fallback magic link.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado SSO config, Quando guest login IdP, Então dashboard authorized clients.</li>
<li>Dado group mapping, Quando IdP group X, Então client Y access.</li>
<li>Dado SSO down, Quando fallback, Então magic link if enabled.</li>
<li>Dado audit, Então SSO login events logged.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Portal guest.</li>
<li>Audit log.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
            (
                "- DATA RESIDENCY E RETENÇÃO 360",
                """<p><strong>Objetivo:</strong> Políticas de retenção de snapshots, audit e RAG por região de instance (GDPR).</p>
<p><strong>Contexto:</strong> Enterprise legal requirements.</p>
<p><strong>Escopo técnico:</strong></p>
<ul>
<li>Config retention weeks; purge job.</li>
<li>Region tag instance EU/US.</li>
<li>GDPR delete client cascades snapshots.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Dado retention 52 weeks, Quando purge job, Então snapshots older deleted.</li>
<li>Dado GDPR delete client, Quando request, Então all 360 PII purged 30 days.</li>
<li>Dado region EU, Quando data store, Então não replica US.</li>
<li>Dado doc, Quando admin, Então policy visible settings.</li>
</ul>
<p><strong>Dependências:</strong></p>
<ul>
<li>Snapshots.</li>
<li>RAG index.</li>
<li>Audit log.</li>
</ul>
<p><strong>Referências:</strong></p>
<ul>
<li><code>Operis/apps/web/core/components/workspace/client-360/workspace-client-360-list.tsx</code></li>
<li><code>Operis/apps/web/core/components/board/client-360/*</code></li>
<li><code>Operis/apps/api/operis/app/views/workspace/client_360.py</code></li>
<li><code>Operis/apps/api/operis/utils/client_360.py</code></li>
<li><code>Operis/docs/operis-cliente-360-mvp.md</code></li>
<li><code>Operis/docs/operis-visao-360-roadmap.md</code></li>
</ul>""",
                "low",
            ),
        ],
    ),
]
