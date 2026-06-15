export type DocsArticle = {
  slug: string;
  articleKey: string;
  paragraphCount: number;
  tipCount?: number;
};

export type DocsCategory = {
  key: string;
  labelKey: string;
  homeDescriptionKey: string;
  homeLinkKey: string;
  articles: DocsArticle[];
};

export const OPEROZ_DOCS_CATEGORIES: DocsCategory[] = [
  {
    key: "get-started",
    labelKey: "operoz_manual.nav.get_started",
    homeDescriptionKey: "operoz_manual.home.cards.get_started.description",
    homeLinkKey: "operoz_manual.home.cards.get_started.link",
    articles: [
      { slug: "introduction", articleKey: "get_started_introduction", paragraphCount: 3, tipCount: 3 },
      { slug: "quickstart", articleKey: "get_started_quickstart", paragraphCount: 4, tipCount: 4 },
      { slug: "core-concepts", articleKey: "get_started_core_concepts", paragraphCount: 3, tipCount: 4 },
    ],
  },
  {
    key: "workspace",
    labelKey: "operoz_manual.nav.workspace",
    homeDescriptionKey: "operoz_manual.home.cards.workspace.description",
    homeLinkKey: "operoz_manual.home.cards.workspace.link",
    articles: [
      { slug: "overview", articleKey: "workspace_overview", paragraphCount: 3, tipCount: 3 },
      { slug: "members", articleKey: "workspace_members", paragraphCount: 3, tipCount: 3 },
      { slug: "power-k", articleKey: "workspace_power_k", paragraphCount: 3, tipCount: 3 },
      { slug: "navigation", articleKey: "workspace_navigation", paragraphCount: 2, tipCount: 3 },
      { slug: "roles", articleKey: "workspace_roles", paragraphCount: 3, tipCount: 3 },
    ],
  },
  {
    key: "boards",
    labelKey: "operoz_manual.nav.boards",
    homeDescriptionKey: "operoz_manual.home.cards.boards.description",
    homeLinkKey: "operoz_manual.home.cards.boards.link",
    articles: [
      { slug: "overview", articleKey: "boards_overview", paragraphCount: 3, tipCount: 4 },
      { slug: "views", articleKey: "boards_views", paragraphCount: 3, tipCount: 4 },
      { slug: "client-360", articleKey: "boards_client_360", paragraphCount: 3, tipCount: 3 },
      { slug: "settings", articleKey: "boards_settings", paragraphCount: 3, tipCount: 4 },
    ],
  },
  {
    key: "projects",
    labelKey: "operoz_manual.nav.projects",
    homeDescriptionKey: "operoz_manual.home.cards.projects.description",
    homeLinkKey: "operoz_manual.home.cards.projects.link",
    articles: [
      { slug: "overview", articleKey: "projects_overview", paragraphCount: 3, tipCount: 3 },
      { slug: "features", articleKey: "projects_features", paragraphCount: 3, tipCount: 5 },
      { slug: "configuration", articleKey: "projects_configuration", paragraphCount: 2, tipCount: 3 },
    ],
  },
  {
    key: "work-items",
    labelKey: "operoz_manual.nav.work_items",
    homeDescriptionKey: "operoz_manual.home.cards.work_items.description",
    homeLinkKey: "operoz_manual.home.cards.work_items.link",
    articles: [
      { slug: "manage", articleKey: "work_items_manage", paragraphCount: 3, tipCount: 4 },
      { slug: "properties", articleKey: "work_items_properties", paragraphCount: 3, tipCount: 4 },
      { slug: "filters", articleKey: "work_items_filters", paragraphCount: 2, tipCount: 3 },
      { slug: "drafts", articleKey: "work_items_drafts", paragraphCount: 2, tipCount: 2 },
    ],
  },
  {
    key: "planning",
    labelKey: "operoz_manual.nav.planning",
    homeDescriptionKey: "operoz_manual.home.cards.planning.description",
    homeLinkKey: "operoz_manual.home.cards.planning.link",
    articles: [
      { slug: "cycles", articleKey: "planning_cycles", paragraphCount: 3, tipCount: 3 },
      { slug: "modules", articleKey: "planning_modules", paragraphCount: 3, tipCount: 3 },
      { slug: "views", articleKey: "planning_views", paragraphCount: 2, tipCount: 3 },
      { slug: "stickies", articleKey: "planning_stickies", paragraphCount: 2, tipCount: 2 },
    ],
  },
  {
    key: "knowledge",
    labelKey: "operoz_manual.nav.knowledge",
    homeDescriptionKey: "operoz_manual.home.cards.knowledge.description",
    homeLinkKey: "operoz_manual.home.cards.knowledge.link",
    articles: [
      { slug: "pages", articleKey: "knowledge_pages", paragraphCount: 3, tipCount: 3 },
      { slug: "status-report", articleKey: "knowledge_status_report", paragraphCount: 2, tipCount: 2 },
      { slug: "intake", articleKey: "knowledge_intake", paragraphCount: 3, tipCount: 3 },
    ],
  },
  {
    key: "automation",
    labelKey: "operoz_manual.nav.automation",
    homeDescriptionKey: "operoz_manual.home.cards.automation.description",
    homeLinkKey: "operoz_manual.home.cards.automation.link",
    articles: [
      { slug: "overview", articleKey: "automation_overview", paragraphCount: 3, tipCount: 4 },
      { slug: "canvas", articleKey: "automation_canvas", paragraphCount: 3, tipCount: 4 },
      { slug: "playbooks", articleKey: "automation_playbooks", paragraphCount: 2, tipCount: 3 },
      { slug: "metrics", articleKey: "automation_metrics", paragraphCount: 2, tipCount: 3 },
    ],
  },
  {
    key: "ai",
    labelKey: "operoz_manual.nav.ai",
    homeDescriptionKey: "operoz_manual.home.cards.ai.description",
    homeLinkKey: "operoz_manual.home.cards.ai.link",
    articles: [
      { slug: "assistant", articleKey: "ai_assistant", paragraphCount: 3, tipCount: 4 },
      { slug: "automation-ai", articleKey: "ai_automation", paragraphCount: 2, tipCount: 3 },
    ],
  },
  {
    key: "analytics",
    labelKey: "operoz_manual.nav.analytics",
    homeDescriptionKey: "operoz_manual.home.cards.analytics.description",
    homeLinkKey: "operoz_manual.home.cards.analytics.link",
    articles: [
      { slug: "overview", articleKey: "analytics_overview", paragraphCount: 3, tipCount: 3 },
      { slug: "dashboards", articleKey: "analytics_dashboards", paragraphCount: 2, tipCount: 2 },
    ],
  },
  {
    key: "communication",
    labelKey: "operoz_manual.nav.communication",
    homeDescriptionKey: "operoz_manual.home.cards.communication.description",
    homeLinkKey: "operoz_manual.home.cards.communication.link",
    articles: [
      { slug: "inbox", articleKey: "communication_inbox", paragraphCount: 3, tipCount: 3 },
      { slug: "notifications", articleKey: "communication_notifications", paragraphCount: 2, tipCount: 3 },
    ],
  },
  {
    key: "integrations",
    labelKey: "operoz_manual.nav.integrations",
    homeDescriptionKey: "operoz_manual.home.cards.integrations.description",
    homeLinkKey: "operoz_manual.home.cards.integrations.link",
    articles: [
      { slug: "overview", articleKey: "integrations_overview", paragraphCount: 2, tipCount: 3 },
      { slug: "api", articleKey: "integrations_api", paragraphCount: 3, tipCount: 3 },
      { slug: "mcp", articleKey: "integrations_mcp", paragraphCount: 3, tipCount: 3 },
    ],
  },
];

export type FlatDocsArticle = DocsArticle & {
  category: string;
  categoryLabelKey: string;
};

export function flattenDocsArticles(): FlatDocsArticle[] {
  return OPEROZ_DOCS_CATEGORIES.flatMap((category) =>
    category.articles.map((article) => ({
      ...article,
      category: category.key,
      categoryLabelKey: category.labelKey,
    }))
  );
}

export function findDocsArticle(category: string, slug: string): FlatDocsArticle | undefined {
  return flattenDocsArticles().find((a) => a.category === category && a.slug === slug);
}

export function getDocsArticlePath(workspaceSlug: string, category: string, slug: string) {
  return `/${workspaceSlug}/manual/${category}/${slug}`;
}

export function getAdjacentArticles(category: string, slug: string) {
  const flat = flattenDocsArticles();
  const index = flat.findIndex((a) => a.category === category && a.slug === slug);
  if (index < 0) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? flat[index - 1] : undefined,
    next: index < flat.length - 1 ? flat[index + 1] : undefined,
  };
}

export function articleParagraphKey(articleKey: string, index: number) {
  return `operoz_manual.articles.${articleKey}.p.${index}`;
}

export function articleTipKey(articleKey: string, index: number) {
  return `operoz_manual.articles.${articleKey}.tips.${index}`;
}

export function articleTitleKey(articleKey: string) {
  return `operoz_manual.articles.${articleKey}.title`;
}

export function articleDescriptionKey(articleKey: string) {
  return `operoz_manual.articles.${articleKey}.description`;
}
