import { op } from "./types.js";

export const APP_PAGE_OPERATIONS = [
  op(
    "pages",
    "operoz_add_prd_review_invites",
    "Adiciona convites e-mail à sessão review PRD",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/review-sessions/{session_id}/invites/",
    ["workspace_slug","project_id","page_id","session_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_archive_page",
    "Arquiva página",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/archive/",
    ["workspace_slug","project_id","page_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_assistant_page_index_status_get",
    "Assistant Page Index Status (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/assistant-index-status/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_create_page",
    "Cria página (PRD, spec, doc)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_create_prd_review_session",
    "Cria sessão de review PRD (convite cliente)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/review-sessions/",
    ["workspace_slug","project_id","page_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_delete_page",
    "Remove página",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_duplicate_page",
    "Duplica página",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/duplicate/",
    ["workspace_slug","project_id","page_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_favorite_page",
    "Favorita página",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/favorite-pages/{page_id}/",
    ["workspace_slug","project_id","page_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_get_page",
    "Detalhe página",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_get_page_description",
    "Descrição da página",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/description/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_get_page_version",
    "Detalhe versão",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/versions/{pk}/",
    ["workspace_slug","project_id","page_id","pk"]
  ),
  op(
    "pages",
    "operoz_get_prd_review_status",
    "Detalhe sessão review PRD (status, comentários, convites)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/review-sessions/{session_id}/",
    ["workspace_slug","project_id","page_id","session_id"]
  ),
  op(
    "pages",
    "operoz_list_page_versions",
    "Versões da página",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/versions/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_list_pages",
    "Lista páginas do projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/",
    ["workspace_slug","project_id"]
  ),
  op(
    "pages",
    "operoz_list_pages_summary",
    "Resumo de páginas (PRD/docs)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages-summary/",
    ["workspace_slug","project_id"]
  ),
  op(
    "pages",
    "operoz_list_prd_review_comments",
    "Lista comentários da sessão review PRD (via detalhe sessão)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/review-sessions/{session_id}/",
    ["workspace_slug","project_id","page_id","session_id"]
  ),
  op(
    "pages",
    "operoz_list_prd_review_sessions",
    "Lista sessões de review PRD da página",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/review-sessions/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_lock_page",
    "Bloqueia página",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/lock/",
    ["workspace_slug","project_id","page_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_set_page_access",
    "Define acesso público/privado",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/access/",
    ["workspace_slug","project_id","page_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_unarchive_page",
    "Desarquiva página",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/archive/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_unfavorite_page",
    "Remove favorito",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/favorite-pages/{page_id}/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_unlock_page",
    "Desbloqueia página",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/lock/",
    ["workspace_slug","project_id","page_id"]
  ),
  op(
    "pages",
    "operoz_update_page",
    "Atualiza página",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/",
    ["workspace_slug","project_id","page_id"], { body: true }
  ),
  op(
    "pages",
    "operoz_update_page_description",
    "Atualiza descrição (conteúdo PRD)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/description/",
    ["workspace_slug","project_id","page_id"], { body: true }
  ),
];
