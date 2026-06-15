"""Catálogo de módulos e cards — Escala do Chat Assistente Operoz (150+ usuários)."""

from __future__ import annotations

# (módulo, status, [(título, descrição HTML, prioridade)])
# Títulos e módulos usam sufixo após "[ OPEROZ ] - " em MAIÚSCULAS (prefixo aplicado pelo seed).

CHAT_SCALING_CATALOG: list[tuple[str, str, list[tuple[str, str, str]]]] = [
    (
        "- ESCALA DO CHAT — GOVERNANÇA, ADR E BASELINE",
        "planned",
        [
            (
                "- ADR — ARQUITETURA DE ESCALA DO ASSISTENTE (150+ USUÁRIOS)",
                """<p><strong>Objetivo:</strong> Formalizar decisões arquiteturais para suportar 150+ utilizadores
concorrentes no assistente Operoz com previsibilidade operacional e custo controlado.</p>
<p><strong>Contexto:</strong> Hoje cada mensagem de chat bloqueia um worker Gunicorn durante todo o ciclo
LLM + RAG + tools (5–90s). Com <code>GUNICORN_WORKERS=1–2</code>, a capacidade simultânea real é de
2–10 conversas, não 150.</p>
<p><strong>Escopo do ADR:</strong></p>
<ul>
<li>Worker HTTP bloqueante vs fila assíncrona (Celery/Redis Streams)</li>
<li>Serviço <code>api-chat</code> dedicado vs monólito API único</li>
<li>Semáforo global de chamadas LLM e fair queue por workspace</li>
<li>Streaming SSE token-a-token vs buffer actual</li>
<li>PgBouncer e read replica para queries RAG</li>
<li>Réplicas horizontais com sticky sessions</li>
</ul>
<p><strong>Referências técnicas:</strong>
<code>operis/assistant/service.py</code>,
<code>operis/app/views/assistant/sessions.py</code>,
<code>apps/web/core/store/assistant/assistant.store.ts</code>,
<code>bin/docker-entrypoint-api.sh</code>.</p>
<p><strong>Critério de pronto:</strong> ADR revisado e aprovado por tech lead; alternativas rejeitadas
documentadas (scale-up vertical only, WebSocket-only, chat 100% síncrono).</p>""",
                "urgent",
            ),
            (
                "- BASELINE DE CAPACIDADE — TESTE DE CARGA DO CHAT ATUAL",
                """<p><strong>Objetivo:</strong> Estabelecer linha de base mensurável antes de qualquer optimização,
para comparar impacto das fases seguintes.</p>
<p><strong>Metodologia:</strong></p>
<ul>
<li>Ferramenta: k6 ou Locust contra <code>POST /api/workspaces/{slug}/assistant/sessions/{id}/chat/</code></li>
<li>Cenários: 10, 30, 50, 100 e 150 utilizadores virtuais (ramp 5 min, sustain 10 min)</li>
<li>Mix: 80% mensagens simples, 20% com activação de tools</li>
</ul>
<p><strong>Métricas a capturar:</strong> taxa de sucesso, p50/p95/p99 latência total, p95 first token,
timeouts Gunicorn, conexões Postgres activas, utilização CPU/RAM API, erros 429/503 do provider LLM.</p>
<p><strong>Entregável:</strong> relatório HTML/PDF anexado ao card + gráficos comparativos.</p>
<p><strong>Critério de pronto:</strong> baseline reproduzível documentada; script de carga versionado em
<code>Operis/apps/api/operis/tests/load/</code> ou repositório de QA.</p>""",
                "urgent",
            ),
            (
                "- DEFINIR SLAS E METAS DE ESCALA DO ASSISTENTE",
                """<p><strong>Objetivo:</strong> Definir metas quantitativas acordadas com produto e operações,
alinhadas às métricas já instrumentadas (<code>first_token_ms</code>, quality dashboard).</p>
<p><strong>SLAs propostos (ajustáveis no ADR):</strong></p>
<ul>
<li>p95 first token &lt; 3 segundos</li>
<li>p95 resposta completa &lt; 45 segundos (mensagem sem tools complexas)</li>
<li>Taxa de erro HTTP &lt; 2% sob carga nominal</li>
<li>Máximo 40 chamadas LLM paralelas globais (configurável)</li>
<li>Tempo máximo em fila aceitável: 60 segundos (com feedback na UI)</li>
</ul>
<p><strong>Critério de pronto:</strong> tabela de SLAs publicada no card; thresholds mapeados para alertas
(Fase 7); referência cruzada com card de teste de carga final.</p>""",
                "high",
            ),
            (
                "- MATRIZ DE DEPENDÊNCIAS ENTRE FASES DE ESCALA",
                """<p><strong>Objetivo:</strong> Visualizar caminho crítico e trabalho paralelizável entre os 7 módulos
de implementação de escala.</p>
<p><strong>Entregável:</strong> diagrama Mermaid no card descrevendo dependências:
Governança → Streaming → Infra → Fila async → (RAG + Limites em paralelo) → Frontend → Observabilidade.</p>
<p><strong>Caminho crítico identificado:</strong> baseline → fix SSE → api-chat → PgBouncer → fila Celery →
semáforo LLM → teste 150 VUs.</p>
<p><strong>Critério de pronto:</strong> ordem de execução acordada com squad; cards bloqueados marcados com
dependência explícita na descrição.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "- ESCALA DO CHAT — FASE 1: STREAMING E CAMINHO QUENTE",
        "planned",
        [
            (
                "- CORRIGIR YIELD TOKEN-A-TOKEN NO BACKEND SSE",
                """<p><strong>Objetivo:</strong> Emitir tokens SSE em tempo real, eliminando bufferização que atrasa
a percepção de resposta e mantém conexões abertas sem dados.</p>
<p><strong>Problema actual:</strong> Em <code>iter_chat_events</code> (<code>service.py</code>), eventos
<code>token</code> acumulam-se em <code>token_events</code> e só são emitidos após conclusão da rodada LLM
quando <code>stream=True</code>.</p>
<p><strong>Implementação:</strong></p>
<ul>
<li><code>yield</code> imediato de cada <code>{ type: token, content }</code> durante
<code>stream_chat_completion</code></li>
<li>Manter persistência final de <code>AssistantMessage</code> inalterada</li>
<li>Garantir evento <code>done</code> com payload completo ao final</li>
</ul>
<p><strong>Testes:</strong> unitários do generator SSE; contract test com stream mock; validação manual com
<code>curl -N -H 'Accept: text/event-stream'</code>.</p>
<p><strong>Critério de pronto:</strong> primeiro evento <code>token</code> recebido em &lt; 2s em staging com
LLM configurado.</p>""",
                "urgent",
            ),
            (
                "- ATIVAR STREAMING NO ASSISTANTSTORE (FRONTEND)",
                """<p><strong>Objetivo:</strong> Utilizar <code>sendMessageStream</code> em vez de
<code>sendMessage</code> síncrono, melhorando UX e reduzindo timeouts percebidos.</p>
<p><strong>Ficheiros:</strong> <code>apps/web/core/store/assistant/assistant.store.ts</code>,
<code>apps/web/core/services/assistant.service.ts</code>, componentes do painel assistente.</p>
<p><strong>Implementação:</strong></p>
<ul>
<li>Consumir eventos <code>token</code>, <code>tool_start</code>, <code>tool_end</code>,
<code>done</code>, <code>error</code></li>
<li>Actualizar <code>streamingContent</code> incrementalmente via MobX</li>
<li>Desactivar envio durante <code>isStreaming</code></li>
<li>Tratar <code>retry_after</code> em erros 429</li>
</ul>
<p><strong>Critério de pronto:</strong> resposta visível token a token; sem regressão em confirmação de acções
(proposals).</p>""",
                "urgent",
            ),
            (
                "- ELIMINAR RELOAD DESNECESSÁRIO DE MENSAGENS PÓS-STREAM",
                """<p><strong>Objetivo:</strong> Reduzir carga no API eliminando
<code>loadMessagesForSession({ force: true })</code> após cada envio bem-sucedido quando SSE já entrega
mensagem final.</p>
<p><strong>Implementação:</strong> merge do payload <code>done.message</code> no estado local;
reload apenas em reconexão, retry ou detecção de inconsistência.</p>
<p><strong>Critério de pronto:</strong> 1 request GET messages a menos por interacção; histórico correcto após
refresh de página.</p>""",
                "high",
            ),
            (
                "- CONFIGURAR PROXY PARA SSE (TIMEOUT E BUFFERING)",
                """<p><strong>Objetivo:</strong> Garantir que o proxy (Caddy/nginx/Front Door) não trunca streams
SSE longos.</p>
<p><strong>Configurações:</strong></p>
<ul>
<li><code>proxy_read_timeout</code> ≥ 120s</li>
<li><code>proxy_buffering off</code></li>
<li>Propagação de <code>X-Accel-Buffering: no</code> (já definido em <code>sessions.py</code>)</li>
</ul>
<p><strong>Documentação:</strong> actualizar <code>docs/assistant-env.md</code> e
<code>docs/arquitetura-devops-azure.md</code>.</p>
<p><strong>Critério de pronto:</strong> stream completo com resposta &gt; 60s; checklist DevOps assinado.</p>""",
                "high",
            ),
            (
                "- ABORTCONTROLLER — CANCELAR STREAM AO ENVIAR NOVA MENSAGEM",
                """<p><strong>Objetivo:</strong> Evitar race conditions e streams órfãos quando o utilizador envia
nova mensagem ou fecha o painel durante geração.</p>
<p><strong>Implementação:</strong> <code>AbortController</code> no fetch SSE; cleanup no
<code>finally</code> do store; reset de <code>streamingContent</code>.</p>
<p><strong>Critério de pronto:</strong> stream anterior abortado; sem mensagens duplicadas ou estado
inconsistente no MobX store.</p>""",
                "medium",
            ),
            (
                "- TESTES E2E — FLUXO STREAMING COMPLETO",
                """<p><strong>Objetivo:</strong> Garantir regressão zero no path SSE principal via CI.</p>
<p><strong>Cobertura:</strong> criar sessão → POST chat com <code>Accept: text/event-stream</code> → validar
sequência mínima <code>token*</code> + <code>done</code> → mensagem persistida em
<code>assistant_messages</code>.</p>
<p><strong>Critério de pronto:</strong> testes contract/E2E verdes em
<code>operis/tests/contract/app/test_assistant_app.py</code> ou equivalente.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "- ESCALA DO CHAT — FASE 2: INFRAESTRUTURA E WORKERS DEDICADOS",
        "planned",
        [
            (
                "- SERVIÇO DOCKER API-CHAT DEDICADO",
                """<p><strong>Objetivo:</strong> Isolar carga de chat long-running da API CRUD para manter
responsividade geral da plataforma sob pico de 150 utilizadores.</p>
<p><strong>Implementação:</strong></p>
<ul>
<li>Novo serviço <code>api-chat</code> em <code>docker-compose.yml</code> e
<code>docker-compose-local.yml</code></li>
<li>Mesmo Dockerfile API; entrypoint dedicado</li>
<li>Proxy: rotear <code>POST …/assistant/…/chat/</code> e streams associados → <code>api-chat:8000</code></li>
<li>Restante <code>/api/*</code> → <code>api:8000</code></li>
</ul>
<p><strong>Critério de pronto:</strong> sob carga de chat, endpoints CRUD (issues, boards) mantêm p95 &lt; 500ms.</p>""",
                "urgent",
            ),
            (
                "- ENTRYPOINT E VARIÁVEIS GUNICORN PARA API-CHAT",
                """<p><strong>Objetivo:</strong> Configurar workers Gunicorn optimizados para requests longos SSE.</p>
<p><strong>Entregável:</strong> <code>bin/docker-entrypoint-api-chat.sh</code> com:</p>
<ul>
<li><code>GUNICORN_WORKERS</code> (default 16, configurável)</li>
<li><code>--timeout</code> elevado para SSE</li>
<li><code>--max-requests</code> + jitter para recycle de workers</li>
</ul>
<p><strong>Documentação:</strong> <code>.env.example</code>, <code>docs/assistant-env.md</code>.</p>
<p><strong>Critério de pronto:</strong> deploy local funcional; variáveis documentadas.</p>""",
                "high",
            ),
            (
                "- PGBOUNCER — POOL DE CONEXÕES POSTGRES",
                """<p><strong>Objetivo:</strong> Evitar esgotamento de conexões Postgres com dezenas de workers
Gunicorn simultâneos.</p>
<p><strong>Implementação:</strong></p>
<ul>
<li>Serviço PgBouncer no Compose/K8s (transaction pooling)</li>
<li>Django <code>DATABASES['default']['HOST']</code> → PgBouncer</li>
<li>Ajustar <code>CONN_MAX_AGE</code> e <code>OPTIONS</code> por serviço</li>
</ul>
<p><strong>Critério de pronto:</strong> teste de carga com 32+ workers sem erro
<code>FATAL: too many connections</code>.</p>""",
                "urgent",
            ),
            (
                "- STICKY SESSIONS NO LOAD BALANCER PARA SSE",
                """<p><strong>Objetivo:</strong> Garantir afinidade de sessão quando múltiplas réplicas
<code>api-chat</code> estão activas.</p>
<p><strong>Implementação:</strong> cookie-based ou IP hash no Caddy/ingress; documentar limitações em
ambiente mobile/NAT.</p>
<p><strong>Critério de pronto:</strong> stream SSE completo sem cortes com 2 réplicas api-chat em teste.</p>""",
                "high",
            ),
            (
                "- SEPARAR LIMITES DE RECURSOS K8S/COMPOSE (CPU/RAM)",
                """<p><strong>Objetivo:</strong> Evitar OOMKill e starvation entre <code>api</code> e
<code>api-chat</code>.</p>
<p><strong>Directrizes:</strong></p>
<ul>
<li><code>api</code>: bursts curtos, CPU limit moderado</li>
<li><code>api-chat</code>: RAM estável, conexões longas, CPU sustained</li>
</ul>
<p><strong>Critério de pronto:</strong> manifests/compose com requests/limits documentados; sem OOM em pico simulado.</p>""",
                "medium",
            ),
            (
                "- RUNBOOK DEVOPS — DEPLOY API-CHAT EM PRODUÇÃO",
                """<p><strong>Objetivo:</strong> Procedimento operacional para deploy seguro do serviço dedicado.</p>
<p><strong>Conteúdo do runbook:</strong> ordem de deploy, rollback, smoke tests (instances + chat SSE),
variáveis obrigatórias, verificação PgBouncer, validação de rotas proxy.</p>
<p><strong>Critério de pronto:</strong> runbook em <code>docs/arquitetura-devops-azure.md</code> ou
<code>docs/assistant-scaling.md</code>; revisado por DevOps.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "- ESCALA DO CHAT — FASE 3: FILA ASSÍNCRONA E DESACOPLAMENTO HTTP",
        "planned",
        [
            (
                "- FILA CELERY ASSISTANT-CHAT — MODELO DE JOB",
                """<p><strong>Objetivo:</strong> Introduzir fila dedicada para execução de chat fora do worker HTTP.</p>
<p><strong>Implementação:</strong></p>
<ul>
<li>Fila Celery <code>assistant-chat</code> (settings + route)</li>
<li>Modelo ou estrutura Redis: <code>AssistantChatJob</code> com estados
<code>queued|running|completed|failed</code></li>
<li>Payload: <code>session_id</code>, <code>message</code>, <code>user_id</code>,
<code>workspace_id</code>, <code>client_message_id</code> (idempotência)</li>
</ul>
<p><strong>Critério de pronto:</strong> migration/model + task skeleton + testes unitários de transição de estado.</p>""",
                "urgent",
            ),
            (
                "- ENDPOINT POST CHAT — ENFILEIRAR E RETORNAR JOB_ID",
                """<p><strong>Objetivo:</strong> Desacoplar aceitação HTTP da execução LLM.</p>
<p><strong>Comportamento:</strong></p>
<ul>
<li>Validar rate limit e permissões (existente)</li>
<li>Enfileirar job → <code>202 Accepted</code> com <code>{ job_id, status: "queued" }</code></li>
<li>Modo legado síncrono via <code>?sync=1</code> ou header para rollback gradual</li>
</ul>
<p><strong>Critério de pronto:</strong> contract tests; documentação OpenAPI actualizada.</p>""",
                "urgent",
            ),
            (
                "- WORKER CELERY — EXECUTAR iter_chat_events EM BACKGROUND",
                """<p><strong>Objetivo:</strong> Executar pipeline actual de chat no worker Celery.</p>
<p><strong>Implementação:</strong> task <code>run_assistant_chat_job</code> invoca lógica de
<code>iter_chat_events</code>; publica eventos em Redis Stream
<code>assistant:chat:{job_id}:events</code>.</p>
<p><strong>Critério de pronto:</strong> job completa; mensagens persistidas identicamente ao fluxo síncrono;
audit trail intacto.</p>""",
                "urgent",
            ),
            (
                "- ENDPOINT SSE — SUBSCRIÇÃO A EVENTOS DO JOB",
                """<p><strong>Objetivo:</strong> Cliente consome progresso do job via SSE.</p>
<p><strong>Endpoint:</strong> <code>GET …/assistant/chat/jobs/{job_id}/stream/</code> — lê Redis Stream até
evento <code>done</code> ou <code>error</code>; reutiliza formatos JSON existentes.</p>
<p><strong>Critério de pronto:</strong> FE integrado; mesma UX de streaming token-a-token.</p>""",
                "high",
            ),
            (
                "- ENTRYPOINT ASSISTANT-CHAT-WORKER NO DOCKER COMPOSE",
                """<p><strong>Objetivo:</strong> Processo worker dedicado para fila de chat.</p>
<p><strong>Entregável:</strong> serviço <code>assistant-chat-worker</code>,
<code>docker-entrypoint-assistant-chat-worker.sh</code>,
env <code>ASSISTANT_CHAT_WORKER_CONCURRENCY</code> (default 8).</p>
<p><strong>Critério de pronto:</strong> compose sobe worker; fila drena; integração com
<code>check_celery_queues</code>.</p>""",
                "high",
            ),
            (
                "- IDEMPOTÊNCIA E RETRY — JOBS DE CHAT FALHADOS",
                """<p><strong>Objetivo:</strong> Resiliência a falhas transitórias LLM/rede sem duplicar mensagens.</p>
<p><strong>Implementação:</strong></p>
<ul>
<li>Retry exponencial (max 2 tentativas)</li>
<li>Dead-letter queue inspeccionável</li>
<li>Idempotency key <code>(session_id, client_message_id)</code></li>
<li>UI: retry re-enfileira ou reutiliza job</li>
</ul>
<p><strong>Critério de pronto:</strong> reenvio duplicado não cria segunda mensagem user; DLQ documentada.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "- ESCALA DO CHAT — FASE 4: OTIMIZAÇÃO RAG, RESUMO E BANCO",
        "planned",
        [
            (
                "- CACHE REDIS — EMBEDDING DE QUERY RAG",
                """<p><strong>Objetivo:</strong> Evitar chamadas repetidas à API de embedding para queries idênticas.</p>
<p><strong>Implementação:</strong> cache Redis por <code>hash(normalize(query)) + embedding_model</code>,
TTL 5–15 min; integrar em <code>hybrid_retrieve</code> / <code>embed_texts_cached</code>.</p>
<p><strong>Critério de pronto:</strong> cache hit logado; segunda query idêntica sem round-trip embedding API.</p>""",
                "high",
            ),
            (
                "- CACHE REDIS — RESULTADOS RAG POR CONTEXTO",
                """<p><strong>Objetivo:</strong> Cachear chunks finais pós-RRF por contexto de actor.</p>
<p><strong>Chave:</strong> <code>(workspace_id, board_slug, project_id, query_hash)</code>, TTL 2–5 min;
invalidação em reindex (<code>index_entity_task</code>).</p>
<p><strong>Critério de pronto:</strong> latência RAG p95 reduzida ≥ 30% em benchmark de queries repetidas.</p>""",
                "high",
            ),
            (
                "- SUMMARIZATION ASSÍNCRONA DE THREADS LONGAS",
                """<p><strong>Objetivo:</strong> Remover chamada LLM síncrona de resumo inline em
<code>build_llm_history</code> quando thread &gt; 14 mensagens.</p>
<p><strong>Implementação:</strong> task Celery pós-mensagem; resumo persistido em
<code>session.context</code>; fallback textual quando <code>ASSISTANT_SUMMARY_SYNC=0</code>.</p>
<p><strong>Critério de pronto:</strong> chat não bloqueia por summarization; threads longas funcionais.</p>""",
                "high",
            ),
            (
                "- DEFERIR AUDIT LOG E MÉTRICAS NÃO CRÍTICAS",
                """<p><strong>Objetivo:</strong> Reduzir writes síncronos no hot path do chat.</p>
<p><strong>Escopo:</strong> <code>log_assistant_action</code>, <code>record_assistant_response</code> via
fila Celery ou Redis list; consistência eventual &lt; 5s.</p>
<p><strong>Critério de pronto:</strong> latência p95 chat reduzida; audit completo verificável após delay.</p>""",
                "medium",
            ),
            (
                "- ÍNDICE GIN FTS E TUNING PGVECTOR SOB CARGA",
                """<p><strong>Objetivo:</strong> Optimizar queries RAG híbridas (vetor HNSW + FTS).</p>
<p><strong>Implementação:</strong> migration índice GIN em <code>search_embeddings.content</code> se ausente;
tuning <code>ef_search</code> HNSW; documentar <code>ASSISTANT_RAG_CANDIDATE_LIMIT</code> adaptativo.</p>
<p><strong>Critério de pronto:</strong> EXPLAIN ANALYZE antes/depois documentado no card.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "- ESCALA DO CHAT — FASE 5: CONCORRÊNCIA, FAIR QUEUE E PROTEÇÃO LLM",
        "planned",
        [
            (
                "- SEMÁFORO REDIS — LIMITE GLOBAL DE CHATS LLM PARALELOS",
                """<p><strong>Objetivo:</strong> Proteger provider LLM e infra interna de avalanche de chamadas.</p>
<p><strong>Implementação:</strong> chave Redis <code>assistant:llm:semaphore</code>,
env <code>ASSISTANT_MAX_CONCURRENT_LLM</code> (default 40); acquire antes de
<code>stream_chat_completion</code>; release em <code>finally</code>.</p>
<p><strong>Critério de pronto:</strong> nunca excede N LLM calls simultâneas; métrica exposta para Prometheus.</p>""",
                "urgent",
            ),
            (
                "- FAIR QUEUE — FILA POR WORKSPACE COM POSIÇÃO ESTIMADA",
                """<p><strong>Objetivo:</strong> Fairness quando semáforo LLM está saturado.</p>
<p><strong>Comportamento:</strong> job permanece <code>queued</code> com <code>queue_position</code> e
<code>estimated_wait_seconds</code>; nenhum workspace monopoliza slots.</p>
<p><strong>Critério de pronto:</strong> 150 VUs recebem fila ordenada ou 429 com retry_after; sem starvation.</p>""",
                "high",
            ),
            (
                "- RATE LIMIT CONCORRENTE (NÃO SÓ POR HORA)",
                """<p><strong>Objetivo:</strong> Impedir um utilizador de abrir múltiplos streams paralelos.</p>
<p><strong>Implementação:</strong> complementar <code>rate_limit.py</code> com
<code>assistant:active:user:{workspace}:{user}</code>; max N requests activas por user.</p>
<p><strong>Critério de pronto:</strong> testes unitários Redis; segundo stream simultâneo rejeitado com 429.</p>""",
                "high",
            ),
            (
                "- POOL DE API KEYS LLM — ROUND-ROBIN E CIRCUIT BREAKER",
                """<p><strong>Objetivo:</strong> Resiliência a rate limits e falhas do provider.</p>
<p><strong>Implementação:</strong> env <code>LLM_API_KEYS</code> (lista separada por vírgula); round-robin;
circuit breaker por key em 429/5xx com cooldown.</p>
<p><strong>Critério de pronto:</strong> failover automático testado; documentado em
<code>docs/assistant-env.md</code>.</p>""",
                "medium",
            ),
            (
                "- FALLBACK DE MODELO SOB CARGA (DEGRADED MODE)",
                """<p><strong>Objetivo:</strong> Degradação graceful quando fila ou budget excedem thresholds.</p>
<p><strong>Implementação:</strong> env <code>LLM_MODEL_FALLBACK</code>; activar quando fila &gt; threshold ou
budget &gt; 90%; banner UI «modo económico» (i18n).</p>
<p><strong>Critério de pronto:</strong> teste integração; flag configurável; sem falha silenciosa.</p>""",
                "medium",
            ),
        ],
    ),
    (
        "- ESCALA DO CHAT — FASE 6: FRONTEND RESILIENTE SOB CARGA",
        "planned",
        [
            (
                "- UI DE FILA E RETRY_AFTER NO ASSISTENTE",
                """<p><strong>Objetivo:</strong> Comunicar claramente estados de fila, limite e retry ao utilizador.</p>
<p><strong>Implementação:</strong> componentes para HTTP 429, <code>user_rate_limit</code>,
<code>workspace_rate_limit</code>, posição na fila, countdown <code>retry_after</code>; copy pt-BR/en em
<code>packages/i18n</code>.</p>
<p><strong>Critério de pronto:</strong> utilizador compreende estado; botão retry desactivado até countdown zero.</p>""",
                "high",
            ),
            (
                "- DEBOUNCE E CACHE DE LISTAGEM DE SESSÕES",
                """<p><strong>Objetivo:</strong> Reduzir requests de listagem de sessões em pico.</p>
<p><strong>Implementação:</strong> cache TTL 30s no store; invalidar em create/delete/rename;
evitar refetch a cada toggle do painel.</p>
<p><strong>Critério de pronto:</strong> menos GET /sessions/ em sessão activa; lista actualizada após acções.</p>""",
                "medium",
            ),
            (
                "- INDICADOR DE LATÊNCIA E FERRAMENTAS EM EXECUÇÃO",
                """<p><strong>Objetivo:</strong> Feedback visual durante execução de tools e geração.</p>
<p><strong>Implementação:</strong> stepper durante <code>tool_start</code>/<code>tool_end</code>
(ex.: «A consultar board…»); timer opcional até first token.</p>
<p><strong>Critério de pronto:</strong> alinhado a eventos SSE; acessível (aria-live).</p>""",
                "medium",
            ),
            (
                "- FEATURE FLAG — MODO ASSÍNCRONO VS SÍNCRONO NO FE",
                """<p><strong>Objetivo:</strong> Rollout gradual do fluxo job + stream.</p>
<p><strong>Implementação:</strong> <code>VITE_ASSISTANT_ASYNC_CHAT=1</code> alterna entre fluxo assíncrono e
legado síncrono.</p>
<p><strong>Critério de pronto:</strong> toggle funcional; documentado em <code>docs/assistant-env.md</code>.</p>""",
                "low",
            ),
        ],
    ),
    (
        "- ESCALA DO CHAT — FASE 7: OBSERVABILIDADE, CARGA E VALIDAÇÃO FINAL",
        "planned",
        [
            (
                "- MÉTRICAS PROMETHEUS — CHAT ATIVO, FILA E SEMÁFORO LLM",
                """<p><strong>Objetivo:</strong> Instrumentação operacional para dashboards e alertas.</p>
<p><strong>Gauges:</strong> <code>assistant_chat_active</code>, <code>assistant_chat_queue_depth</code>,
<code>assistant_llm_semaphore_available</code>, <code>assistant_rag_cache_hit_ratio</code>.</p>
<p><strong>Critério de pronto:</strong> dashboard Grafana (ou equivalente) com painéis por workspace/instância.</p>""",
                "high",
            ),
            (
                "- ALERTAS — P95 FIRST TOKEN E TAXA DE ERRO",
                """<p><strong>Objetivo:</strong> Detecção proactiva de degradação.</p>
<p><strong>Alertas:</strong> p95 first token &gt; 3s (5 min); error rate &gt; 5%; fila assistant-chat &gt; 100.</p>
<p><strong>Critério de pronto:</strong> runbook de incidente linkado; teste de firing em staging.</p>""",
                "high",
            ),
            (
                "- EXTENDER check_celery_queues PARA FILA ASSISTANT-CHAT",
                """<p><strong>Objetivo:</strong> Monitorização de fila de chat no comando existente.</p>
<p><strong>Implementação:</strong> incluir fila <code>assistant-chat</code> em
<code>manage.py check_celery_queues</code> com <code>--alert-threshold</code> default 100.</p>
<p><strong>Critério de pronto:</strong> documentado em <code>docs/celery-queue-monitoring.md</code>.</p>""",
                "medium",
            ),
            (
                "- TESTE DE CARGA FINAL — 150 USUÁRIOS VIRTUALISADOS",
                """<p><strong>Objetivo:</strong> Validar SLAs após implementação completa das fases 1–7.</p>
<p><strong>Cenário:</strong> 150 VUs, ramp 5 min, mix 70% chat simples / 30% com tools; comparar com baseline
(card de governança).</p>
<p><strong>Critério de pronto:</strong> SLAs definidos atingidos; relatório comparativo antes/depois anexado.</p>""",
                "urgent",
            ),
            (
                "- DOCUMENTAÇÃO — ESCALA DO ASSISTENTE (ADMIN + DEVOPS)",
                """<p><strong>Objetivo:</strong> Documentação consolidada de operação em escala.</p>
<p><strong>Entregável:</strong> <code>docs/assistant-scaling.md</code> — topologia, variáveis, tuning workers,
troubleshooting fila/SSE/PgBouncer; actualizar <code>assistant-env.md</code> e admin guide.</p>
<p><strong>Critério de pronto:</strong> doc revisado; linked from README assistente.</p>""",
                "medium",
            ),
            (
                "- CHECKLIST GO-LIVE — ESCALA 150+ USUÁRIOS",
                """<p><strong>Objetivo:</strong> Gate final antes de activar escala em instância cliente.</p>
<p><strong>Checklist:</strong> PgBouncer activo, api-chat réplicas, semáforo LLM, alertas configurados,
backup Redis, limites provider, plano de rollback, teste 150 VUs verde.</p>
<p><strong>Critério de pronto:</strong> checklist assinado por tech lead + DevOps no card.</p>""",
                "medium",
            ),
        ],
    ),
]
