/** Conteúdo do Manual Operoz — estrutura inspirada em https://docs.plane.so/ */
import { operozManualBoardsProjects } from "./operoz-manual-sections/boards-projects";
import { operozManualGetStartedWorkspace } from "./operoz-manual-sections/get-started-workspace";
import { operozManualKnowledgeIntegrations } from "./operoz-manual-sections/knowledge-integrations";
import { operozManualWorkPlanning } from "./operoz-manual-sections/work-planning";

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
        description: "Documente com páginas rich-text, status reports e formulários de sustentação.",
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
  steps_label: "Passo a passo",
  tips_label: "Dicas práticas",
  footer: "Operoz — Plataforma Operacional Inteligente.",
  article_not_found: "Página não encontrada na documentação.",
  back_to_home: "Voltar ao início",
  prev_article: "Anterior",
  next_article: "Próximo",
  pagination_label: "Navegação entre artigos",
  articles: {
    ...operozManualGetStartedWorkspace,
    ...operozManualBoardsProjects,
    ...operozManualWorkPlanning,
    ...operozManualKnowledgeIntegrations,
  },
} as const;
