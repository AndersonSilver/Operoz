"""Catálogo de módulos e cards — PRD Review Operoz (aprovação e feedback cliente).

Ref: PRD/PRD-MAGALU.html (protótipo UX), html-document-embed, guest link QBR.
"""

from __future__ import annotations

ROADMAP_REF = "PRD/PRD-MAGALU.html"
PROTOTYPE_NOTE = (
    "<p><strong>Protótipo:</strong> <code>PRD/PRD-MAGALU.html</code> — aprovação, comentários por seção, "
    "comentários em trecho (localStorage). Este programa substitui persistência local por API Operoz.</p>"
)

# (módulo, status, [(título, descrição HTML, prioridade)])

PRD_REVIEW_CATALOG: list[tuple[str, str, list[tuple[str, str, str]]]] = [
    (
        "- PRD REVIEW — GOVERNANÇA E ROADMAP",
        "in-progress",
        [
            (
                "- ADR — ARQUITETURA PRD REVIEW OPERoz",
                f"""<p><strong>Objetivo:</strong> Formalizar decisões para review de documentação (PRD) com aprovação, feedback ancorado e acesso guest por e-mail.</p>
{PROTOTYPE_NOTE}
<p><strong>Escopo:</strong></p>
<ul>
<li>ADR em <code>Operoz/docs/adr/</code>: sessão de review por <code>PageVersion</code>; identidade guest via convite; comentários section vs inline (quote + anchor).</li>
<li>Reutilizar padrão <code>Client360QbrGuestLink</code> para <code>PageReviewInvite</code>.</li>
<li>HTML embutido via <code>html-document-embed</code> + SDK JS desacoplado (<code>@operoz/prd-review</code>).</li>
<li>Regra UX: aprovar bloqueado se existir comentário (como protótipo Magalu).</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>ADR aprovado por tech lead antes de Fase 1 backend.</li>
<li>Diagrama sequência: T4H publica → convite e-mail → cliente comenta → feedback no Operoz.</li>
<li>Alternativas documentadas: só localStorage vs API; iframe sandbox vs viewer nativo.</li>
</ul>""",
                "urgent",
            ),
            (
                "- ROADMAP DOC — PRD REVIEW FASES 0-5",
                f"""<p><strong>Objetivo:</strong> Documento vivo do programa PRD Review ligado ao backlog OPEROZDP.</p>
<p><strong>Escopo:</strong></p>
<ul>
<li>Criar <code>Operoz/docs/operoz-prd-review-roadmap.md</code> com fases 0–5, APIs, rotas guest e checklist MCP.</li>
<li>Mapear requisitos: aprovar/feedback, e-mail, persistência, trecho, padronização MCP, template PRD.</li>
<li>Referência cruzada com catálogo <code>operoz_prd_review_catalog.py</code>.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>PM entende fluxo cliente sem ler o HTML de 6k linhas.</li>
<li>Cada card deste catálogo tem secção correspondente no doc.</li>
</ul>""",
                "high",
            ),
        ],
    ),
    (
        "- PRD REVIEW — FASE 0 — PADRONIZAR ARTEFATO",
        "planned",
        [
            (
                "- TEMPLATE PRD T4H (HTML + SEÇÕES)",
                f"""<p><strong>Objetivo:</strong> Template reutilizável para PRDs de cliente (hero, metadados, índice, <code>.doc-section</code> com ids estáveis).</p>
{PROTOTYPE_NOTE}
<p><strong>Escopo:</strong></p>
<ul>
<li>Extrair tokens CSS T4H e layout de <code>{ROADMAP_REF}</code> para <code>Operoz/templates/prd/</code>.</li>
<li>Contrato: cada seção com <code>id</code> estável para comentários e navegação.</li>
<li>Metadados: cliente, fase, canal, responsável, épico.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Novo PRD gerado a partir do template sem copiar Magalu inteiro.</li>
<li>Renderiza correctamente em iframe <code>html-document-embed</code>.</li>
</ul>""",
                "high",
            ),
            (
                "- SDK JS — @operoz/prd-review",
                f"""<p><strong>Objetivo:</strong> Extrair lógica de aprovação/comentários do HTML monolítico para módulo reutilizável.</p>
<p><strong>Escopo:</strong></p>
<ul>
<li>Função <code>initPrdReview(&#123; pageId, reviewSessionId, apiBase, mode &#125;)</code>.</li>
<li>Migrar: comentário por seção, toolbar de seleção, inline markers, resumo aprovação/feedback, impressão.</li>
<li>Modos: <code>guest</code> (API) e <code>preview</code> (interno).</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Magalu HTML reduzido: importa SDK em vez de ~900 linhas inline.</li>
<li>Comportamento equivalente ao protótipo com mock API.</li>
</ul>""",
                "urgent",
            ),
            (
                "- MANIFESTO — operoz-prd-config",
                """<p><strong>Objetivo:</strong> Bloco JSON padronizado no HTML para metadados e config de review.</p>
<p><strong>Escopo:</strong></p>
<ul>
<li><code>&lt;script type="application/json" id="operoz-prd-config"&gt;</code> com versão, tipo, cliente, fase, épico, <code>review_enabled</code>, lista de section ids.</li>
<li>Validador no upload MCP e no backend ao criar sessão.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Agente MCP consegue ler manifesto e criar sessão sem heurística frágil.</li>
<li>HTML sem manifesto válido → erro claro na UI interna.</li>
</ul>""",
                "high",
            ),
            (
                "- SCAFFOLD — CRIAR PRD VIA MCP/HARNESS",
                """<p><strong>Objetivo:</strong> Checklist fixo para agente subir PRD no cliente com review activo.</p>
<p><strong>Escopo:</strong></p>
<ul>
<li>Skill Harness: create page → upload HTML asset → embed → manifesto → (fase 3) sessão review.</li>
<li>Documentar em <code>.cursor/skills/harness-engineering/</code> ou skill dedicada PRD.</li>
</ul>
<p><strong>Critérios de aceite:</strong></p>
<ul>
<li>Runbook executável end-to-end num projecto de teste.</li>
</ul>""",
                "medium",
            ),
        ],
    ),
    (
        "- PRD REVIEW — FASE 1 — BACKEND REVIEW",
        "planned",
        [
            (
                "- MODELO — PageReviewSession",
                """<p><strong>Objetivo:</strong> Sessão de review ligada a página e versão.</p>
<p><strong>Campos:</strong> <code>page</code>, <code>page_version</code>, <code>status</code> (draft/sent/approved/changes_requested), <code>sent_at</code>, <code>resolved_at</code>, <code>created_by</code>.</p>
<p><strong>Critérios de aceite:</strong> migration + admin; uma sessão activa por versão publicada.</p>""",
                "urgent",
            ),
            (
                "- MODELO — PageReviewInvite",
                """<p><strong>Objetivo:</strong> Convite guest por e-mail (padrão QBR).</p>
<p><strong>Campos:</strong> <code>session</code>, <code>email</code>, <code>token</code>, <code>expires_at</code>, <code>revoked_at</code>, <code>last_access_at</code>.</p>
<p><strong>Critérios de aceite:</strong> token opaco; revogação imediata; TTL configurável.</p>""",
                "high",
            ),
            (
                "- MODELO — PageReviewComment",
                """<p><strong>Objetivo:</strong> Comentários de seção e trecho persistidos.</p>
<p><strong>Campos:</strong> <code>session</code>, <code>type</code> (section/inline), <code>section_id</code>, <code>quote</code>, <code>body</code>, <code>author_email</code>, <code>anchor</code> (JSON offsets/hash).</p>
<p><strong>Critérios de aceite:</strong> CRUD guest; autor = e-mail do convite.</p>""",
                "urgent",
            ),
            (
                "- MODELO — PageReviewEvent (AUDIT)",
                """<p><strong>Objetivo:</strong> Trilha de auditoria (opened, commented, approved, feedback_submitted).</p>
<p><strong>Critérios de aceite:</strong> eventos imutáveis; consulta por sessão no painel interno.</p>""",
                "medium",
            ),
            (
                "- API — WORKSPACE REVIEW SESSIONS",
                """<p><strong>Objetivo:</strong> CRUD sessões no workspace/project.</p>
<p><strong>Rotas:</strong></p>
<ul>
<li><code>POST/GET …/pages/&#123;id&#125;/review-sessions/</code></li>
<li><code>GET …/review-sessions/&#123;id&#125;/</code> com comentários e eventos</li>
</ul>
<p><strong>Critérios de aceite:</strong> RBAC membro/admin; contract tests.</p>""",
                "high",
            ),
            (
                "- API — GUEST PRD REVIEW",
                """<p><strong>Objetivo:</strong> Endpoints públicos autenticados por token.</p>
<p><strong>Rotas:</strong></p>
<ul>
<li><code>GET /api/guest/prd-review/&#123;token&#125;/</code></li>
<li><code>POST …/comments/</code></li>
<li><code>POST …/submit/</code> (approve | feedback)</li>
</ul>
<p><strong>Critérios de aceite:</strong> token expirado/revogado → 410; sem acesso a outros projects.</p>""",
                "urgent",
            ),
            (
                "- TESTES — CONTRACT PRD REVIEW API",
                """<p><strong>Objetivo:</strong> Cobertura pytest contract + unit para modelos e guest.</p>
<p><strong>Critérios de aceite:</strong> fluxo feliz approve; fluxo feedback com comentários; token inválido.</p>""",
                "high",
            ),
        ],
    ),
    (
        "- PRD REVIEW — FASE 2 — ACESSO EMAIL E UI GUEST",
        "planned",
        [
            (
                "- UI — MODAL PARTILHAR PARA REVIEW",
                """<p><strong>Objetivo:</strong> Equipa T4H convida clientes por e-mail a partir da página de documentação.</p>
<p><strong>Escopo:</strong> e-mails múltiplos, TTL, mensagem opcional, copiar link (como guest QBR).</p>
<p><strong>Critérios de aceite:</strong> convite cria <code>PageReviewInvite</code>; lista convites activos na página.</p>""",
                "high",
            ),
            (
                "- UI — PÁGINA GUEST /guest/prd-review/{token}",
                """<p><strong>Objetivo:</strong> Viewer dedicado read-only + SDK review em modo guest.</p>
<p><strong>Escopo:</strong> iframe fullBleed ou layout Operoz guest; branding Operoz/T4H.</p>
<p><strong>Critérios de aceite:</strong> cliente com link válido vê PRD e comenta sem login Operoz.</p>""",
                "urgent",
            ),
            (
                "- SDK — PERSISTÊNCIA API (SUBSTITUIR LOCALSTORAGE)",
                """<p><strong>Objetivo:</strong> <code>saveState</code>/<code>loadState</code> do protótipo passam a usar API guest.</p>
<p><strong>Critérios de aceite:</strong> comentários sobrevivem refresh; equipa vê mesmo estado no painel interno.</p>""",
                "urgent",
            ),
            (
                "- EMAIL — CONVITE REVIEW PRD",
                """<p><strong>Objetivo:</strong> E-mail transacional «PRD disponível para review» com link único.</p>
<p><strong>Critérios de aceite:</strong> template pt-BR; link expira conforme TTL; sem PII extra.</p>""",
                "medium",
            ),
            (
                "- UI — ABA REVIEW NA DOCUMENTAÇÃO",
                """<p><strong>Objetivo:</strong> Painel interno: convites, status sessão, comentários, «marcar tratado».</p>
<p><strong>Critérios de aceite:</strong> estados visuais approved/changes_requested; filtro por sessão.</p>""",
                "high",
            ),
        ],
    ),
    (
        "- PRD REVIEW — FASE 3 — INTEGRAÇÃO MCP",
        "planned",
        [
            (
                "- MCP — operoz_create_prd_review_session",
                """<p><strong>Objetivo:</strong> Tool MCP para criar sessão após upload de PRD.</p>
<p><strong>Critérios de aceite:</strong> registo em <code>mcp-server</code>; doc OpenAPI; teste manual Cursor.</p>""",
                "high",
            ),
            (
                "- MCP — operoz_add_prd_review_invites",
                """<p><strong>Objetivo:</strong> Tool MCP para convites por lista de e-mails.</p>
<p><strong>Critérios de aceite:</strong> idempotência por e-mail+sessão; retorna URLs guest.</p>""",
                "high",
            ),
            (
                "- MCP — operoz_get_prd_review_status",
                """<p><strong>Objetivo:</strong> Consultar estado da sessão (pending/approved/changes_requested).</p>
<p><strong>Critérios de aceite:</strong> agente Harness sabe quando cliente respondeu.</p>""",
                "medium",
            ),
            (
                "- MCP — operoz_list_prd_review_comments",
                """<p><strong>Objetivo:</strong> Listar comentários estruturados (seção + trecho).</p>
<p><strong>Critérios de aceite:</strong> output JSON utilizável para gerar cards de ajuste.</p>""",
                "medium",
            ),
            (
                "- HARNESS — SKILL SUBIR PRD CLIENTE",
                """<p><strong>Objetivo:</strong> Skill completa: page + asset HTML + embed + sessão + convites + card épico.</p>
<p><strong>Critérios de aceite:</strong> checklist Magalu replicável para outro cliente em &lt;15 min via agente.</p>""",
                "high",
            ),
        ],
    ),
    (
        "- PRD REVIEW — FASE 4 — FEEDBACK NA OPERAÇÃO",
        "planned",
        [
            (
                "- UI — INBOX REVIEW PRD",
                """<p><strong>Objetivo:</strong> Vista workspace/board «PRDs aguardando feedback / aprovados».</p>
<p><strong>Critérios de aceite:</strong> filtros por cliente/projeto; link para página e sessão.</p>""",
                "medium",
            ),
            (
                "- SYNC — FEEDBACK → CARDS ÉPICO",
                """<p><strong>Objetivo:</strong> Comentários de review geram sub-tasks ou comentários no card épico (ex. OPS-1483).</p>
<p><strong>Critérios de aceite:</strong> acção manual ou automática configurável; não duplica comentários.</p>""",
                "high",
            ),
            (
                "- DIFF — REVIEW POR PAGEVERSION",
                """<p><strong>Objetivo:</strong> Sessão amarrada a versão; UI mostra diff entre revisões enviadas ao cliente.</p>
<p><strong>Critérios de aceite:</strong> reenvio cria nova sessão; histórico consultável.</p>""",
                "medium",
            ),
            (
                "- ASSISTENTE — TOOL get_prd_review_summary",
                """<p><strong>Objetivo:</strong> Tool LLM «o que o cliente pediu no PRD?»</p>
<p><strong>Critérios de aceite:</strong> resposta com citações seção/trecho; permission gate.</p>""",
                "medium",
            ),
            (
                "- AUTOMAÇÃO — feedback_submitted",
                """<p><strong>Objetivo:</strong> Regra: cliente envia feedback → notificar Slack/e-mail + card «Ajustar PRD».</p>
<p><strong>Critérios de aceite:</strong> playbook template instalável; teste em board sandbox.</p>""",
                "low",
            ),
        ],
    ),
    (
        "- PRD REVIEW — FASE 5 — POLIMENTO E GOVERNANÇA",
        "planned",
        [
            (
                "- RBAC — PERMISSÕES REVIEW",
                """<p><strong>Objetivo:</strong> Quem cria convites, vê comentários, fecha sessão.</p>
<p><strong>Critérios de aceite:</strong> guest nunca vê docs privados; member vs admin documentado.</p>""",
                "medium",
            ),
            (
                "- MÉTRICAS — REVIEW PRD",
                """<p><strong>Objetivo:</strong> Tempo até aprovação, rodadas de feedback, taxa de aprovação primeira visita.</p>
<p><strong>Critérios de aceite:</strong> endpoint ou export analytics; dashboard mínimo interno.</p>""",
                "low",
            ),
            (
                "- I18N — COPY REVIEW PT-BR",
                """<p><strong>Objetivo:</strong> Strings guest e modal partilhar em pt-BR (marca Operoz).</p>
<p><strong>Critérios de aceite:</strong> chaves em <code>packages/i18n</code>; sem hardcode no SDK.</p>""",
                "medium",
            ),
            (
                "- PDF — EXPORT REVIEW (OPCIONAL)",
                """<p><strong>Objetivo:</strong> PDF server-side com opção com/sem comentários (alternativa a window.print).</p>
<p><strong>Critérios de aceite:</strong> spike ou entrega; não bloqueia go-live Fase 2.</p>""",
                "none",
            ),
        ],
    ),
]
