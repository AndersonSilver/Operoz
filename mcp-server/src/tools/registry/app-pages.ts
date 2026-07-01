import { op } from "./types.js";

const ws = "workspace_slug";
const proj = "project_id";
const page = "page_id";

export const APP_PAGE_OPERATIONS = [
  op(
    "pages",
    "operoz_list_pages_summary",
    "Resumo de páginas (PRD/docs)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages-summary/`,
    [ws, proj]
  ),
  op(
    "pages",
    "operoz_list_pages",
    "Lista páginas do projeto",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/`,
    [ws, proj]
  ),
  op(
    "pages",
    "operoz_get_page",
    "Detalhe página",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/`,
    [ws, proj, page]
  ),
  op(
    "pages",
    "operoz_create_page",
    "Cria página (PRD, spec, doc)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "pages",
    "operoz_update_page",
    "Atualiza página",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/`,
    [ws, proj, page],
    {
      body: true,
    }
  ),
  op(
    "pages",
    "operoz_delete_page",
    "Remove página",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/`,
    [ws, proj, page]
  ),
  op(
    "pages",
    "operoz_favorite_page",
    "Favorita página",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/favorite-pages/{${page}}/`,
    [ws, proj, page],
    {
      body: true,
    }
  ),
  op(
    "pages",
    "operoz_unfavorite_page",
    "Remove favorito",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/favorite-pages/{${page}}/`,
    [ws, proj, page]
  ),
  op(
    "pages",
    "operoz_archive_page",
    "Arquiva página",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/archive/`,
    [ws, proj, page],
    {
      body: true,
    }
  ),
  op(
    "pages",
    "operoz_unarchive_page",
    "Desarquiva página",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/archive/`,
    [ws, proj, page]
  ),
  op(
    "pages",
    "operoz_lock_page",
    "Bloqueia página",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/lock/`,
    [ws, proj, page],
    { body: true }
  ),
  op(
    "pages",
    "operoz_unlock_page",
    "Desbloqueia página",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/lock/`,
    [ws, proj, page]
  ),
  op(
    "pages",
    "operoz_set_page_access",
    "Define acesso público/privado",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/access/`,
    [ws, proj, page],
    {
      body: true,
    }
  ),
  op(
    "pages",
    "operoz_get_page_description",
    "Descrição da página",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/description/`,
    [ws, proj, page]
  ),
  op(
    "pages",
    "operoz_update_page_description",
    "Atualiza descrição (conteúdo PRD)",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/description/`,
    [ws, proj, page],
    { body: true }
  ),
  op(
    "pages",
    "operoz_list_page_versions",
    "Versões da página",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/versions/`,
    [ws, proj, page]
  ),
  op(
    "pages",
    "operoz_get_page_version",
    "Detalhe versão",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/versions/{pk}/`,
    [ws, proj, page, "pk"]
  ),
  op(
    "pages",
    "operoz_duplicate_page",
    "Duplica página",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/duplicate/`,
    [ws, proj, page],
    {
      body: true,
    }
  ),
  op(
    "pages",
    "operoz_create_prd_review_session",
    "Cria sessão de review PRD (convite cliente)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/review-sessions/`,
    [ws, proj, page],
    { body: true }
  ),
  op(
    "pages",
    "operoz_list_prd_review_sessions",
    "Lista sessões de review PRD da página",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/review-sessions/`,
    [ws, proj, page]
  ),
  op(
    "pages",
    "operoz_get_prd_review_status",
    "Detalhe sessão review PRD (status, comentários, convites)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/review-sessions/{session_id}/`,
    [ws, proj, page, "session_id"]
  ),
  op(
    "pages",
    "operoz_add_prd_review_invites",
    "Adiciona convites e-mail à sessão review PRD",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/review-sessions/{session_id}/invites/`,
    [ws, proj, page, "session_id"],
    { body: true }
  ),
  op(
    "pages",
    "operoz_list_prd_review_comments",
    "Lista comentários da sessão review PRD (via detalhe sessão)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/pages/{${page}}/review-sessions/{session_id}/`,
    [ws, proj, page, "session_id"]
  ),
];
