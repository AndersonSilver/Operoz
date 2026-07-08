"""Seed projeto [ OPEROZ ] - DESENVOLVIMENTO DE PRODUTO com backlog da Plataforma Violenta."""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from operoz.app.permissions import ROLE
from operoz.app.serializers import IssueCreateSerializer, ProjectSerializer
from operoz.db.models import DEFAULT_STATES, Board, Module, ModuleIssue, Project, ProjectMember, State, User, Workspace
from operoz.utils.board_custom_fields import sync_board_custom_fields_to_project
from operoz.utils.board_issue_types import sync_board_issue_types_to_project
from operoz.db.management.commands.operoz_chat_scaling_catalog import CHAT_SCALING_CATALOG
from operoz.db.management.commands.operoz_prd_review_catalog import PRD_REVIEW_CATALOG
from operoz.db.management.commands.operoz_visao_360_catalog import VISAO_360_CATALOG

PROJECT_NAME = "[ OPEROZ ] - DESENVOLVIMENTO DE PRODUTO"
PROJECT_IDENTIFIER = "OPEROZDP"
ROADMAP_DOC = "docs/operoz-plataforma-violenta-roadmap.md"
NAME_PREFIX = "[ OPEROZ ]"


def prefixed_name(text: str) -> str:
    """Garante prefixo padrão em módulos e cards."""
    cleaned = text.strip()
    if cleaned.startswith(NAME_PREFIX):
        return cleaned
    return f"{NAME_PREFIX} {cleaned}"


def strip_prefix(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith(NAME_PREFIX):
        return cleaned[len(NAME_PREFIX) :].strip()
    return cleaned


# (módulo, status do módulo, lista de (título, descrição HTML, prioridade))
# prioridade: urgent | high | medium | low | none
CATALOG: list[tuple[str, str, list[tuple[str, str, str]]]] = [
    (
        "00 — Visão e Governança do Programa",
        "in-progress",
        [
            (
                "Aprovar RFC Plataforma Violenta",
                f"""<p><strong>Objetivo:</strong> Review e aprovação formal do documento mestre.</p>
<p><strong>Doc:</strong> <code>{ROADMAP_DOC}</code></p>
<p><strong>Critério de pronto:</strong> Tech lead e produto assinam escopo das Fases 0–5.</p>""",
                "high",
            ),
            (
                "Definir squad e responsáveis por pilar",
                """<p>Alocar: 1 backend (API+RAG), 1 frontend (chat UI), 0.5 DevOps (pgvector/Celery).</p>
<p>Definir DRI por fase (0, 1, 2, 3, 4, 5).</p>""",
                "high",
            ),
            (
                "Decisão estratégica: Chat primeiro vs Motor primeiro",
                """<p>Documentar decisão (recomendado: <strong>Chat Fase 0+1</strong> antes do motor Claude Code).</p>
<p>Registrar trade-offs no projeto.</p>""",
                "high",
            ),
            (
                "Spike técnico — POST /assistant/chat com 2 tools",
                """<p>Validar em 2 dias: <code>search_issues</code> + <code>get_client_360_summary</code>.</p>
<p>Entregável: demo gravada + notas de viabilidade.</p>""",
                "urgent",
            ),
            (
                "Configurar métricas de sucesso do programa",
                """<p>Definir baseline e metas: tool usage %, satisfação, latência P95, hallucination rate.</p>
<p>Ver seção 11 do roadmap.</p>""",
                "medium",
            ),
            (
                "Ritual de execução — mover cards no Operoz",
                """<p>Combinar: card só vai para Done quando critério de pronto + PR mergeado + deploy se aplicável.</p>
<p>Review semanal neste projeto.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 0 — Backend: Modelos e API Assistente",
        "planned",
        [
            (
                "0.2 — Modelo AssistantSession",
                """<p>Campos: <code>id</code>, <code>workspace_id</code>, <code>user_id</code>, <code>context</code> (JSON: board_slug, project_id), <code>title</code>, timestamps.</p>
<p>Migration + admin opcional.</p>""",
                "high",
            ),
            (
                "0.2 — Modelo AssistantMessage",
                """<p>Campos: <code>session_id</code>, <code>role</code> (user|assistant|tool), <code>content</code>, <code>tool_calls</code>, <code>citations</code>, <code>tokens_used</code>, <code>model</code>.</p>""",
                "high",
            ),
            (
                "0.3 — API POST /assistant/sessions/",
                """<p>Criar sessão com contexto opcional (board, projeto).</p>
<p>Permissão: membro do workspace.</p>""",
                "high",
            ),
            (
                "0.3 — API GET /assistant/sessions/",
                """<p>Listar sessões do usuário no workspace (paginado).</p>""",
                "medium",
            ),
            (
                "0.3 — API POST /assistant/sessions/{id}/chat/",
                """<p>Endpoint principal sem RAG; aceita mensagem do usuário; retorna resposta do LLM.</p>
<p>Integrar tool-calling loop.</p>""",
                "urgent",
            ),
            (
                "0.3 — API GET messages da sessão",
                """<p><code>GET …/sessions/{id}/messages/</code> — histórico para UI.</p>""",
                "medium",
            ),
            (
                "0.4 — Refatorar LLM client (provider abstraction)",
                """<p>Extrair de <code>app/views/external/base.py</code> para <code>operoz/assistant/llm.py</code>.</p>
<p>Suportar OpenAI + Anthropic com interface única.</p>""",
                "high",
            ),
            (
                "0.4 — Implementar tool-calling OpenAI",
                """<p>Function calling / tools API; parse de tool_calls; execução e re-injeção no contexto.</p>""",
                "high",
            ),
            (
                "0.4 — Implementar tool-calling Anthropic",
                """<p>Messages API com tools; mesmo contrato interno que OpenAI.</p>""",
                "high",
            ),
            (
                "0.6 — Permission gate nas tools (workspace)",
                """<p>Toda tool valida membership no workspace antes de consultar dados.</p>""",
                "urgent",
            ),
            (
                "0.6 — Permission gate nas tools (projeto/board)",
                """<p>Respeitar ProjectMember, BoardRole, Page.access.</p>
<p>Teste: Guest não vê dados privados.</p>""",
                "urgent",
            ),
            (
                "0.6 — Testes automatizados permission gate",
                """<p>Contract tests: user A não acessa projeto B via assistant tools.</p>""",
                "high",
            ),
        ],
    ),
    (
        "Fase 0 — Backend: Tools MVP (5 tools)",
        "planned",
        [
            (
                "Tool: search_issues",
                """<p>Wrapper da API <code>search-issues</code> / issue search.</p>
<p>Schema JSON para LLM: query, project_id, state, assignee.</p>""",
                "high",
            ),
            (
                "Tool: get_issue",
                """<p>Detalhe do card: nome, estado, assignees, descrição, comentários recentes.</p>""",
                "high",
            ),
            (
                "Tool: get_client_360_summary",
                """<p>Wrapper <code>GET …/boards/{slug}/client-360/</code> e detalhe por project_id.</p>""",
                "high",
            ),
            (
                "Tool: search_pages",
                """<p>Global search filtrado por entity=page.</p>""",
                "high",
            ),
            (
                "Tool: get_page_content",
                """<p>Retorna <code>description_stripped</code> ou HTML convertido; respeita lock/access.</p>""",
                "high",
            ),
            (
                "Tool registry interno (subset MCP)",
                """<p><code>operoz/assistant/tools/registry.py</code> — registo declarativo; reutilizar paths do mcp-server como referência.</p>""",
                "medium",
            ),
            (
                "Testes integração tools + LLM mock",
                """<p>Postman/pytest: pergunta → tool call → resposta fundamentada.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 0 — Frontend: Chat MVP",
        "planned",
        [
            (
                "0.5 — Store Zustand assistant",
                """<p><code>apps/web/core/store/assistant/</code> — sessions, messages, loading, error.</p>""",
                "high",
            ),
            (
                "0.5 — Service API assistant",
                """<p><code>packages/services/src/assistant/</code> — createSession, sendMessage, listSessions.</p>""",
                "high",
            ),
            (
                "0.5 — Componente ChatSidebar (shell)",
                """<p>Painel lateral redimensionável; abre/fecha; placeholder quando IA desligada.</p>""",
                "high",
            ),
            (
                "0.5 — UI input + enviar mensagem",
                """<p>Textarea, Enter envia, Shift+Enter nova linha; disabled durante loading.</p>""",
                "high",
            ),
            (
                "0.5 — Render resposta markdown",
                """<p>Markdown seguro; code blocks; links internos Operoz.</p>""",
                "medium",
            ),
            (
                "0.5 — Estados loading / erro / vazio",
                """<p>Skeleton, retry, mensagem quando LLM_API_KEY ausente.</p>""",
                "medium",
            ),
            (
                "0.5 — Entry point no layout workspace",
                """<p>Botão flutuante ou item na sidebar «Perguntar ao Operoz».</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 1 — Sessões e Contexto",
        "planned",
        [
            (
                "1.1 — Sessões persistentes (backend completo)",
                """<p>Persistir todas as mensagens; auto-title da sessão após 1ª troca.</p>""",
                "high",
            ),
            (
                "1.1 — UI histórico de conversas",
                """<p>Lista lateral de sessões; criar nova; renomear; excluir.</p>""",
                "high",
            ),
            (
                "1.2 — Context picker board/projeto",
                """<p>Seletor no header do chat; chip visível «Board: X» / «Projeto: Y».</p>
<p>Contexto enviado em toda mensagem.</p>""",
                "high",
            ),
            (
                "1.2 — Herdar contexto da rota atual",
                """<p>Se usuário está em /boards/{slug}/clientes, pré-selecionar board.</p>""",
                "medium",
            ),
            (
                "1.3 — Streaming SSE backend",
                """<p><code>POST …/chat/</code> com <code>Accept: text/event-stream</code>; chunks de texto + tool events.</p>""",
                "urgent",
            ),
            (
                "1.3 — Streaming SSE frontend",
                """<p>Consumir EventSource/fetch stream; render incremental.</p>""",
                "urgent",
            ),
            (
                "1.4 — Citações com links (issues)",
                """<p>Assistant retorna <code>citations[]</code>; UI renderiza link para card.</p>""",
                "high",
            ),
            (
                "1.4 — Citações com links (pages)",
                """<p>Link para página de documentação do projeto.</p>""",
                "high",
            ),
            (
                "1.4 — Citações automation runs",
                """<p>Link para histórico de execução da regra.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 1 — Tools expandidas e limites",
        "planned",
        [
            (
                "1.5 — Tool get_automation_metrics",
                """<p>Wrapper analytics de automação do board.</p>""",
                "high",
            ),
            (
                "1.5 — Tool get_automation_run",
                """<p>Detalhe de run com steps JSON.</p>""",
                "high",
            ),
            (
                "1.5 — Tool list_intake_pending",
                """<p>Inbox/intake pendentes por projeto ou board.</p>""",
                "medium",
            ),
            (
                "1.5 — Tool get_project_stats",
                """<p>Analytics / project-stats endpoint.</p>""",
                "medium",
            ),
            (
                "1.5 — Tool list_board_projects",
                """<p>Projetos do board para navegação assistida.</p>""",
                "medium",
            ),
            (
                "1.6 — Rate limit Redis (user)",
                """<p>X mensagens/hora por usuário; 429 com Retry-After.</p>""",
                "high",
            ),
            (
                "1.6 — Rate limit Redis (workspace)",
                """<p>Teto global por workspace; configurável no admin.</p>""",
                "high",
            ),
            (
                "1.7 — Admin: config modelo + limites assistant",
                """<p>Estender tela admin AI: modelo default assistant, limites, feature flag.</p>""",
                "medium",
            ),
            (
                "1.7 — Feature flag VITE_ENABLE_OPEROZ_ASSISTANT",
                """<p>Ligar/desligar chat no frontend por instância.</p>""",
                "low",
            ),
        ],
    ),
    (
        "Fase 1 — System prompt e UX avançada",
        "planned",
        [
            (
                "1.7 — System prompt base do Assistente Operoz",
                """<p>Identidade, regras (não inventar IDs), formato markdown, citar fontes.</p>""",
                "high",
            ),
            (
                "1.7 — Injeção de playbook no prompt (quando existir)",
                """<p>Preparar hook para BoardPlaybook (Fase 3).</p>""",
                "medium",
            ),
            (
                "UX — Atalho Cmd+K «Perguntar ao Operoz»",
                """<p>Command palette abre chat com foco no input.</p>""",
                "medium",
            ),
            (
                "UX — Thumbs up/down por resposta",
                """<p>Feedback para métricas de satisfação; gravar em AssistantMessage metadata.</p>""",
                "medium",
            ),
            (
                "UX — Cards clicáveis na resposta",
                """<p>Preview inline de issue (nome, estado, assignee).</p>""",
                "low",
            ),
        ],
    ),
    (
        "Fase 2 — RAG: Infraestrutura",
        "planned",
        [
            (
                "2.1 — Habilitar pgvector no Postgres",
                """<p>Extension + migration; documentar em docker-compose.</p>""",
                "high",
            ),
            (
                "2.1 — Modelo SearchEmbedding",
                """<p><code>entity_type</code>, <code>entity_id</code>, <code>chunk_index</code>, <code>content</code>, <code>embedding vector</code>, <code>workspace_id</code>, metadata JSON.</p>""",
                "high",
            ),
            (
                "2.1 — Índices HNSW / IVFFlat",
                """<p>Performance de busca vetorial por workspace.</p>""",
                "medium",
            ),
            (
                "2.2 — Serviço de embeddings",
                """<p><code>operoz/assistant/embeddings.py</code> — OpenAI text-embedding-3-small; batch.</p>""",
                "high",
            ),
            (
                "2.2 — Celery task index_entity",
                """<p>Fila <code>assistant</code>; indexar page/issue/comment/playbook.</p>""",
                "high",
            ),
            (
                "2.2 — Signal on-save pages (debounced)",
                """<p>Re-indexar ao publicar/atualizar página.</p>""",
                "medium",
            ),
            (
                "2.2 — Signal on-save issues (debounced)",
                """<p>Re-indexar nome + descrição do card.</p>""",
                "medium",
            ),
            (
                "2.2 — Command manage.py reindex_assistant",
                """<p>Backfill completo por workspace; flags --entity-type, --project-id.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 2 — RAG: Retrieval e segurança",
        "planned",
        [
            (
                "2.3 — Hybrid retrieval (FTS + vector)",
                """<p>Combinar Postgres FTS com similaridade coseno; rerank top-k.</p>""",
                "high",
            ),
            (
                "2.3 — Test set recall > 80%",
                """<p>Conjunto de perguntas sobre docs reais; medir recall@5.</p>""",
                "high",
            ),
            (
                "2.4 — Permission filter no retrieval",
                """<p>Filtrar chunks por project/board/page access ANTES do LLM.</p>
<p>Teste negativo cross-project obrigatório.</p>""",
                "urgent",
            ),
            (
                "2.4 — Marcar chunks untrusted_content",
                """<p>Mitigar prompt injection de conteúdo de páginas.</p>""",
                "high",
            ),
            (
                "2.5 — UI preview de fontes (opcional)",
                """<p>Accordion «Fonte: PRD v3» com trecho do chunk.</p>""",
                "low",
            ),
            (
                "2.6 — Documentação reindex_assistant",
                """<p>Adicionar em docs/ operação e troubleshooting.</p>""",
                "low",
            ),
            (
                "Integrar RAG no fluxo /chat/",
                """<p>Router: intent documentação → RAG; intent métricas → tools.</p>""",
                "high",
            ),
        ],
    ),
    (
        "Fase 3 — Lifecycle Hooks no Executor",
        "planned",
        [
            (
                "3.1 — Interface HookHandler + registry",
                """<p><code>operoz/automation/hooks_registry.py</code> — PreDispatch, PreAction, PostAction, OnFailure, OnComplete.</p>""",
                "high",
            ),
            (
                "3.1 — Integrar PreAction no executor.py",
                """<p>Antes de cada action; pode bloquear com mensagem.</p>""",
                "high",
            ),
            (
                "3.1 — Integrar PostAction no executor.py",
                """<p>Após action; enriquecer contexto / métricas.</p>""",
                "medium",
            ),
            (
                "3.1 — Modelo BoardAutomationHook",
                """<p>board_id, event, matcher (catalog_key), handler_type, config JSON.</p>""",
                "high",
            ),
            (
                "3.1 — API CRUD automation/hooks",
                """<p><code>GET/POST …/boards/{slug}/automation/hooks/</code></p>""",
                "medium",
            ),
            (
                "3.1 — UI aba Hooks nas settings automação",
                """<p>Listar, criar, editar hooks do board.</p>""",
                "medium",
            ),
            (
                "3.1 — Step tipo hook no histórico de execução",
                """<p>Visível no card de run: qual hook rodou, passou/bloqueou.</p>""",
                "medium",
            ),
            (
                "3.1 — Testes unitários hooks",
                """<p>PreAction bloqueia webhook; PostAction registra métrica.</p>""",
                "high",
            ),
        ],
    ),
    (
        "Fase 3 — Policy Engine",
        "planned",
        [
            (
                "3.2 — Módulo operoz/automation/policy.py",
                """<p>Políticas declarativas: webhook domains, script restrictions.</p>""",
                "high",
            ),
            (
                "3.2 — Webhook allowlist por board",
                """<p>Settings: lista de domínios permitidos; PreAction valida URL.</p>""",
                "high",
            ),
            (
                "3.2 — Script sandbox reforçado",
                """<p>Sem fs/child_process por padrão; timeout configurável; memória limitada.</p>""",
                "urgent",
            ),
            (
                "3.2 — Dry-run obrigatório 1ª publicação",
                """<p>Regra nova em board produção exige dry-run antes de enable.</p>""",
                "medium",
            ),
            (
                "3.2 — Audit log publicação de regra",
                """<p>Quem publicou, diff do grafo, timestamp.</p>""",
                "medium",
            ),
            (
                "3.2 — UI políticas do board (admin)",
                """<p>Tela settings para allowlist e flags de policy.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 3 — Board Playbooks",
        "planned",
        [
            (
                "3.3 — Modelo BoardPlaybook",
                """<p>board_id, title, markdown, version, published_at, metadata JSON.</p>""",
                "high",
            ),
            (
                "3.3 — API CRUD playbooks",
                """<p><code>…/boards/{slug}/playbooks/</code> + versionamento.</p>""",
                "high",
            ),
            (
                "3.3 — UI editor markdown playbooks",
                """<p>Settings do board; preview; publicar versão.</p>""",
                "medium",
            ),
            (
                "3.3 — Resolver lazy playbook por intent",
                """<p>Automação e assistant carregam só playbook relevante.</p>""",
                "medium",
            ),
            (
                "3.3 — Injetar playbook em build_execution_context",
                """<p>SLA sustentação, glossário, templates disponíveis no contexto.</p>""",
                "medium",
            ),
            (
                "3.3 — Indexar playbook no RAG",
                """<p>Chunks por seção do SKILL.md-style content.</p>""",
                "low",
            ),
        ],
    ),
    (
        "Fase 3 — Galeria de Templates de Automação",
        "planned",
        [
            (
                "3.4 — GET /automation/templates/",
                """<p>Catálogo global de templates oficiais com metadata e preview.</p>""",
                "high",
            ),
            (
                "3.4 — Wizard «Usar template»",
                """<p>UI: escolher template → parametrizar → dry-run → publicar.</p>""",
                "high",
            ),
            (
                "3.4 — Template: Status Report Semanal",
                """<p>Cron + e-mail; baseado na regra real existente.</p>""",
                "high",
            ),
            (
                "3.4 — Template: Escalar card parado N dias",
                """<p>Trigger schedule + filtro + e-mail/webhook.</p>""",
                "medium",
            ),
            (
                "3.4 — Template: Lembrete sustentação SLA",
                """<p>Filtro tipo sustentação + assignee + e-mail.</p>""",
                "medium",
            ),
            (
                "3.4 — Template: Boas-vindas intake",
                """<p>Trigger intake.submitted + e-mail.</p>""",
                "medium",
            ),
            (
                "3.4 — Template: Alerta cards sem assignee",
                """<p>Schedule diário + filtro + notificação.</p>""",
                "medium",
            ),
            (
                "3.4 — Repo packs/ com 5 templates JSON",
                """<p>Versionados no monorepo; CI valida schema.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 3 — Nós avançados no grafo",
        "planned",
        [
            (
                "3.5 — Nó parallel.fan_out (compiler)",
                """<p>Estender compiler.py para fork paralelo.</p>""",
                "high",
            ),
            (
                "3.5 — Nó parallel.fan_out (executor)",
                """<p>Celery group/chord ou async gather; políticas join: all|any.</p>""",
                "high",
            ),
            (
                "3.5 — UI nó Fan-out no canvas",
                """<p>Visual + config de branches paralelos.</p>""",
                "medium",
            ),
            (
                "3.7 — Nó action.retry_until",
                """<p>max_iterations, condição, backoff; inspirado Ralph Wiggum.</p>""",
                "high",
            ),
            (
                "3.7 — Histórico mostra iterações retry",
                """<p>Steps numerados por tentativa no run log.</p>""",
                "medium",
            ),
            (
                "3.5 — Testes integração fan-out",
                """<p>E-mail + webhook paralelo; latência menor que sequencial.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 3 — Escala e fila de e-mail",
        "planned",
        [
            (
                "3.6 — Fila Celery email separada",
                """<p>Nova fila + worker; SMTP async.</p>""",
                "urgent",
            ),
            (
                "3.6 — Refatorar send_automation_email para task",
                """<p>action.send_email enfileira; não bloqueia worker automation.</p>""",
                "urgent",
            ),
            (
                "3.6 — Docker automation-worker scale",
                """<p>Documentar <code>docker compose scale automation-worker=N</code>.</p>""",
                "medium",
            ),
            (
                "3.6 — Concorrência explícita -c no worker",
                """<p>AUTOMATION_WORKER_CONCURRENCY env; default sensato.</p>""",
                "medium",
            ),
            (
                "3.6 — Rate limit workspace configurável",
                """<p>Settings AUTOMATION_MAX_RUNS override por workspace.</p>""",
                "low",
            ),
            (
                "3.6 — Benchmark 300 regras mesmo minuto",
                """<p>Teste de carga; documentar resultados P95 fila.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Fase 4 — Automation Packs",
        "planned",
        [
            (
                "4.1 — JSON Schema pack.json",
                """<p>name, version, permissions, hooks, playbooks, triggers, actions.</p>""",
                "high",
            ),
            (
                "4.1 — Validador pack.json",
                """<p>manage.py validate_automation_pack + CI.</p>""",
                "medium",
            ),
            (
                "4.2 — API install/uninstall pack no board",
                """<p><code>POST …/packs/install/</code> — merge no catalog dinâmico.</p>""",
                "high",
            ),
            (
                "4.2 — Modelo automation_pack_install",
                """<p>board_id, pack_name, version, config, installed_at.</p>""",
                "high",
            ),
            (
                "4.2 — Registry dinâmico merge AutomationCatalog",
                """<p>Pack entries sobrepõem/complementam catalog estático.</p>""",
                "high",
            ),
            (
                "4.2 — Sandbox handlers de pack",
                """<p>Sem import Python arbitrário; JSON handlers ou WASM futuro.</p>""",
                "urgent",
            ),
            (
                "4.3 — Pack oficial Gestão Operacional",
                """<p>Status report + sustentação + alertas SLA.</p>""",
                "high",
            ),
            (
                "4.4 — Hooks em pack (hooks.json)",
                """<p>Pack inclui hooks; carregados no install.</p>""",
                "medium",
            ),
            (
                "4.5 — docs/packs-authoring.md",
                """<p>Guia para autores de packs internos.</p>""",
                "low",
            ),
        ],
    ),
    (
        "Fase 5 — Inteligência Avançada",
        "planned",
        [
            (
                "5.1 — Nó decision.llm",
                """<p>Classificação via LLM no grafo de automação.</p>""",
                "medium",
            ),
            (
                "5.1 — Confidence threshold (default 80)",
                """<p>Ramo humano se score &lt; threshold; padrão code-review Claude Code.</p>""",
                "medium",
            ),
            (
                "5.2 — Tool propose_automation_rule",
                """<p>Chat gera JSON do grafo; validação + dry-run.</p>""",
                "high",
            ),
            (
                "5.2 — UI confirmar automação proposta pelo chat",
                """<p>Preview do grafo; botão Publicar.</p>""",
                "medium",
            ),
            (
                "5.2 — Tool explain_automation_run",
                """<p>LLM explica steps do run em linguagem natural.</p>""",
                "medium",
            ),
            (
                "5.3 — Nó action.mcp_call",
                """<p>Integração tipada Slack/Jira piloto.</p>""",
                "medium",
            ),
            (
                "5.4 — Assistente no Cliente 360 (briefing)",
                """<p>Substituir ai-assistant pontual no detalhe do cliente.</p>""",
                "medium",
            ),
            (
                "5.5 — Subagentes internos (triage paralelo)",
                """<p>3 classificadores → merge; fan-out de análise.</p>""",
                "low",
            ),
            (
                "5.6 — Marketplace UI packs oficiais",
                """<p>Galeria browse + install; só packs verificados inicialmente.</p>""",
                "medium",
            ),
            (
                "5.x — Nó action.operoz_tool",
                """<p>Executar qualquer tool interna com permissão do user.</p>""",
                "low",
            ),
            (
                "5.x — Nó action.ask_assistant",
                """<p>Classificação LLM dentro do grafo sem nó decision dedicado.</p>""",
                "low",
            ),
        ],
    ),
    (
        "Pilar C — Integração Chat ↔ Automação",
        "planned",
        [
            (
                "Chat → criar regra por linguagem natural",
                """<p>Fluxo completo: NL → grafo → dry-run → publicar.</p>""",
                "high",
            ),
            (
                "Automação → chat explica falha",
                """<p>«Por que Status Report falhou?» lê BoardAutomationRun.steps.</p>""",
                "medium",
            ),
            (
                "Playbook compartilhado automação + chat",
                """<p>Mesmo BoardPlaybook no executor e no system prompt.</p>""",
                "medium",
            ),
            (
                "Template → instalar via conversa",
                """<p>«Instale pack Status Semanal» → wizard no chat.</p>""",
                "low",
            ),
        ],
    ),
    (
        "Arquitetura — Camada Inteligência",
        "planned",
        [
            (
                "Tool Router — classificação de intent",
                """<p>métricas → tools; documentação → RAG; ação → confirm.</p>""",
                "high",
            ),
            (
                "Agent Orchestrator (futuro)",
                """<p>Decompor pergunta complexa em sub-tarefas sequenciais.</p>""",
                "low",
            ),
            (
                "Summarization de threads longas",
                """<p>Compactar histórico antes do limite de contexto.</p>""",
                "medium",
            ),
            (
                "Cache de embeddings por hash de conteúdo",
                """<p>Evitar re-embed igual; Redis ou DB.</p>""",
                "low",
            ),
        ],
    ),
    (
        "Segurança e Compliance",
        "planned",
        [
            (
                "SEC — Vazamento cross-workspace (testes)",
                """<p>Suite de segurança assistant + RAG.</p>""",
                "urgent",
            ),
            (
                "SEC — Ações destrutivas com confirmação humana",
                """<p>Tools write: comentário, transição estado — modal Confirmar.</p>""",
                "high",
            ),
            (
                "SEC — Audit log ações via assistant",
                """<p>Quem pediu, o que executou, quando.</p>""",
                "high",
            ),
            (
                "SEC — Custo LLM e alertas",
                """<p>Dashboard tokens/dia; alerta 80% do budget.</p>""",
                "medium",
            ),
            (
                "SEC — Sanitização HTML em respostas",
                """<p>XSS prevention no markdown renderizado.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "DevOps e Infraestrutura",
        "planned",
        [
            (
                "DEVOPS — Worker assistant Celery",
                """<p>docker-compose: assistant-worker; fila assistant.</p>""",
                "high",
            ),
            (
                "DEVOPS — pgvector em docker-compose-local e prod",
                """<p>Image Postgres com extension; migration init.</p>""",
                "high",
            ),
            (
                "DEVOPS — Variáveis env documentadas",
                """<p>ASSISTANT_*, EMBEDDING_*, rate limits.</p>""",
                "medium",
            ),
            (
                "DEVOPS — Monitoramento fila automation",
                """<p>RabbitMQ queue depth alert; Grafana opcional.</p>""",
                "medium",
            ),
            (
                "DEVOPS — CI testes assistant",
                """<p>GitHub Actions: pytest assistant + contract tools.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Métricas e Qualidade",
        "planned",
        [
            (
                "QA — Meta tool usage > 60% (Fase 1)",
                """<p>Instrumentar: resposta usou tool vs só LLM.</p>""",
                "medium",
            ),
            (
                "QA — Meta satisfação > 70% thumbs up",
                """<p>Dashboard feedback assistant.</p>""",
                "medium",
            ),
            (
                "QA — Meta latência P95 < 3s primeira token",
                """<p>APM ou logs estruturados assistant.</p>""",
                "medium",
            ),
            (
                "QA — Meta hallucination < 15% amostra manual",
                """<p>Checklist review quinzenal de 20 respostas.</p>""",
                "medium",
            ),
            (
                "QA — Meta automação P95 cron+email < 2s",
                """<p>Após fila email async.</p>""",
                "medium",
            ),
            (
                "QA — Teste carga 300 automações",
                """<p>Fila &lt; 2 min; documentar.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Documentação do Produto",
        "planned",
        [
            (
                "DOC — Guia usuário Assistente Operoz",
                """<p>O que perguntar; exemplos; limitações.</p>""",
                "medium",
            ),
            (
                "DOC — Guia admin LLM + assistant",
                """<p>Config instância; rate limits; custos.</p>""",
                "medium",
            ),
            (
                "DOC — API reference assistant endpoints",
                """<p>OpenAPI / Swagger.</p>""",
                "low",
            ),
            (
                "DOC — Atualizar operoz-mcp.md com assistant tools",
                """<p>Cross-link MCP externo vs assistant interno.</p>""",
                "low",
            ),
            (
                "DOC — Architecture decision records (ADRs)",
                """<p>ADR: pgvector vs Qdrant; ADR: tool subset vs 379 tools.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "Mapeamento Claude Code → Operoz (referência)",
        "backlog",
        [
            (
                "REF — Plugin manifest → Automation Pack",
                """<p>Mapeamento conceitual implementado na Fase 4.</p>""",
                "none",
            ),
            (
                "REF — Commands → Templates one-click",
                """<p>Fase 3.4 galeria.</p>""",
                "none",
            ),
            (
                "REF — Agents → Subagentes + fan-out",
                """<p>Fase 5.5 e nó parallel.</p>""",
                "none",
            ),
            (
                "REF — Skills → Board Playbooks",
                """<p>Fase 3.3.</p>""",
                "none",
            ),
            (
                "REF — Hooks Pre/Post → Lifecycle hooks",
                """<p>Fase 3.1.</p>""",
                "none",
            ),
            (
                "REF — MCP → action.mcp_call + operoz_tool",
                """<p>Fase 5.3.</p>""",
                "none",
            ),
            (
                "REF — Ralph loop → retry_until",
                """<p>Fase 3.7.</p>""",
                "none",
            ),
            (
                "REF — security-guidance → Policy engine",
                """<p>Fase 3.2.</p>""",
                "none",
            ),
            (
                "REF — confidence scoring → decision.llm",
                """<p>Fase 5.1.</p>""",
                "none",
            ),
        ],
    ),
    *CHAT_SCALING_CATALOG,
    *VISAO_360_CATALOG,
    *PRD_REVIEW_CATALOG,
]


class Command(BaseCommand):
    help = "Seed projeto OPEROZ Plataforma Violenta — módulos e cards do roadmap"

    def _find_module(self, project: Project, module_name: str) -> Module | None:
        target = prefixed_name(module_name)
        module = Module.objects.filter(project=project, name=target).first()
        if module:
            return module
        legacy = Module.objects.filter(project=project, name=module_name).first()
        if legacy:
            legacy.name = target[:255]
            legacy.save(update_fields=["name", "updated_at"])
            return legacy
        return None

    def _sync_prefixes(self, project: Project) -> tuple[int, int]:
        from operoz.db.models import Issue

        modules_renamed = 0
        for module in Module.objects.filter(project=project):
            new_name = prefixed_name(module.name)[:255]
            if new_name != module.name:
                module.name = new_name
                module.save(update_fields=["name", "updated_at"])
                modules_renamed += 1

        issue_ids = ModuleIssue.objects.filter(project=project).values_list("issue_id", flat=True)
        cards_renamed = 0
        for issue in Issue.objects.filter(id__in=issue_ids):
            new_name = prefixed_name(issue.name)[:255]
            if new_name != issue.name:
                issue.name = new_name
                issue.save(update_fields=["name", "updated_at"])
                cards_renamed += 1

        return modules_renamed, cards_renamed

    def add_arguments(self, parser):
        parser.add_argument("--workspace", type=str, default="operoz")
        parser.add_argument("--actor-email", type=str, default="andersonsilver18@gmail.com")
        parser.add_argument("--board-slug", type=str, default="squad-as-a-service")
        parser.add_argument("--reset", action="store_true", help="Apagar projeto OPEROZDP e recriar")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args: Any, **options: Any) -> None:
        try:
            workspace = Workspace.objects.get(slug=options["workspace"])
        except Workspace.DoesNotExist as exc:
            raise CommandError(f"Workspace '{options['workspace']}' não encontrado") from exc

        try:
            actor = User.objects.get(email=options["actor_email"])
        except User.DoesNotExist as exc:
            raise CommandError(f"Utilizador '{options['actor_email']}' não encontrado") from exc

        try:
            board = Board.objects.get(slug=options["board_slug"], workspace=workspace)
        except Board.DoesNotExist as exc:
            raise CommandError(f"Board '{options['board_slug']}' não encontrado no workspace") from exc

        board_id = str(board.id)

        existing = Project.objects.filter(workspace=workspace, identifier=PROJECT_IDENTIFIER).first()
        if existing and options["reset"] and not options["dry_run"]:
            self.stdout.write(f"Removendo projeto existente {existing.id}…")
            existing.delete()
            existing = None

        if existing:
            project = existing
            self.stdout.write(self.style.WARNING(f"Projeto já existe: {project.name} ({project.id})"))
        elif options["dry_run"]:
            total_cards = sum(len(cards) for _, _, cards in CATALOG)
            self.stdout.write(
                f"[dry-run] Criaria projeto {PROJECT_NAME} com {len(CATALOG)} módulos e {total_cards} cards"
            )
            return
        else:
            data: dict[str, Any] = {
                "name": PROJECT_NAME,
                "identifier": PROJECT_IDENTIFIER,
                "description_html": (
                    f"<p><strong>Backlog executável</strong> da Plataforma Violenta — "
                    f"motor estilo Claude Code + Assistente Operoz (chat com RAG e tools).</p>"
                    f"<p>Documento mestre: <code>{ROADMAP_DOC}</code></p>"
                    f"<p>Mover cards para <em>In Progress</em> ao iniciar e <em>Done</em> ao concluir.</p>"
                ),
                "board": board_id,
            }
            ser = ProjectSerializer(data=data, context={"workspace_id": workspace.id})
            ser.is_valid(raise_exception=True)
            project = ser.save()
            ProjectMember.objects.get_or_create(
                project=project,
                member=actor,
                defaults={"role": ROLE.ADMIN.value},
            )
            State.objects.bulk_create(
                [
                    State(
                        name=s["name"],
                        color=s["color"],
                        project=project,
                        sequence=s["sequence"],
                        workspace=workspace,
                        group=s["group"],
                        default=s.get("default", False),
                        created_by=actor,
                    )
                    for s in DEFAULT_STATES
                ]
            )
            sync_board_issue_types_to_project(project, actor)
            sync_board_custom_fields_to_project(project, actor)
            self.stdout.write(self.style.SUCCESS(f"Projeto criado: {project.name}"))

        modules_renamed, cards_renamed = self._sync_prefixes(project)
        if modules_renamed or cards_renamed:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Prefixo aplicado — módulos renomeados: {modules_renamed}, cards renomeados: {cards_renamed}"
                )
            )

        backlog_state = (
            State.objects.filter(project=project, group="backlog").first()
            or State.objects.filter(project=project, name="Backlog").first()
            or State.objects.filter(project=project, default=True).first()
        )

        modules_created = 0
        cards_created = 0
        cards_skipped = 0

        with transaction.atomic():
            for module_name, module_status, cards in CATALOG:
                module_label = prefixed_name(module_name)
                module = self._find_module(project, module_name)
                if not module:
                    if options["dry_run"]:
                        continue
                    module = Module.objects.create(
                        project=project,
                        workspace=workspace,
                        name=module_label[:255],
                        description=(f"Backlog Plataforma Violenta — {strip_prefix(module_label)}. Ref: {ROADMAP_DOC}"),
                        status=module_status,
                        created_by=actor,
                    )
                    modules_created += 1
                else:
                    self.stdout.write(f"Módulo existente: {module_label}")

                for card_title, description_html, priority in cards:
                    card_label = prefixed_name(card_title)
                    existing = (
                        ModuleIssue.objects.filter(module=module, issue__project=project)
                        .filter(issue__name__in=[card_label, card_title])
                        .exists()
                    )
                    if existing:
                        cards_skipped += 1
                        continue
                    if options["dry_run"]:
                        continue
                    ser = IssueCreateSerializer(
                        data={
                            "name": card_label[:255],
                            "description_html": description_html,
                            "state_id": str(backlog_state.id) if backlog_state else None,
                            "priority": priority,
                        },
                        context={
                            "project_id": str(project.id),
                            "workspace_id": str(workspace.id),
                            "default_assignee_id": project.default_assignee_id,
                        },
                    )
                    ser.is_valid(raise_exception=True)
                    issue = ser.save()
                    ModuleIssue.objects.get_or_create(
                        module=module,
                        issue=issue,
                        project=project,
                        workspace=workspace,
                        defaults={"created_by": actor, "updated_by": actor},
                    )
                    cards_created += 1

        total_modules = Module.objects.filter(project=project).count()
        total_cards = ModuleIssue.objects.filter(project=project).count()

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Concluído\n"
                f"  Projeto: {project.name} ({project.identifier})\n"
                f"  ID: {project.id}\n"
                f"  Board: {board.name} ({board.slug})\n"
                f"  Módulos novos: {modules_created} | Total módulos: {total_modules}\n"
                f"  Cards novos: {cards_created} | Ignorados (já existiam): {cards_skipped} | Total cards: {total_cards}\n"
                f"  URL: /{options['workspace']}/projects/{project.id}/issues"
            )
        )
