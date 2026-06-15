/** Conteúdo do Manual Operoz — estrutura inspirada em https://docs.plane.so/ */
export const operozManualPtBR = {
  title: "Documentação Operoz",
  nav_label: "Manual",
  subtitle: "Guia completo da plataforma",
  search_placeholder: "Buscar na documentação…",
  search_empty: "Nenhum resultado encontrado",
  mobile_nav_toggle: "Abrir menu da documentação",
  home: {
    nav_label: "Início",
    hero_title: "Documentação Operoz",
    hero_subtitle:
      "Planeje, acompanhe e entregue seu trabalho com o Operoz. Esta documentação ajuda você a dominar a plataforma, gerir projetos, colaborar com times e automatizar fluxos operacionais.",
    get_started: "Começar",
    quickstart: "Guia rápido",
    cards: {
      get_started: {
        description: "Aprenda os conceitos básicos, configure seu workspace e crie seus primeiros cards em minutos.",
        link: "Começar agora",
      },
      workspace: {
        description: "Configure workspaces, convide membros, defina papéis e personalize a navegação.",
        link: "Configurar workspace",
      },
      boards: {
        description: "Organize times com boards, vistas de trabalho, KPIs e a vista Cliente 360.",
        link: "Explorar boards",
      },
      projects: {
        description: "Crie projetos, ative módulos (ciclos, intake, páginas) e gerencie membros.",
        link: "Gerir projetos",
      },
      work_items: {
        description: "Crie e gerencie cards, propriedades, filtros, rascunhos e fluxos de status.",
        link: "Gerir cards",
      },
      planning: {
        description: "Planeje com ciclos, módulos, visualizações salvas e anotações rápidas.",
        link: "Planejar trabalho",
      },
      knowledge: {
        description: "Documente com páginas rich-text, status reports e formulários de recepção.",
        link: "Explorar conhecimento",
      },
      automation: {
        description: "Automatize fluxos com grafos visuais, playbooks, hooks e métricas de execução.",
        link: "Ver automações",
      },
      ai: {
        description: "Use o Assistente Operoz para consultar dados reais e propor automações com IA.",
        link: "Explorar IA",
      },
      analytics: {
        description: "Acompanhe métricas do workspace, boards e dashboards personalizados.",
        link: "Ver analytics",
      },
      communication: {
        description: "Inbox, notificações, menções e preferências de comunicação.",
        link: "Ver comunicação",
      },
      integrations: {
        description: "API REST, webhooks, MCP e integrações com ferramentas externas.",
        link: "Ver integrações",
      },
    },
  },
  nav: {
    get_started: "Primeiros passos",
    workspace: "Workspace",
    boards: "Boards",
    projects: "Projetos",
    work_items: "Itens de trabalho",
    planning: "Planejamento",
    knowledge: "Conhecimento",
    automation: "Automação",
    ai: "IA",
    analytics: "Analytics",
    communication: "Comunicação",
    integrations: "Integrações",
  },
  tips_label: "Dicas práticas",
  footer: "Operoz — plataforma operacional inteligente.",
  article_not_found: "Página não encontrada na documentação.",
  back_to_home: "Voltar ao início",
  prev_article: "Anterior",
  next_article: "Próximo",
  pagination_label: "Navegação entre artigos",
  articles: {
    get_started_introduction: {
      title: "Introdução",
      description: "Conheça o Operoz e como ele se organiza para gestão operacional inteligente.",
      p: {
        0: "O Operoz é uma plataforma operacional que une gestão de projetos, sustentação, documentação e automação em um único lugar. Ele foi construído para times que precisam de visibilidade de ponta a ponta — do card individual até a saúde do cliente.",
        1: "A hierarquia principal é: Workspace → Board (time) → Projeto → Card. Cada camada adiciona contexto: o workspace isola sua organização; o board agrupa projetos de um squad; o projeto contém o trabalho; o card é a unidade executável.",
        2: "Diferencial do Operoz em relação a ferramentas genéricas: Cliente 360 nativo, motor de automação por board com grafos visuais, e Assistente Operoz com IA fundamentada em dados reais (não alucinação).",
      },
      tips: {
        0: "Use a barra superior para Inbox, Manual e perfil — sempre acessíveis.",
        1: "O botão flutuante «Perguntar ao Operoz» abre o assistente de IA.",
        2: "Cmd+K (Power K) é o atalho mais poderoso para navegar sem mouse.",
      },
    },
    get_started_quickstart: {
      title: "Guia rápido",
      description: "Configure seu workspace e entregue valor em poucos passos.",
      p: {
        0: "1. Crie ou entre no workspace e convide membros em Configurações → Membros.",
        1: "2. Crie um board (time) e adicione projetos — cada projeto recebe uma chave (ex.: OPZ).",
        2: "3. Dentro de um projeto, crie seu primeiro card com «Novo item» ou atalho C.",
        3: "4. Explore as vistas do board (quadro, lista, backlog) e configure automações básicas se necessário.",
      },
      tips: {
        0: "Comece pelo overview do board para ver KPIs agregados.",
        1: "Ative apenas os módulos que seu time usa (ciclos, intake, páginas) nas configs do projeto.",
        2: "Salve uma visualização filtrada para acesso rápido depois.",
        3: "Teste o Assistente perguntando «liste cards abertos neste board».",
      },
    },
    get_started_core_concepts: {
      title: "Conceitos principais",
      description: "Entenda os blocos fundamentais da plataforma Operoz.",
      p: {
        0: "Workspace: ambiente isolado da sua empresa. Contém membros, boards, projetos e configurações globais.",
        1: "Board: agrupamento por time ou área. Oferece vistas transversais, Cliente 360 e automações compartilhadas.",
        2: "Card (work item): unidade de trabalho com ciclo de vida (status), responsáveis, datas e metadados customizáveis.",
      },
      tips: {
        0: "Projetos podem existir sem board em setups legados, mas o modelo recomendado é board → projetos.",
        1: "Estados de card são configuráveis por projeto (A fazer, Em progresso, Concluído, etc.).",
        2: "Módulos e ciclos são opcionais — ative conforme a metodologia do time.",
        3: "Automações vivem no board, não no card individual.",
      },
    },
    workspace_overview: {
      title: "Gerenciar workspace",
      description: "Visão geral das configurações e estrutura do workspace.",
      p: {
        0: "O workspace é o container raiz. Na Home você vê widgets de atividade, dashboards e atalhos. A sidebar lista projetos/boards e itens pessoais (Seu trabalho, Rascunhos, Anotações).",
        1: "Troque de workspace pelo menu no topo da sidebar (logo + nome). Convites pendentes aparecem em «Convites para o espaço de trabalho».",
        2: "Configurações do workspace ficam em /settings — membros, integrações, API tokens, exportação e faturamento.",
      },
      tips: {
        0: "Personalize a homepage com widgets relevantes para seu papel.",
        1: "Use workspace views para ver todos os cards do workspace com filtros globais.",
        2: "Arquivos de projetos inativos ficam em Projetos → Arquivos.",
      },
    },
    workspace_members: {
      title: "Gerenciar membros",
      description: "Convide pessoas e defina papéis no workspace.",
      p: {
        0: "Admins podem convidar por e-mail em Configurações → Membros. Cada membro recebe um papel: Admin, Member ou Guest.",
        1: "Guests têm acesso restrito — ideal para stakeholders externos. Members criam e editam trabalho. Admins configuram tudo.",
        2: "Remover um membro não apaga o trabalho que ele criou; apenas revoga acesso futuro.",
      },
      tips: {
        0: "Revise convites pendentes regularmente no menu do workspace.",
        1: "Combine papéis de workspace com funções de board para controle fino.",
        2: "Exporte lista de membros nas configurações se precisar de auditoria.",
      },
    },
    workspace_power_k: {
      title: "Power K",
      description: "Paleta de comandos universal do Operoz.",
      p: {
        0: "Power K (Cmd+K / Ctrl+K) abre a busca e paleta de comandos. Digite para encontrar projetos, boards, cards, páginas ou executar ações.",
        1: "Grupos de comandos: Navegação, Ações contextuais (no card aberto), Criação e Ajuda.",
        2: "Cmd+/ lista todos os atalhos de teclado disponíveis na tela atual.",
      },
      tips: {
        0: "No card aberto, Power K mostra ações como alterar status, prioridade ou atribuir a mim.",
        1: "Busque «Manual» no Power K para abrir esta documentação.",
        2: "Power K respeita suas permissões — só mostra o que você pode acessar.",
      },
    },
    workspace_navigation: {
      title: "Personalizar navegação",
      description: "Adapte a sidebar ao seu fluxo de trabalho.",
      p: {
        0: "A sidebar principal mostra Home, Projetos/Boards e seção Workspace (visualizações, analytics, arquivos).",
        1: "Use «Mostrar mais» para itens extras e o ícone de preferências para reordenar ou ocultar itens pessoais (anotações, rascunhos, seu trabalho).",
      },
      tips: {
        0: "Fixe projetos favoritos na seção Favoritos para acesso em um clique.",
        1: "App Rail (barra vertical esquerda) pode exibir ícones com ou sem rótulo.",
        2: "Em boards, a navegação pode ser em abas (TABBED) ou sidebar estendida.",
      },
    },
    workspace_roles: {
      title: "Papéis e permissões",
      description: "Entenda quem pode fazer o quê no workspace.",
      p: {
        0: "Três papéis base no workspace: Admin (configuração total), Member (trabalho + criação) e Guest (leitura limitada).",
        1: "Boards adicionam funções customizáveis — ex.: quem edita automações, quem vê Cliente 360.",
        2: "Projetos têm papéis próprios (Admin/Member/Guest) independentes do workspace em alguns casos.",
      },
      tips: {
        0: "Matriz de permissões disponível nas configurações avançadas.",
        1: "Assistente Operoz e MCP herdam permissões do usuário logado.",
        2: "Revise funções de board ao onboarding de novos squads.",
      },
    },
    boards_overview: {
      title: "Visão geral dos boards",
      description: "Boards como unidade de organização por time.",
      p: {
        0: "Um board representa um time, squad ou área de negócio. Agrupa múltiplos projetos (clientes, produtos, iniciativas) sob a mesma governança operacional.",
        1: "O overview do board exibe KPIs: cards abertos, atrasados, concluídos, atividade recente e gráficos por status/prioridade.",
        2: "Crie boards em /boards ou pela sidebar. Cada board tem slug único usado na URL (/boards/meu-time).",
      },
      tips: {
        0: "Boards arquivados somem da sidebar mas permanecem nas configurações.",
        1: "Adicione projetos existentes ou crie novos diretamente no board.",
        2: "O overview alerta sobre cards sem data-alvo ou atrasados.",
        3: "Use espaços (spaces) para sub-agrupar dentro de boards grandes.",
      },
    },
    boards_views: {
      title: "Vistas e layouts",
      description: "Quadro, lista, backlog, cronograma e calendário.",
      p: {
        0: "Quadro (kanban): colunas por status, arraste cards para transicionar. Ideal para fluxo contínuo.",
        1: "Lista: tabela densa com filtros, agrupamento e ordenação. Ideal para triagem em volume.",
        2: "Backlog, cronograma e calendário: planejamento temporal e priorização antes da execução.",
      },
      tips: {
        0: "Display options permitem agrupar por responsável, prioridade ou etiqueta.",
        1: "Salve combinações de filtros como visualizações reutilizáveis.",
        2: "Timeline mostra dependências entre cards quando configuradas.",
        3: "Vistas do board são transversais a todos os projetos do time.",
      },
    },
    boards_client_360: {
      title: "Cliente 360",
      description: "Visão consolidada da saúde de cada cliente/projeto.",
      p: {
        0: "Cliente 360 lista todos os projetos do board com indicadores de saúde: abertos, atrasados, sustentação, status reports.",
        1: "Clique num cliente para ver detalhe: KPIs, cards críticos, módulos ativos e histórico de entregas.",
        2: "Projetada para gestores de conta, líderes de squad e operações que acompanham múltiplos clientes.",
      },
      tips: {
        0: "Acesse em /boards/{slug}/clientes.",
        1: "Filtre por saúde ou período para focar em contas em risco.",
        2: "Pergunte ao Assistente: «Resuma Cliente 360 do board X».",
      },
    },
    boards_settings: {
      title: "Configurações do board",
      description: "Governança, campos, tipos, automação e notificações.",
      p: {
        0: "Configurações em /settings/boards/{slug}: acesso, notificações, automação, campos customizados, tipos de card, funções, quadro e cronograma.",
        1: "Campos customizados do board aplicam-se a todos os projetos ligados. Tipos de card definem workflows específicos.",
        2: "Funções de board controlam quem edita automações, vê métricas sensíveis ou gere playbooks.",
      },
      tips: {
        0: "Auditoria de e-mail rastreia envios automáticos do board.",
        1: "Segredos de automação ficam isolados por board.",
        2: "Playbooks são templates de grafo reutilizáveis.",
        3: "Simule automações antes de publicar em produção.",
      },
    },
    projects_overview: {
      title: "Gerenciar projetos",
      description: "Criação, publicação e estrutura de projetos.",
      p: {
        0: "Projetos vivem dentro de boards (recomendado) ou diretamente no workspace. Cada projeto tem nome, chave (identifier), descrição e membros.",
        1: "A navegação do projeto mostra módulos ativos: Itens, Ciclos, Módulos, Visualizações, Documentação, Recepção, Status Report.",
        2: "Publique projetos para torná-los visíveis a guests ou despublique para restringir acesso.",
      },
      tips: {
        0: "Chave do projeto aparece nos cards: OPZ-123.",
        1: "Overview do projeto resume progresso e membros ativos.",
        2: "Templates de projeto aceleram setup de novos clientes.",
      },
    },
    projects_features: {
      title: "Módulos do projeto",
      description: "Ciclos, módulos, páginas, intake e mais.",
      p: {
        0: "Itens: lista/kanban de todos os cards do projeto. Núcleo de qualquer projeto.",
        1: "Ciclos: sprints com datas, escopo e burndown. Módulos: agrupamentos de features (ex.: «Checkout v2»).",
        2: "Pages: wiki/documentação rich-text. Intake: formulários de recepção. Status Report: relatórios periódicos de progresso.",
      },
      tips: {
        0: "Desative módulos não usados para simplificar a navegação.",
        1: "Módulos podem ter datas de início/fim e membros dedicados.",
        2: "Pages suportam versões, lock colaborativo e Ask Pi no editor.",
        3: "Intake converte submissões em cards automaticamente.",
        4: "Visualizações salvas são compartilháveis no time.",
      },
    },
    projects_configuration: {
      title: "Configurar projeto",
      description: "Estados, etiquetas, estimativas e features.",
      p: {
        0: "Configurações do projeto: estados (workflow), prioridades, etiquetas, estimativas, tipos de card e membros.",
        1: "Estados definem o fluxo kanban — crie grupos (backlog, unstarted, started, completed, cancelled).",
      },
      tips: {
        0: "Automações de projeto complementam (não substituem) automações de board.",
        1: "Exporte dados do projeto para backup ou migração.",
        2: "Arquive projetos concluídos em vez de excluir.",
      },
    },
    work_items_manage: {
      title: "Gerenciar cards",
      description: "Criar, editar, mover e colaborar em work items.",
      p: {
        0: "Crie cards pelo botão «Novo item», Power K ou duplicando existentes. O modal de card centraliza todas as propriedades.",
        1: "Comentários, menções (@), anexos e histórico de atividade ficam no painel do card.",
        2: "Mova cards entre projetos, ciclos e módulos conforme o trabalho evolui.",
      },
      tips: {
        0: "Atalho C cria card no contexto do projeto atual.",
        1: "Use relações entre cards para dependências e bloqueios.",
        2: "Bulk operations permitem editar vários cards de uma vez.",
        3: "IA no modal ajuda a redigir descrições.",
      },
    },
    work_items_properties: {
      title: "Propriedades do card",
      description: "Status, prioridade, responsáveis, datas e campos custom.",
      p: {
        0: "Propriedades padrão: título, descrição, status, prioridade, responsáveis, datas (início/alvo), etiquetas, estimativa.",
        1: "Campos customizados do board/projeto aparecem como propriedades adicionais (texto, número, select, data).",
        2: "Tipos de card podem ter workflows e campos específicos (bug vs. história vs. sustentação).",
      },
      tips: {
        0: "Prioridade: urgente, alta, média, baixa, nenhuma.",
        1: "Target date alimenta alertas de atraso no overview e Cliente 360.",
        2: "Subscribers recebem notificações de mudanças no card.",
        3: "Versões de descrição permitem ver edições anteriores.",
      },
    },
    work_items_filters: {
      title: "Filtros e visualizações",
      description: "Encontre e organize cards com filtros poderosos.",
      p: {
        0: "Filtre por status, responsável, etiqueta, prioridade, data, módulo, ciclo e campos custom.",
        1: "Salve filtros como visualizações nomeadas — pessoais ou compartilhadas com o time.",
      },
      tips: {
        0: "Workspace views agregam cards de todos os projetos.",
        1: "«Seu trabalho» mostra cards atribuídos a você.",
        2: "Combine filtros com agrupamento para standups eficientes.",
      },
    },
    work_items_drafts: {
      title: "Rascunhos",
      description: "Salve trabalho incompleto antes de publicar.",
      p: {
        0: "Cards em rascunho ficam em /drafts — visíveis só para você até publicar.",
        1: "Útil para capturar ideias rapidamente sem poluir o backlog do time.",
      },
      tips: {
        0: "O contador de rascunhos aparece na sidebar.",
        1: "Publique quando título e projeto estiverem definidos.",
      },
    },
    planning_cycles: {
      title: "Ciclos",
      description: "Planeje trabalho em sprints com datas e escopo.",
      p: {
        0: "Ciclos são períodos de tempo (sprints) com conjunto de cards. Cada ciclo tem início, fim e status (draft, current, upcoming, completed).",
        1: "Burndown e progresso mostram se o ciclo está no trilho.",
        2: "Cards podem pertencer a um ciclo por vez; mova entre ciclos conforme replanejamento.",
      },
      tips: {
        0: "Active Cycles no workspace lista ciclos em andamento de todos os projetos.",
        1: "Feche ciclos concluídos para histórico limpo.",
        2: "Use módulos junto com ciclos para escopo por feature.",
      },
    },
    planning_modules: {
      title: "Módulos",
      description: "Agrupe cards por feature ou entrega.",
      p: {
        0: "Módulos representam blocos de entrega (ex.: «API v2», «Onboarding»). Têm datas, membros, status e progresso próprio.",
        1: "Um card pode estar em múltiplos módulos. A vista de módulo filtra cards associados.",
        2: "Status reports podem ser gerados por módulo.",
      },
      tips: {
        0: "Módulos aparecem no Cliente 360 como indicador de escopo ativo.",
        1: "Arraste cards para módulos no modal ou via Power K.",
        2: "Arquive módulos entregues.",
      },
    },
    planning_views: {
      title: "Visualizações",
      description: "Vistas salvas com filtros personalizados.",
      p: {
        0: "Visualizações capturam filtros, ordenação e display options. Podem ser privadas ou compartilhadas.",
        1: "Workspace views cobrem todos os projetos; project views são locais.",
      },
      tips: {
        0: "Crie vista «Bugs críticos» com filtro prioridade=urgente + tipo=bug.",
        1: "Fixe visualizações favoritas na sidebar.",
        2: "Exporte resultados de vistas filtradas quando necessário.",
      },
    },
    planning_stickies: {
      title: "Anotações",
      description: "Notas rápidas pessoais no workspace.",
      p: {
        0: "Stickies são post-its digitais para lembretes, ideias e rascunhos não estruturados.",
        1: "Organize em grid, busque por texto e fixe os importantes.",
      },
      tips: {
        0: "Acesse em /stickies pela sidebar.",
        1: "Stickies são pessoais — não substituem cards do time.",
      },
    },
    knowledge_pages: {
      title: "Páginas e documentação",
      description: "Wiki rich-text por projeto.",
      p: {
        0: "Pages são documentos colaborativos com editor de blocos, tabelas, imagens e código.",
        1: "Suportam versões, comentários inline, lock de edição e estrutura hierárquica (páginas aninhadas).",
        2: "Ask Pi no editor: IA auxilia redação e resumo de conteúdo.",
      },
      tips: {
        0: "O Assistente Operoz busca em páginas com a tool search_pages.",
        1: "Use páginas para runbooks, specs e decisões de arquitetura.",
        2: "Exporte páginas quando necessário para compartilhamento externo.",
      },
    },
    knowledge_status_report: {
      title: "Status Report",
      description: "Relatórios periódicos de progresso do projeto.",
      p: {
        0: "Status Report consolida avanço por módulo/ciclo em formato executivo.",
        1: "Ideal para comunicação com stakeholders e rituais de reporte semanal.",
      },
      tips: {
        0: "Cliente 360 agrega status reports de todos os projetos do board.",
        1: "Combine com automações para envio automático por e-mail.",
      },
    },
    knowledge_intake: {
      title: "Recepção (Intake)",
      description: "Formulários para capturar solicitações externas.",
      p: {
        0: "Intake permite criar formulários públicos ou internos que geram cards no projeto.",
        1: "Submissões passam por triagem antes de virar trabalho formal.",
        2: "O Assistente lista intake pendente com list_intake_pending.",
      },
      tips: {
        0: "Configure campos do formulário conforme tipo de solicitação.",
        1: "Automatize notificação ao time quando nova submissão chegar.",
        2: "Intake por e-mail também é suportado em configurações avançadas.",
      },
    },
    automation_overview: {
      title: "Visão geral da automação",
      description: "Motor de regras visuais por board.",
      p: {
        0: "Automações reagem a eventos (card criado, status mudou, cron diário) e executam ações (e-mail, webhook, script, notificação).",
        1: "Cada regra é um grafo direcionado: nós de trigger, filter e action conectados por arestas.",
        2: "Execuções são assíncronas (Celery + outbox) com retry, logs e métricas.",
      },
      tips: {
        0: "Comece com automações simples: «quando status = Concluído, notificar responsável».",
        1: "Use filtros para restringir a projetos ou tipos de card específicos.",
        2: "Desative regras em vez de excluir — preserva histórico.",
        3: "Catálogo de nós inclui triggers, filters e actions pré-definidos.",
      },
    },
    automation_canvas: {
      title: "Canvas e regras",
      description: "Construa grafos de automação visualmente.",
      p: {
        0: "O canvas permite arrastar nós da paleta, conectar saídas a entradas e configurar cada nó.",
        1: "Validação impede publicar grafos inválidos (ciclos, nós órfãos, parâmetros faltando).",
        2: "Simulação executa dry-run com card de teste sem efeitos colaterais.",
      },
      tips: {
        0: "Nomeie regras de forma descritiva: «Alerta SLA sustentação».",
        1: "Scripts rodam em sandbox com timeout e lista de imports permitidos.",
        2: "Webhooks suportam retry e assinatura HMAC.",
        3: "O Assistente pode propor grafos em linguagem natural.",
      },
    },
    automation_playbooks: {
      title: "Playbooks e hooks",
      description: "Templates reutilizáveis e governança Pre/Post.",
      p: {
        0: "Playbooks são grafos template instaláveis por board — aceleram setup de fluxos comuns.",
        1: "Hooks Pre/Post action interceptam execuções para auditoria, bloqueio ou enriquecimento.",
      },
      tips: {
        0: "Políticas definem quais ações exigem aprovação manual.",
        1: "Board playbooks em /settings/boards/{slug}/playbooks.",
        2: "Exporte playbooks para reutilizar em outros boards.",
      },
    },
    automation_metrics: {
      title: "Métricas e debug",
      description: "Monitore execuções, falhas e performance.",
      p: {
        0: "Histórico de runs mostra cada execução com step_logs JSON detalhado.",
        1: "Métricas agregam taxa de sucesso, latência e volume por período.",
      },
      tips: {
        0: "Falhas recentes em /settings/boards/{slug}/automacao/falhas.",
        1: "O Assistente explica runs com explain_automation_run.",
        2: "Configure alertas para taxa de falha acima de threshold.",
      },
    },
    ai_assistant: {
      title: "Assistente Operoz",
      description: "Chat com IA fundamentada em dados reais.",
      p: {
        0: "O assistente responde perguntas sobre cards, páginas, Cliente 360, intake e automações consultando a API com suas permissões.",
        1: "Sessões persistentes mantêm histórico. Selecione contexto de board/projeto para precisão.",
        2: "Respostas incluem citações clicáveis (cards, páginas, runs de automação).",
      },
      tips: {
        0: "Exemplos: «Cards atrasados no board as-a-service», «Conteúdo da página X».",
        1: "Feedback thumbs up/down melhora qualidade ao longo do tempo.",
        2: "Requer LLM configurado na instância — senão exibe mensagem clara.",
        3: "Tools: search_issues, get_client_360_summary, propose_automation_rule, etc.",
      },
    },
    ai_automation: {
      title: "IA para automação",
      description: "Proponha e explique regras com linguagem natural.",
      p: {
        0: "Descreva em português o que a automação deve fazer — o assistente gera grafo, valida e opcionalmente simula.",
        1: "explain_automation_run traduz step_logs técnicos em narrativa compreensível.",
      },
      tips: {
        0: "Sempre revise o grafo proposto antes de publicar.",
        1: "Dry-run é padrão em propostas de automação.",
        2: "Combine IA com playbooks manuais para fluxos críticos.",
      },
    },
    analytics_overview: {
      title: "Analytics",
      description: "Métricas de trabalho e operação.",
      p: {
        0: "Analytics do workspace mostra distribuição de cards, lead time, throughput e tendências.",
        1: "Analytics de automação por board: sucessos, falhas, timeline de execuções.",
        2: "Filtre por projeto, período e tipo de card.",
      },
      tips: {
        0: "Acesse em /analytics no workspace.",
        1: "Exporte dados para planilhas quando necessário.",
        2: "Correlacione métricas de automação com volume de cards.",
      },
    },
    analytics_dashboards: {
      title: "Dashboards",
      description: "Painéis personalizados na home.",
      p: {
        0: "Dashboards permitem widgets arrastáveis: gráficos, listas, KPIs customizados.",
        1: "Cada usuário pode montar sua home ideal com widgets relevantes ao seu papel.",
      },
      tips: {
        0: "Acesse /dashboards no workspace.",
        1: "Combine widgets de analytics com atalhos de projetos favoritos.",
      },
    },
    communication_inbox: {
      title: "Inbox",
      description: "Central de notificações e menções.",
      p: {
        0: "A Inbox agrega menções, atribuições, comentários e atualizações de cards inscritos.",
        1: "Filtre por lidas/não lidas, menções e tipo de evento.",
        2: "Ícone na barra superior com indicador vermelho de não lidas.",
      },
      tips: {
        0: "Marque como lida em lote para triagem rápida.",
        1: "Clique para ir direto ao card ou comentário.",
        2: "Configure o que gera notificação nas preferências.",
      },
    },
    communication_notifications: {
      title: "Notificações",
      description: "Preferências e canais de alerta.",
      p: {
        0: "Configure notificações por workspace, board e projeto: e-mail, in-app, menções.",
        1: "Inscreva-se em cards específicos para seguir atualizações.",
      },
      tips: {
        0: "Reduza ruído desinscrevendo de cards irrelevantes.",
        1: "Auditoria de e-mail do board em configurações de notificações.",
        2: "Menções (@) sempre geram notificação prioritária.",
      },
    },
    integrations_overview: {
      title: "Visão geral de integrações",
      description: "Conecte o Operoz ao seu ecossistema.",
      p: {
        0: "Integrações nativas: GitHub, GitLab, Slack, Sentry e outras via configurações do workspace.",
        1: "Webhooks de automação disparam sistemas externos em eventos de board.",
      },
      tips: {
        0: "Revise permissões OAuth ao conectar apps externos.",
        1: "Teste webhooks em ambiente de staging primeiro.",
        2: "Documente integrações críticas nas Pages do projeto.",
      },
    },
    integrations_api: {
      title: "API e webhooks",
      description: "REST API e tokens de acesso.",
      p: {
        0: "API REST completa para workspaces, projetos, cards, páginas e automações.",
        1: "Gere API tokens em Configurações → API Tokens com escopo adequado.",
        2: "Webhooks de saída nas automações; webhooks de entrada para criar cards.",
      },
      tips: {
        0: "Use tokens com menor privilégio necessário.",
        1: "Rate limits aplicam-se — consulte documentação da API.",
        2: "Rotacione tokens periodicamente.",
      },
    },
    integrations_mcp: {
      title: "MCP Server",
      description: "Agentes externos (Cursor, Claude) conectados ao Operoz.",
      p: {
        0: "O servidor MCP expõe centenas de ferramentas para agentes de IA consultarem e modificarem dados do Operoz.",
        1: "Configure em .cursor/mcp.json apontando para sua instância. Autentique com token de usuário.",
        2: "MCP respeita permissões do usuário — agentes não bypassam segurança.",
      },
      tips: {
        0: "Ideal para desenvolvimento assistido e automação de backlog.",
        1: "operis_list_operations descobre domínios disponíveis.",
        2: "Combine MCP com Assistente web para usuários finais e devs.",
      },
    },
  },
} as const;
