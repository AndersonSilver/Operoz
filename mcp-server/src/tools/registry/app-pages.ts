import { op } from "./types.js";

const ws = "workspace_slug";
const proj = "project_id";
const page = "page_id";

export const APP_PAGE_OPERATIONS = [
  op("pages", "operis_list_pages_summary", "Resumo de páginas (PRD/docs)", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/pages-summary/`, [ws, proj]),
  op("pages", "operis_list_pages", "Lista páginas do projeto", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/pages/`, [ws, proj]),
  op("pages", "operis_get_page", "Detalhe página", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/`, [ws, proj, page]),
  op("pages", "operis_create_page", "Cria página (PRD, spec, doc)", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/pages/`, [ws, proj], { body: true }),
  op("pages", "operis_update_page", "Atualiza página", "app", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/`, [ws, proj, page], {
    body: true,
  }),
  op("pages", "operis_delete_page", "Remove página", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/`, [ws, proj, page]),
  op("pages", "operis_favorite_page", "Favorita página", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/favorite-pages/{${page}}/`, [ws, proj, page], {
    body: true,
  }),
  op("pages", "operis_unfavorite_page", "Remove favorito", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/favorite-pages/{${page}}/`, [ws, proj, page]),
  op("pages", "operis_archive_page", "Arquiva página", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/archive/`, [ws, proj, page], {
    body: true,
  }),
  op("pages", "operis_unarchive_page", "Desarquiva página", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/archive/`, [ws, proj, page]),
  op("pages", "operis_lock_page", "Bloqueia página", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/lock/`, [ws, proj, page], { body: true }),
  op("pages", "operis_unlock_page", "Desbloqueia página", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/lock/`, [ws, proj, page]),
  op("pages", "operis_set_page_access", "Define acesso público/privado", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/access/`, [ws, proj, page], {
    body: true,
  }),
  op("pages", "operis_get_page_description", "Descrição da página", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/description/`, [ws, proj, page]),
  op("pages", "operis_update_page_description", "Atualiza descrição (conteúdo PRD)", "app", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/description/`, [
    ws,
    proj,
    page,
  ], { body: true }),
  op("pages", "operis_list_page_versions", "Versões da página", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/versions/`, [ws, proj, page]),
  op("pages", "operis_get_page_version", "Detalhe versão", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/versions/{pk}/`, [ws, proj, page, "pk"]),
  op("pages", "operis_duplicate_page", "Duplica página", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/duplicate/`, [ws, proj, page], {
    body: true,
  }),
];
