import { op } from "./types.js";

export const APP_ANALYTICS_OPERATIONS = [
  op(
    "analytics",
    "operoz_advance_analytics_chart_get",
    "Advance Analytics Chart (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/advance-analytics-charts/",
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_advance_analytics_stats_get",
    "Advance Analytics Stats (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/advance-analytics-stats/",
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_analytic_view_viewset_retrieve_get",
    "AnalyticViewViewset.retrieve (GET)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/analytic-view/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "analytics",
    "operoz_create_analytic_view",
    "Cria vista analítica",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/analytic-view/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "analytics",
    "operoz_delete_analytic_view",
    "Remove vista",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/analytic-view/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "analytics",
    "operoz_export_analytics",
    "Exporta analytics",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/export-analytics/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "analytics",
    "operoz_get_advance_analytics",
    "Analytics avançado",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/advance-analytics/",
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_get_default_analytics",
    "Analytics default",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/default-analytics/",
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_get_project_advance_analytics",
    "Analytics avançado projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/advance-analytics/",
    ["workspace_slug","project_id"]
  ),
  op(
    "analytics",
    "operoz_get_project_stats",
    "Estatísticas projetos",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/project-stats/",
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_get_workspace_analytics",
    "Analytics workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/analytics/",
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_list_analytic_views",
    "Vistas analíticas",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/analytic-view/",
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_project_advance_analytics_chart_get",
    "Project Advance Analytics Chart (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/advance-analytics-charts/",
    ["workspace_slug","project_id"]
  ),
  op(
    "analytics",
    "operoz_project_advance_analytics_stats_get",
    "Project Advance Analytics Stats (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/advance-analytics-stats/",
    ["workspace_slug","project_id"]
  ),
  op(
    "analytics",
    "operoz_saved_analytic_get",
    "Saved Analytic (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/saved-analytic-view/{analytic_id}/",
    ["workspace_slug","analytic_id"]
  ),
  op(
    "analytics",
    "operoz_update_analytic_view",
    "Atualiza vista",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/analytic-view/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
];
