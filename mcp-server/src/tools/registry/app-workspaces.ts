import { op } from "./types.js";

export const APP_WORKSPACE_OPERATIONS = [
  op(
    "members",
    "operoz_add_project_member_app",
    "Adiciona membro (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/members/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_check_workspace_slug",
    "Verifica slug disponível",
    "app",
    "GET",
    "/workspace-slug-check/",
    []
  ),
  op(
    "workspaces",
    "operoz_create_draft_issue",
    "Cria rascunho",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/draft-issues/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_create_quick_link",
    "Cria quick link",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/quick-links/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_create_user_favorite",
    "Adiciona favorito",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/user-favorites/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_create_workspace",
    "Cria workspace",
    "app",
    "POST",
    "/workspaces/",
    [], { body: true }
  ),
  op(
    "workspaces",
    "operoz_create_workspace_invitation",
    "Cria convite",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/invitations/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_delete_draft_issue",
    "Remove rascunho",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/draft-issues/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_delete_quick_link",
    "Remove quick link",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/quick-links/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_delete_user_favorite",
    "Remove favorito",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/user-favorites/{favorite_id}/",
    ["workspace_slug","favorite_id"]
  ),
  op(
    "workspaces",
    "operoz_delete_workspace",
    "Remove workspace",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_delete_workspace_invitation",
    "Remove convite",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/invitations/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_draft_to_issue",
    "Converte rascunho em issue",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/draft-to-issue/{draft_id}/",
    ["workspace_slug","draft_id"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_export_issues",
    "Exporta issues",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/export-issues/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_export_issues_get",
    "Export Issues (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/export-issues/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_export_workspace_user_activity_post",
    "Export Workspace User Activity (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/user-activity/{user_id}/export/",
    ["workspace_slug","user_id"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_get_home_preferences",
    "Preferências home",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/home-preferences/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_get_recent_visits",
    "Visitas recentes",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/recent-visits/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_get_sidebar_preferences",
    "Sidebar",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/sidebar-preferences/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_get_workspace",
    "Detalhe workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_get_workspace_cycles",
    "Ciclos workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/cycles/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_get_workspace_estimates",
    "Estimativas workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/estimates/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_get_workspace_invitation",
    "Detalhe convite",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/invitations/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_get_workspace_labels",
    "Labels workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/labels/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_get_workspace_member",
    "Detalhe membro",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/members/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_get_workspace_modules",
    "Módulos workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/modules/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_get_workspace_states",
    "Estados workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/states/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_join_workspace",
    "Aceita convite",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/invitations/{pk}/join/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "members",
    "operoz_leave_project",
    "Sair do projeto",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/members/leave/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_leave_workspace",
    "Sair do workspace",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/members/leave/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_list_draft_issues",
    "Rascunhos de issues",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/draft-issues/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_list_my_workspace_invitations",
    "Meus convites",
    "app",
    "GET",
    "/users/me/workspaces/invitations/",
    []
  ),
  op(
    "workspaces",
    "operoz_list_my_workspaces",
    "Meus workspaces",
    "app",
    "GET",
    "/users/me/workspaces/",
    []
  ),
  op(
    "members",
    "operoz_list_project_members_app",
    "Membros projeto (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/members/",
    ["workspace_slug","project_id"]
  ),
  op(
    "workspaces",
    "operoz_list_project_members_workspace",
    "Membros de projetos",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/project-members/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_list_quick_links",
    "Quick links",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/quick-links/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_list_user_favorites",
    "Favoritos",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-favorites/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_list_workspace_invitations",
    "Convites workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/invitations/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_list_workspace_members_app",
    "Membros (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/members/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_list_workspaces",
    "Lista workspaces",
    "app",
    "GET",
    "/workspaces/",
    []
  ),
  op(
    "workspaces",
    "operoz_quick_link_retrieve_get",
    "Quick Link — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/quick-links/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_remove_workspace_member",
    "Remove membro",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/members/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_update_draft_issue",
    "Atualiza rascunho",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/draft-issues/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_update_home_preferences",
    "Atualiza home",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/home-preferences/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_update_quick_link",
    "Atualiza quick link",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/quick-links/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_update_sidebar_preferences",
    "Atualiza sidebar",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/sidebar-preferences/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_update_user_favorite",
    "Atualiza favorito",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/user-favorites/{favorite_id}/",
    ["workspace_slug","favorite_id"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_update_workspace",
    "Atualiza workspace",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_update_workspace_invitation",
    "Atualiza convite",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/invitations/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_update_workspace_member",
    "Atualiza membro",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/members/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_user_last_project_with_workspace_get",
    "User Last Project With Workspace (Consulta)",
    "app",
    "GET",
    "/users/last-visited-workspace/",
    []
  ),
  op(
    "workspaces",
    "operoz_user_workspace_invitations_create_post",
    "User Workspace Invitations — create (Executa)",
    "app",
    "POST",
    "/users/me/workspaces/invitations/",
    [], { body: true }
  ),
  op(
    "workspaces",
    "operoz_work_space_update_put",
    "Work Space — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_draft_issue_retrieve_get",
    "Workspace Draft Issue — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/draft-issues/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_delete",
    "Workspace Favorite (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/user-favorites/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_get",
    "Workspace Favorite (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-favorites/{favorite_id}/",
    ["workspace_slug","favorite_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_group_get",
    "Workspace Favorite Group (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-favorites/{favorite_id}/group/",
    ["workspace_slug","favorite_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_patch",
    "Workspace Favorite (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/user-favorites/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_post",
    "Workspace Favorite (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/user-favorites/{favorite_id}/",
    ["workspace_slug","favorite_id"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_home_preference_view_set_get",
    "WorkspaceHomePreferenceViewSet (GET)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/home-preferences/{key}/",
    ["workspace_slug","key"]
  ),
  op(
    "workspaces",
    "operoz_workspace_home_preference_view_set_patch",
    "WorkspaceHomePreferenceViewSet (PATCH)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/home-preferences/{key}/",
    ["workspace_slug","key"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_jira_ops_jira_projects_get",
    "Workspace Jira Ops Jira Projects (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/jira-ops-sync/jira-projects/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_jira_ops_oauth_complete_post",
    "Workspace Jira Ops OAuth Complete (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/jira-ops-sync/oauth/complete/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_jira_ops_oauth_sites_get",
    "Workspace Jira Ops OAuth Sites (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/jira-ops-sync/oauth/sites/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_jira_ops_sync_post",
    "Workspace Jira Ops Sync (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/jira-ops-sync/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_join_get",
    "Workspace Join (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/invitations/{pk}/join/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_workspace_member_user_get",
    "Workspace Member User (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/workspace-members/me/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_member_user_views_post",
    "Workspace Member User Views (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/workspace-views/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_sticky_retrieve_get",
    "Workspace Sticky — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/stickies/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_create_post",
    "Workspace Theme — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/workspace-themes/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_destroy_delete",
    "Workspace Theme — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/workspace-themes/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_list_get",
    "Workspace Theme — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/workspace-themes/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_partial_update_patch",
    "Workspace Theme — partial update (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/workspace-themes/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_retrieve_get",
    "Workspace Theme — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/workspace-themes/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "workspaces",
    "operoz_workspace_transfer_ownership_post",
    "Workspace Transfer Ownership (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/transfer-ownership/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_user_activity_get",
    "Workspace User Activity (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-activity/{user_id}/",
    ["workspace_slug","user_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_profile_get",
    "Workspace User Profile (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-profile/{user_id}/",
    ["workspace_slug","user_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_profile_issues_get",
    "Workspace User Profile Issues (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-issues/{user_id}/",
    ["workspace_slug","user_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_profile_stats_get",
    "Workspace User Profile Stats (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-stats/{user_id}/",
    ["workspace_slug","user_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_properties_get",
    "Workspace User Properties (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-properties/",
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_properties_patch",
    "Workspace User Properties (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/user-properties/",
    ["workspace_slug"], { body: true }
  ),
];
