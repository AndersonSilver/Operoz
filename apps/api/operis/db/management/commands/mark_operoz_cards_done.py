"""Marca cards do projeto OPEROZDP como Done (estado completed)."""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from operis.db.models import Issue, Module, Project, State, Workspace
from operis.db.management.commands.seed_operoz_plataforma_violenta import (
    PROJECT_IDENTIFIER,
    prefixed_name,
    strip_prefix,
)


def _find_module(project: Project, module_name: str) -> Module | None:
    """Resolve module by exact name or normalized prefix (unicode-safe)."""
    module = Module.objects.filter(project=project, name=module_name).first()
    if module:
        return module
    target_suffix = strip_prefix(module_name)
    for candidate in Module.objects.filter(project=project).only("id", "name", "status"):
        if strip_prefix(candidate.name) == target_suffix:
            return candidate
    return None

# Cards concluídos com testes passando (atualizar conforme execução)
COMPLETED_CARD_TITLES: list[str] = [
    # Módulo 00
    "Aprovar RFC Plataforma Violenta",
    "Definir squad e responsáveis por pilar",
    "Decisão estratégica: Chat primeiro vs Motor primeiro",
    "Spike técnico — POST /assistant/chat com 2 tools",
    "Configurar métricas de sucesso do programa",
    "Ritual de execução — mover cards no Operoz",
    # Fase 0 — Backend (exceto Anthropic tool-calling)
    "0.2 — Modelo AssistantSession",
    "0.2 — Modelo AssistantMessage",
    "0.3 — API POST /assistant/sessions/",
    "0.3 — API GET /assistant/sessions/",
    "0.3 — API POST /assistant/sessions/{id}/chat/",
    "0.3 — API GET messages da sessão",
    "0.4 — Refatorar LLM client (provider abstraction)",
    "0.4 — Implementar tool-calling OpenAI",
    "0.4 — Implementar tool-calling Anthropic",
    "0.6 — Permission gate nas tools (workspace)",
    "0.6 — Permission gate nas tools (projeto/board)",
    "0.6 — Testes automatizados permission gate",
    # Fase 0 — Tools MVP
    "Tool: search_issues",
    "Tool: get_issue",
    "Tool: get_client_360_summary",
    "Tool: search_pages",
    "Tool: get_page_content",
    "Tool registry interno (subset MCP)",
    "Testes integração tools + LLM mock",
    # Fase 0 — Frontend Chat MVP
    "0.5 — Store Zustand assistant",
    "0.5 — Service API assistant",
    "0.5 — Componente ChatSidebar (shell)",
    "0.5 — UI input + enviar mensagem",
    "0.5 — Render resposta markdown",
    "0.5 — Estados loading / erro / vazio",
    "0.5 — Entry point no layout workspace",
    # Fase 1 — Sessões e Contexto (exceto citações automation runs)
    "1.1 — Sessões persistentes (backend completo)",
    "1.1 — UI histórico de conversas",
    "1.2 — Context picker board/projeto",
    "1.2 — Herdar contexto da rota atual",
    "1.3 — Streaming SSE backend",
    "1.3 — Streaming SSE frontend",
    "1.4 — Citações com links (issues)",
    "1.4 — Citações com links (pages)",
    "1.4 — Citações automation runs",
    # Fase 1 — Tools expandidas e limites
    "1.5 — Tool get_automation_metrics",
    "1.5 — Tool get_automation_run",
    "1.5 — Tool list_intake_pending",
    "1.5 — Tool get_project_stats",
    "1.5 — Tool list_board_projects",
    "1.6 — Rate limit Redis (user)",
    "1.6 — Rate limit Redis (workspace)",
    "1.7 — Admin: config modelo + limites assistant",
    "1.7 — Feature flag VITE_ENABLE_OPEROZ_ASSISTANT",
    # Fase 1 — System prompt e UX avançada
    "1.7 — System prompt base do Assistente Operoz",
    "1.7 — Injeção de playbook no prompt (quando existir)",
    "UX — Atalho Cmd+K «Perguntar ao Operoz»",
    "UX — Thumbs up/down por resposta",
    "UX — Cards clicáveis na resposta",
    # Fase 2 — RAG: Infraestrutura
    "2.1 — Habilitar pgvector no Postgres",
    "2.1 — Modelo SearchEmbedding",
    "2.1 — Índices HNSW / IVFFlat",
    "2.2 — Serviço de embeddings",
    "2.2 — Celery task index_entity",
    "2.2 — Signal on-save pages (debounced)",
    "2.2 — Signal on-save issues (debounced)",
    "2.2 — Command manage.py reindex_assistant",
    # Fase 2 — RAG: Retrieval e segurança
    "2.3 — Hybrid retrieval (FTS + vector)",
    "2.3 — Test set recall > 80%",
    "2.4 — Permission filter no retrieval",
    "2.4 — Marcar chunks untrusted_content",
    "2.5 — UI preview de fontes (opcional)",
    "2.6 — Documentação reindex_assistant",
    "Integrar RAG no fluxo /chat/",
    # Escala do Chat — Governança, ADR e baseline
    "- ADR — ARQUITETURA DE ESCALA DO ASSISTENTE (150+ USUÁRIOS)",
    "- BASELINE DE CAPACIDADE — TESTE DE CARGA DO CHAT ATUAL",
    "- DEFINIR SLAS E METAS DE ESCALA DO ASSISTENTE",
    "- MATRIZ DE DEPENDÊNCIAS ENTRE FASES DE ESCALA",
    # Escala do Chat — Fase 1: Streaming
    "- CORRIGIR YIELD TOKEN-A-TOKEN NO BACKEND SSE",
    "- ATIVAR STREAMING NO ASSISTANTSTORE (FRONTEND)",
    "- ELIMINAR RELOAD DESNECESSÁRIO DE MENSAGENS PÓS-STREAM",
    "- CONFIGURAR PROXY PARA SSE (TIMEOUT E BUFFERING)",
    "- ABORTCONTROLLER — CANCELAR STREAM AO ENVIAR NOVA MENSAGEM",
    "- TESTES E2E — FLUXO STREAMING COMPLETO",
    # Escala do Chat — Fase 2: Infraestrutura
    "- SERVIÇO DOCKER API-CHAT DEDICADO",
    "- ENTRYPOINT E VARIÁVEIS GUNICORN PARA API-CHAT",
    "- PGBOUNCER — POOL DE CONEXÕES POSTGRES",
    "- STICKY SESSIONS NO LOAD BALANCER PARA SSE",
    "- SEPARAR LIMITES DE RECURSOS K8S/COMPOSE (CPU/RAM)",
    "- RUNBOOK DEVOPS — DEPLOY API-CHAT EM PRODUÇÃO",
    # Escala do Chat — Fase 3: Fila assíncrona
    "- FILA CELERY ASSISTANT-CHAT — MODELO DE JOB",
    "- ENDPOINT POST CHAT — ENFILEIRAR E RETORNAR JOB_ID",
    "- WORKER CELERY — EXECUTAR iter_chat_events EM BACKGROUND",
    "- ENDPOINT SSE — SUBSCRIÇÃO A EVENTOS DO JOB",
    "- ENTRYPOINT ASSISTANT-CHAT-WORKER NO DOCKER COMPOSE",
    "- IDEMPOTÊNCIA E RETRY — JOBS DE CHAT FALHADOS",
    # Escala do Chat — Fase 4: Otimização RAG, resumo e banco
    "- CACHE REDIS — EMBEDDING DE QUERY RAG",
    "- CACHE REDIS — RESULTADOS RAG POR CONTEXTO",
    "- SUMMARIZATION ASSÍNCRONA DE THREADS LONGAS",
    "- DEFERIR AUDIT LOG E MÉTRICAS NÃO CRÍTICAS",
    "- ÍNDICE GIN FTS E TUNING PGVECTOR SOB CARGA",
    # Escala do Chat — Fase 5: Concorrência e proteção LLM
    "- SEMÁFORO REDIS — LIMITE GLOBAL DE CHATS LLM PARALELOS",
    "- FAIR QUEUE — FILA POR WORKSPACE COM POSIÇÃO ESTIMADA",
    "- RATE LIMIT CONCORRENTE (NÃO SÓ POR HORA)",
    "- POOL DE API KEYS LLM — ROUND-ROBIN E CIRCUIT BREAKER",
    "- FALLBACK DE MODELO SOB CARGA (DEGRADED MODE)",
    # Escala do Chat — Fase 6: Frontend resiliente sob carga
    "- UI DE FILA E RETRY_AFTER NO ASSISTENTE",
    "- DEBOUNCE E CACHE DE LISTAGEM DE SESSÕES",
    "- INDICADOR DE LATÊNCIA E FERRAMENTAS EM EXECUÇÃO",
    "- FEATURE FLAG — MODO ASSÍNCRONO VS SÍNCRONO NO FE",
    # Escala do Chat — Fase 7: Observabilidade, carga e validação
    "- MÉTRICAS PROMETHEUS — CHAT ATIVO, FILA E SEMÁFORO LLM",
    "- ALERTAS — P95 FIRST TOKEN E TAXA DE ERRO",
    "- EXTENDER check_celery_queues PARA FILA ASSISTANT-CHAT",
    "- TESTE DE CARGA FINAL — 150 USUÁRIOS VIRTUALISADOS",
    "- DOCUMENTAÇÃO — ESCALA DO ASSISTENTE (ADMIN + DEVOPS)",
    "- CHECKLIST GO-LIVE — ESCALA 150+ USUÁRIOS",
    # Fase 3 — Lifecycle Hooks no Executor
    "3.1 — Interface HookHandler + registry",
    "3.1 — Integrar PreAction no executor.py",
    "3.1 — Integrar PostAction no executor.py",
    "3.1 — Modelo BoardAutomationHook",
    "3.1 — API CRUD automation/hooks",
    "3.1 — UI aba Hooks nas settings automação",
    "3.1 — Step tipo hook no histórico de execução",
    "3.1 — Testes unitários hooks",
    # Fase 3 — Policy Engine
    "3.2 — Módulo operis/automation/policy.py",
    "3.2 — Webhook allowlist por board",
    "3.2 — Script sandbox reforçado",
    "3.2 — Dry-run obrigatório 1ª publicação",
    "3.2 — Audit log publicação de regra",
    "3.2 — UI políticas do board (admin)",
    # Fase 3 — Board Playbooks
    "3.3 — Modelo BoardPlaybook",
    "3.3 — API CRUD playbooks",
    "3.3 — UI editor markdown playbooks",
    "3.3 — Resolver lazy playbook por intent",
    "3.3 — Injetar playbook em build_execution_context",
    "3.3 — Indexar playbook no RAG",
    # Fase 3 — Galeria de Templates de Automação
    "3.4 — GET /automation/templates/",
    "3.4 — Wizard «Usar template»",
    "3.4 — Template: Status Report Semanal",
    "3.4 — Template: Escalar card parado N dias",
    "3.4 — Template: Lembrete sustentação SLA",
    "3.4 — Template: Boas-vindas intake",
    "3.4 — Template: Alerta cards sem assignee",
    "3.4 — Repo packs/ com 5 templates JSON",
    # Fase 3 — Nós avançados no grafo
    "3.5 — Nó parallel.fan_out (compiler)",
    "3.5 — Nó parallel.fan_out (executor)",
    "3.5 — UI nó Fan-out no canvas",
    "3.7 — Nó action.retry_until",
    "3.7 — Histórico mostra iterações retry",
    "3.5 — Testes integração fan-out",
    # Fase 3 — Escala e fila de e-mail
    "3.6 — Fila Celery email separada",
    "3.6 — Refatorar send_automation_email para task",
    "3.6 — Docker automation-worker scale",
    "3.6 — Concorrência explícita -c no worker",
    "3.6 — Rate limit workspace configurável",
    "3.6 — Benchmark 300 regras mesmo minuto",
    # Fase 4 — Automation Packs
    "4.1 — JSON Schema pack.json",
    "4.1 — Validador pack.json",
    "4.2 — API install/uninstall pack no board",
    "4.2 — Modelo automation_pack_install",
    "4.2 — Registry dinâmico merge AutomationCatalog",
    "4.2 — Sandbox handlers de pack",
    "4.3 — Pack oficial Gestão Operacional",
    "4.4 — Hooks em pack (hooks.json)",
    "4.5 — docs/packs-authoring.md",
    # Fase 5 — Inteligência Avançada
    "5.1 — Nó decision.llm",
    "5.1 — Confidence threshold (default 80)",
    "5.2 — Tool propose_automation_rule",
    "5.2 — UI confirmar automação proposta pelo chat",
    "5.2 — Tool explain_automation_run",
    "5.3 — Nó action.mcp_call",
    "5.4 — Assistente no Cliente 360 (briefing)",
    "5.5 — Subagentes internos (triage paralelo)",
    "5.6 — Marketplace UI packs oficiais",
    "5.x — Nó action.operis_tool",
    "5.x — Nó action.ask_assistant",
    # Pilar C — Integração Chat ↔ Automação
    "Chat → criar regra por linguagem natural",
    "Automação → chat explica falha",
    "Playbook compartilhado automação + chat",
    "Template → instalar via conversa",
    # Arquitetura — Camada Inteligência
    "Tool Router — classificação de intent",
    "Agent Orchestrator (futuro)",
    "Summarization de threads longas",
    "Cache de embeddings por hash de conteúdo",
    # Segurança e Compliance
    "SEC — Vazamento cross-workspace (testes)",
    "SEC — Ações destrutivas com confirmação humana",
    "SEC — Audit log ações via assistant",
    "SEC — Custo LLM e alertas",
    "SEC — Sanitização HTML em respostas",
    # DevOps e Infraestrutura
    "DEVOPS — Worker assistant Celery",
    "DEVOPS — pgvector em docker-compose-local e prod",
    "DEVOPS — Variáveis env documentadas",
    "DEVOPS — Monitoramento fila automation",
    "DEVOPS — CI testes assistant",
    # Métricas e Qualidade
    "QA — Meta tool usage > 60% (Fase 1)",
    "QA — Meta satisfação > 70% thumbs up",
    "QA — Meta latência P95 < 3s primeira token",
    "QA — Meta hallucination < 15% amostra manual",
    "QA — Meta automação P95 cron+email < 2s",
    "QA — Teste carga 300 automações",
    # Documentação do Produto
    "DOC — Guia usuário Assistente Operoz",
    "DOC — Guia admin LLM + assistant",
    "DOC — API reference assistant endpoints",
    "DOC — Atualizar operis-mcp.md com assistant tools",
    "DOC — Architecture decision records (ADRs)",
    # Mapeamento Claude Code → Operoz (referência)
    "REF — Plugin manifest → Automation Pack",
    "REF — Commands → Templates one-click",
    "REF — Agents → Subagentes + fan-out",
    "REF — Skills → Board Playbooks",
    "REF — Hooks Pre/Post → Lifecycle hooks",
    "REF — MCP → action.mcp_call + operis_tool",
    "REF — Ralph loop → retry_until",
    "REF — security-guidance → Policy engine",
    "REF — confidence scoring → decision.llm",
    # Visão 360 — Fase 0 Command Center UX
    "- KPI STRIP INLINE NA LISTA WORKSPACE",
    "- GRÁFICOS INLINE CARTEIRA (DONUT E BARRAS)",
    "- PAINEL REQUER ATENÇÃO NA LISTA",
    "- VISTA GRID COMO DEFAULT EM ECRÃS LARGOS",
    "- FILTRO MULTI-BOARD NA VISÃO 360",
    "- AGRUPAMENTO POR BOARD NA LISTA",
    "- DRILL-DOWN COLUNAS CONFIGURÁVEIS",
    "- EMPTY STATES E ONBOARDING VISÃO 360",
    "- VIRTUAL SCROLL OU PAGINAÇÃO SERVER-SIDE",
    "- SAVED VIEWS BÁSICO — FILTROS E COLUNAS",
    "- EXPORT CSV LISTA WORKSPACE VISÃO 360",
    "- ATALHOS TECLADO E DENSIDADE DE LINHA",
    # Visão 360 — Fase 1 Health Engine
    "- SCORE SAÚDE 0-100 NO BACKEND",
    "- BREAKDOWN UI DO HEALTH SCORE",
    "- BOARD SETTINGS — PESOS E THRESHOLDS SAÚDE",
    "- API HISTÓRICO HEALTH — 8 SEMANAS",
    "- SPARKLINES SAÚDE NA LISTA",
    "- RAG MULTIDIMENSIONAL — REGRAS POR DIMENSÃO",
    "- CRON SNAPSHOT SEMANAL HEALTH",
    "- ALERTAS THRESHOLD SAÚDE NO COMMAND CENTER",
    "- MIGRAÇÃO SEMÁFORO LEGADO → SCORE",
    "- RECALIBRAÇÃO PESOS HEALTH SCORE",
    "- HEATMAP MATRIZ CLIENTE × SEMANA",
    "- COMPARADOR PERÍODO N VS N-1",
    "- EXPORT QBR PDF E MARKDOWN",
    "- GUEST LINK READ-ONLY QBR",
    "- AUTOMAÇÃO LEMBRETE STATUS REPORT SEXTA",
    "- WIDGET RESUMO BOARD — CLIENTES SEM REPORT",
    "- EXPORT CSV MATRIZ STATUS REPORT",
    "- NARRATIVA WINS E RISCOS NO DETALHE",
    "- BRIEFING EXECUTIVO IA NA LISTA CARTEIRA",
    # Visão 360 — Fase 3 Operacional Profundo
    "- INTAKE CONFIGURÁVEL POR BOARD",
    "- RAID LOG AGRUPADO NO DETALHE CLIENTE",
    "- PAINEL BLOQUEIOS E DEPENDÊNCIAS CRUZADAS",
    "- THROUGHPUT E CYCLE TIME POR CLIENTE",
    "- MILESTONES E ROADMAP VISUAL",
    "- VISTAS PERSONA — GESTÃO VS PM",
    "- KANBAN SAÚDE — COLUNAS POR ESTADO",
    "- SAVED VIEWS AVANÇADO — PARTILHA WORKSPACE",
    "- MAPA CALOR ENTREGA POR MÓDULO",
    "- FILTRO SLA SUSTENTAÇÃO CONFIGURÁVEL",
    # Visão 360 — Fase 4 PSA e FinOps
    "- UTILIZAÇÃO SQUAD POR CLIENTE",
    "- INTEGRAÇÃO HARNESS COST POR PROJETO",
    "- BUDGET VARIANCE CLIENTE VS PLANEADO",
    "- MARGEM CLIENTE — RECEITA VS CUSTO",
    "- CAPACIDADE FORWARD-LOOKING SQUAD",
    "- HEATMAP CONSULTOR × CLIENTE",
    "- FORECAST BACKLOG E BURN RATE",
    "- ALERTAS FINOPS — DESVIO ORÇAMENTO",
    "- EXPORT FINOPS CSV PARA CONTROLLER",
    "- DASHBOARD FINOPS RESUMO WORKSPACE",
    # Visão 360 — Fase 5 Inteligência Operoz
    "- BRIEFING IA — CARTEIRA SEMANAL",
    "- QBR DRAFT IA A PARTIR DE DADOS 360",
    "- HEALTH EXPLAINER IA — BREAKDOWN NATURAL",
    "- AÇÕES SUGERIDAS IA NO DETALHE",
    "- RAG SNAPSHOTS PARA CONTEXTO HISTÓRICO",
    "- PLAYBOOKS OPERACIONAIS POR CENÁRIO SAÚDE",
    "- ASSISTENTE — TOOL GET_CLIENT_360_SUMMARY EXPANDIDA",
    "- CHAT CONTEXTO 360 NO DETALHE CLIENTE",
    # Visão 360 — Governança
    "- ADR — ARQUITETURA VISÃO 360 OPERoz",
    "- ROADMAP DOC — VISÃO 360 E FASES G-6",
    "- MATRIZ DEPENDÊNCIAS — PROGRAMA VISÃO 360",
    "- SLAS E METAS — COMMAND CENTER CARTEIRA",
    # Visão 360 — Fase 6 Enterprise
    "- ENTIDADE CLIENT DESACOPLADA DE PROJECT",
    "- CRM SYNC — BIDIRECIONAL CLIENTE",
    "- WEBHOOKS EVENTOS VISÃO 360",
    "- BI CONNECTOR — EXPORT EMBEDDED",
    "- PORTAL GUEST MULTI-CLIENTE",
    "- MULTI-WORKSPACE ROLLUP EXECUTIVO",
    "- AUDIT LOG ALTERAÇÕES SAÚDE E REPORT",
    "- FEATURE FLAGS POR FASE VISÃO 360",
    "- SSO ENTERPRISE PORTAL GUEST",
    "- DATA RESIDENCY E RETENÇÃO 360",
    # PRD Review — Governança e Fase 0
    "- ADR — ARQUITETURA PRD REVIEW OPERoz",
    "- ROADMAP DOC — PRD REVIEW FASES 0-5",
    "- TEMPLATE PRD T4H (HTML + SEÇÕES)",
    "- MANIFESTO — operoz-prd-config",
    # PRD Review — Fase 0 (SDK verificado em contract guest)
    "- SDK JS — @operis/prd-review",
    "- SCAFFOLD — CRIAR PRD VIA MCP/HARNESS",
    # PRD Review — Fase 1 — Backend (pytest contract)
    "- MODELO — PageReviewSession",
    "- MODELO — PageReviewInvite",
    "- MODELO — PageReviewComment",
    "- MODELO — PageReviewEvent (AUDIT)",
    "- API — WORKSPACE REVIEW SESSIONS",
    "- API — GUEST PRD REVIEW",
    "- TESTES — CONTRACT PRD REVIEW API",
    # PRD Review — Fase 2 (implementação verificada; sem pytest dedicado)
    "- UI — MODAL PARTILHAR PARA REVIEW",
    "- EMAIL — CONVITE REVIEW PRD",
    "- UI — ABA REVIEW NA DOCUMENTAÇÃO",
    "- SDK — PERSISTÊNCIA API (SUBSTITUIR LOCALSTORAGE)",
    "- UI — PÁGINA GUEST /guest/prd-review/{token}",
    # PRD Review — Fase 4 — Feedback na operação
    "- UI — INBOX REVIEW PRD",
    "- SYNC — FEEDBACK → CARDS ÉPICO",
    "- DIFF — REVIEW POR PAGEVERSION",
    "- ASSISTENTE — TOOL get_prd_review_summary",
    "- AUTOMAÇÃO — feedback_submitted",
    # PRD Review — Fase 5 — Polimento
    "- RBAC — PERMISSÕES REVIEW",
    "- MÉTRICAS — REVIEW PRD",
    "- I18N — COPY REVIEW PT-BR",
    "- PDF — EXPORT REVIEW (OPCIONAL)",
    # PRD Review — Fase 3 — MCP + Harness skill
    "- MCP — operis_create_prd_review_session",
    "- MCP — operis_add_prd_review_invites",
    "- MCP — operis_get_prd_review_status",
    "- MCP — operis_list_prd_review_comments",
    "- HARNESS — SKILL SUBIR PRD CLIENTE",
]

MODULE_STATUS_WHEN_ALL_DONE: dict[str, str] = {
    prefixed_name("00 — Visão e Governança do Programa"): "completed",
    prefixed_name("Fase 0 — Backend: Modelos e API Assistente"): "completed",
    prefixed_name("Fase 0 — Backend: Tools MVP (5 tools)"): "completed",
    prefixed_name("Fase 0 — Frontend: Chat MVP"): "completed",
    prefixed_name("Fase 1 — Sessões e Contexto"): "completed",
    prefixed_name("Fase 1 — Tools expandidas e limites"): "completed",
    prefixed_name("Fase 1 — System prompt e UX avançada"): "completed",
    prefixed_name("Fase 2 — RAG: Infraestrutura"): "completed",
    prefixed_name("Fase 2 — RAG: Retrieval e segurança"): "completed",
    prefixed_name("Fase 3 — Lifecycle Hooks no Executor"): "completed",
    prefixed_name("Fase 3 — Policy Engine"): "completed",
    prefixed_name("Fase 3 — Board Playbooks"): "completed",
    prefixed_name("Fase 3 — Galeria de Templates de Automação"): "completed",
    prefixed_name("Fase 3 — Nós avançados no grafo"): "completed",
    prefixed_name("Fase 3 — Escala e fila de e-mail"): "completed",
    prefixed_name("Fase 4 — Automation Packs"): "completed",
    prefixed_name("Fase 5 — Inteligência Avançada"): "completed",
    prefixed_name("Pilar C — Integração Chat ↔ Automação"): "completed",
    prefixed_name("Arquitetura — Camada Inteligência"): "completed",
    prefixed_name("Segurança e Compliance"): "completed",
    prefixed_name("DevOps e Infraestrutura"): "completed",
    prefixed_name("Métricas e Qualidade"): "completed",
    prefixed_name("Documentação do Produto"): "completed",
    prefixed_name("Mapeamento Claude Code → Operoz (referência)"): "completed",
    # Escala do Chat — Fases 1–3 (implementadas)
    prefixed_name("- ESCALA DO CHAT — FASE 1: STREAMING E CAMINHO QUENTE"): "completed",
    prefixed_name("- ESCALA DO CHAT — FASE 2: INFRAESTRUTURA E WORKERS DEDICADOS"): "completed",
    prefixed_name("- ESCALA DO CHAT — FASE 3: FILA ASSÍNCRONA E DESACOPLAMENTO HTTP"): "completed",
    prefixed_name("- ESCALA DO CHAT — FASE 4: OTIMIZAÇÃO RAG, RESUMO E BANCO"): "completed",
    prefixed_name("- ESCALA DO CHAT — FASE 5: CONCORRÊNCIA, FAIR QUEUE E PROTEÇÃO LLM"): "completed",
    prefixed_name("- ESCALA DO CHAT — FASE 6: FRONTEND RESILIENTE SOB CARGA"): "completed",
    prefixed_name("- ESCALA DO CHAT — FASE 7: OBSERVABILIDADE, CARGA E VALIDAÇÃO FINAL"): "completed",
    prefixed_name("- ESCALA DO CHAT — GOVERNANÇA, ADR E BASELINE"): "completed",
    prefixed_name("- VISAO 360 — FASE 2 — COMUNICAÇÃO E RITUAIS"): "completed",
    prefixed_name("- VISAO 360 — FASE 3 — OPERACIONAL PROFUNDO"): "completed",
    prefixed_name("- VISAO 360 — FASE 4 — PSA E FINOPS"): "completed",
    prefixed_name("- VISAO 360 — FASE 5 — INTELIGÊNCIA OPERoz"): "completed",
    prefixed_name("- VISAO 360 — GOVERNANÇA E ROADMAP"): "completed",
    prefixed_name("- VISAO 360 — FASE 0 — COMMAND CENTER UX"): "completed",
    prefixed_name("- VISAO 360 — FASE 1 — HEALTH ENGINE"): "completed",
    prefixed_name("- VISAO 360 — FASE 6 — ENTERPRISE E ECOSSISTEMA"): "completed",
    prefixed_name("- PRD REVIEW — FASE 1 — BACKEND REVIEW"): "completed",
    prefixed_name("- PRD REVIEW — FASE 2 — ACESSO EMAIL E UI GUEST"): "completed",
    prefixed_name("- PRD REVIEW — FASE 3 — INTEGRAÇÃO MCP"): "completed",
    prefixed_name("- PRD REVIEW — GOVERNANÇA E ROADMAP"): "completed",
    prefixed_name("- PRD REVIEW — FASE 0 — PADRONIZAR ARTEFATO"): "completed",
    prefixed_name("- PRD REVIEW — FASE 4 — FEEDBACK NA OPERAÇÃO"): "completed",
    prefixed_name("- PRD REVIEW — FASE 5 — POLIMENTO E GOVERNANÇA"): "completed",
}


class Command(BaseCommand):
    help = "Marca cards OPEROZ como Done no projeto OPEROZDP"

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, default="operoz")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args: Any, **options: Any) -> None:
        try:
            workspace = Workspace.objects.get(slug=options["workspace"])
        except Workspace.DoesNotExist as exc:
            raise CommandError(f"Workspace '{options['workspace']}' não encontrado") from exc

        project = Project.objects.filter(workspace=workspace, identifier=PROJECT_IDENTIFIER).first()
        if not project:
            raise CommandError(f"Projeto {PROJECT_IDENTIFIER} não encontrado")

        done_state = State.objects.filter(project=project, group="completed").first()
        if not done_state:
            done_state = State.objects.filter(project=project, name="Done").first()
        if not done_state:
            raise CommandError("Estado Done/completed não encontrado no projeto")

        updated = 0
        not_found: list[str] = []
        already_done = 0

        for title in COMPLETED_CARD_TITLES:
            full_name = prefixed_name(title)
            issue = Issue.objects.filter(project=project, name=full_name).first()
            if not issue:
                not_found.append(full_name)
                continue
            if issue.state_id == done_state.id:
                already_done += 1
                continue
            if options["dry_run"]:
                self.stdout.write(f"[dry-run] Done: {full_name}")
                updated += 1
                continue
            issue.state = done_state
            issue.completed_at = timezone.now()
            issue.save(update_fields=["state", "completed_at", "updated_at"])
            updated += 1
            self.stdout.write(self.style.SUCCESS(f"Done: {full_name}"))

        if not options["dry_run"]:
            for module_name, status in MODULE_STATUS_WHEN_ALL_DONE.items():
                module = _find_module(project, module_name)
                if module and module.status != status:
                    module.status = status
                    module.save(update_fields=["status", "updated_at"])
                    self.stdout.write(self.style.NOTICE(f"Módulo {module.name} → {status}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nResumo: {updated} atualizados, {already_done} já estavam Done, "
                f"{len(not_found)} não encontrados"
            )
        )
        if not_found:
            for name in not_found:
                self.stdout.write(self.style.WARNING(f"  Não encontrado: {name}"))
