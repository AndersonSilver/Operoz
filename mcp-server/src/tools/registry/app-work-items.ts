import { op } from "./types.js";

export const APP_WORK_ITEM_OPERATIONS = [
  op(
    "work_items",
    "operoz_archive_issue",
    "Arquiva issue",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/archive/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_bulk_archive_issues",
    "Arquiva issues em massa",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/bulk-archive-issues/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_bulk_create_labels",
    "Cria labels em massa",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/bulk-create-labels/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_bulk_delete_issues",
    "Apaga issues em massa",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/bulk-delete-issues/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_comment_reaction_create_post",
    "Comment Reaction — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/comments/{comment_id}/reactions/",
    ["workspace_slug", "project_id", "comment_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_comment_reaction_destroy_delete",
    "Comment Reaction — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/comments/{comment_id}/reactions/{reaction_code}/",
    ["workspace_slug", "project_id", "comment_id", "reaction_code"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_comment_reaction_list_get",
    "Comment Reaction — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/comments/{comment_id}/reactions/",
    ["workspace_slug", "project_id", "comment_id"]
  ),
  op(
    "work_items",
    "operoz_create_inbox_issue",
    "Cria inbox issue",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/inbox-issues/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_create_intake_issue_app",
    "Abre pedido na fila de entrada (Intake) de desenvolvimento. Use para registrar novas solicitações de desenvolvimento, melhoria ou análise de um cliente/produto. O pedido entra como Pendente e aguarda triagem antes de virar delivery.",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-issues/",
    ["workspace_slug", "project_id"],
    {
      body: true,
      bodySchema: {
        type: "object",
        description: "Pedido de desenvolvimento — coleta os 6 blocos de contexto mínimo antes de enviar.",
        properties: {
          issue: {
            type: "object",
            description: "Dados da issue que será criada na fila de entrada.",
            properties: {
              name: {
                type: "string",
                description: "Título resumido do pedido (obrigatório, máx. 255 caracteres).",
              },
              description_html: {
                type: "string",
                description: [
                  "Descrição em HTML com os 6 blocos de contexto mínimo:",
                  "1. Cliente / produto",
                  "2. Problema de negócio (não a solução — a dor real)",
                  "3. Alternativas já testadas",
                  "4. Compromisso com o cliente (prazo prometido, SLA, expectativa criada)",
                  "5. Impacto conhecido (usuários afetados, receita, urgência)",
                  "6. Evidências / links (tickets, screenshots, gravações — opcional mas recomendado)",
                ].join(" "),
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high", "urgent", "none"],
                description: "Prioridade sugerida pelo solicitante. Default: none.",
              },
            },
            required: ["name"],
          },
        },
        required: ["issue"],
      },
    }
  ),
  op(
    "work_items",
    "operoz_create_issue_app",
    "Cria issue (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_create_issue_comment_app",
    "Comenta (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_create_issue_label_app",
    "Cria label",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_create_issue_link_app",
    "Cria link",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-links/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_create_sub_issue",
    "Cria sub-issue",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/sub-issues/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_delete_issue_app",
    "Remove issue (app)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/",
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_delete_issue_comment_app",
    "Remove comentário",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_delete_issue_link_app",
    "Remove link",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-links/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_get_issue_app",
    "Detalhe issue (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/",
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_get_issue_by_identifier_app",
    "Issue por identificador",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/work-items/{project_identifier}-{issue_identifier}/",
    ["workspace_slug", "project_identifier", "issue_identifier"]
  ),
  op(
    "work_items",
    "operoz_get_issue_custom_fields",
    "Custom fields da issue",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/issues/{issue_id}/custom-fields/",
    ["workspace_slug", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_get_issue_history",
    "Histórico",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/history/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_get_issue_meta",
    "Meta da issue",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/meta/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_archive_retrieve_get",
    "Issue Archive — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/archive/",
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_delete",
    "Issue Attachment (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_delete_2",
    "Issue Attachment (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_get",
    "Issue Attachment (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_get_2",
    "Issue Attachment (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_post",
    "Issue Attachment (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_post_2",
    "Issue Attachment (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_delete",
    "Issue Attachment V2 (Remove)",
    "app",
    "DELETE",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_delete_2",
    "Issue Attachment V2 (Remove)",
    "app",
    "DELETE",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_get",
    "Issue Attachment V2 (Consulta)",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_get_2",
    "Issue Attachment V2 (Consulta)",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_patch",
    "Issue Attachment V2 (Atualiza)",
    "app",
    "PATCH",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_patch_2",
    "Issue Attachment V2 (Atualiza)",
    "app",
    "PATCH",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_post",
    "Issue Attachment V2 (Executa)",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_post_2",
    "Issue Attachment V2 (Executa)",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_bulk_update_date_post",
    "Issue Bulk Update Date (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issue-dates/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_comment_retrieve_get",
    "Issue Comment — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_comment_update_put",
    "Issue Comment — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_detail_identifier_get",
    "Issue Detail Identifier (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/work-items/<str:project_identifier>-<str:issue_identifier>/",
    ["workspace_slug"]
  ),
  op(
    "work_items",
    "operoz_issue_link_retrieve_get",
    "Issue Link — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-links/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_link_update_put",
    "Issue Link — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-links/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_list_get",
    "Issue List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/list/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_issue_reaction_create_post",
    "Issue Reaction — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/reactions/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_reaction_destroy_delete",
    "Issue Reaction — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/reactions/{reaction_code}/",
    ["workspace_slug", "project_id", "issue_id", "reaction_code"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_reaction_list_get",
    "Issue Reaction — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/reactions/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_relation_create_post",
    "Issue Relation — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-relation/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_relation_list_get",
    "Issue Relation — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-relation/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_relation_remove_relation_post",
    "Issue Relation — remove relation (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/remove-relation/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_create_post",
    "Issue Subscriber — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-subscribers/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_destroy_delete",
    "Issue Subscriber — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-subscribers/{subscriber_id}/",
    ["workspace_slug", "project_id", "issue_id", "subscriber_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_list_get",
    "Issue Subscriber — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-subscribers/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_subscribe_post",
    "Issue Subscriber — subscribe (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/subscribe/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_subscription_status_get",
    "Issue Subscriber — subscription status (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/subscribe/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_unsubscribe_delete",
    "Issue Subscriber — unsubscribe (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/subscribe/",
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_update_put",
    "Issue — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_version_get",
    "Issue Version (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/versions/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_label_destroy_delete",
    "Label — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_label_partial_update_patch",
    "Label — partial update (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_label_retrieve_get",
    "Label — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/{pk}/",
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_label_update_put",
    "Label — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_list_archived_issues",
    "Issues arquivadas",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-issues/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_list_deleted_issues",
    "Issues apagadas",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/deleted-issues/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_list_inbox_issues",
    "Inbox issues",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/inbox-issues/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_list_intake_issues_app",
    "Lista pedidos na fila de entrada (Intake) de um projeto. Retorna itens pendentes de triagem, recusados, aceitos e adiados. Use para consultar o estado da fila antes de triar ou converter pedidos.",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-issues/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_list_issue_comments_app",
    "Comentários (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_list_issue_labels_app",
    "Labels issue",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_list_issue_links_app",
    "Links da issue",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-links/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_list_issue_versions",
    "Versões",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/versions/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_list_issues_app",
    "Lista issues (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_list_issues_detail",
    "Issues detalhadas",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues-detail/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_list_issues_v2",
    "Issues v2",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/v2/issues/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_list_sub_issues",
    "Sub-issues",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/sub-issues/",
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_project_user_display_property_get",
    "Project User Display Property (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-properties/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_project_user_display_property_patch",
    "Project User Display Property (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-properties/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_search_project_issues",
    "Pesquisa issues projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/search-issues/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_search_workspace_issues",
    "Pesquisa issues workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/issues/",
    ["workspace_slug"]
  ),
  op(
    "work_items",
    "operoz_unarchive_issue",
    "Desarquiva issue",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/archive/",
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_update_inbox_issue",
    "Atualiza inbox",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/inbox-issues/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_update_intake_issue_app",
    "Triagem de pedido na fila de entrada (Intake): aceitar, recusar, converter para outro projeto, encerrar como consultoria, adiar, ou pedir complemento de informação. Use após operoz_list_intake_issues_app para processar pedidos pendentes.",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-issues/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    {
      body: true,
      bodySchema: {
        type: "object",
        description: "Ação de triagem. Envie apenas os campos relevantes para a ação desejada.",
        properties: {
          status: {
            type: "integer",
            enum: [-2, -1, 0, 1, 2, 3],
            description: [
              "Estado do pedido:",
              "-2 = Pendente (padrão / reabertura),",
              "-1 = Recusado (exige decline_reason + decline_category),",
              " 0 = Adiado / Snoozed (exige snoozed_till),",
              " 1 = Aceito — converte em delivery (use destination_project_id para cross-project),",
              " 2 = Duplicado (exige duplicate_to),",
              " 3 = Encerrado (use outcome=consulting ou outcome=deferred — não envie status=3 sem outcome).",
            ].join(" "),
          },
          destination_project_id: {
            type: "string",
            format: "uuid",
            description:
              "ID do projeto de delivery destino (ex: DWFF, WB). Quando informado junto com status=1, cria a issue no projeto destino e vincula ao pedido de origem via IssueRelation. Sem este campo, a issue é promovida para o backlog do mesmo projeto.",
          },
          outcome: {
            type: "string",
            enum: ["converted", "consulting", "deferred", "rejected"],
            description: [
              "Desfecho tipado do pedido (registrado para histórico).",
              "converted = virou delivery (setado automaticamente no accept),",
              "consulting = resolvido sem código — exige outcome_note,",
              "deferred = não priorizado agora — use com status=3,",
              "rejected = recusado definitivamente.",
            ].join(" "),
          },
          outcome_note: {
            type: "string",
            description:
              "Nota obrigatória quando outcome=consulting. Descreve o que foi orientado ou resolvido sem desenvolvimento.",
          },
          deferred_until: {
            type: "string",
            format: "date",
            description: "Data (YYYY-MM-DD) para reavaliar o pedido quando outcome=deferred. Opcional mas recomendado.",
          },
          awaiting_info: {
            type: "boolean",
            description:
              "true = pedir complemento de informação ao solicitante. O pedido permanece Pendente e um evento intake.needs_info é emitido para automações (ex: notificar solicitante). Não muda o status.",
          },
          decline_reason: {
            type: "string",
            description: "Justificativa de recusa (obrigatória quando status=-1).",
          },
          decline_category: {
            type: "string",
            enum: ["out_of_scope", "duplicate", "insufficient_info", "spam", "other"],
            description: "Categoria de recusa (obrigatória quando status=-1).",
          },
          duplicate_to: {
            type: "string",
            format: "uuid",
            description: "ID da issue original quando status=2 (duplicado).",
          },
          snoozed_till: {
            type: "string",
            format: "date-time",
            description: "Data/hora ISO 8601 até quando adiar (status=0).",
          },
          snooze_reason: {
            type: "string",
            description: "Motivo do adiamento (status=0).",
          },
          issue: {
            type: "object",
            description: "Editar campos da issue vinculada ao pedido (nome, descrição, prioridade).",
            properties: {
              name: { type: "string" },
              description_html: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high", "urgent", "none"] },
            },
          },
        },
      },
    }
  ),
  op(
    "work_items",
    "operoz_update_issue_app",
    "Atualiza issue (app)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_update_issue_comment_app",
    "Edita comentário",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_update_issue_custom_fields",
    "Atualiza custom fields",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/issues/{issue_id}/custom-fields/",
    ["workspace_slug", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_update_issue_link_app",
    "Atualiza link",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-links/{pk}/",
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_work_item_description_version_get",
    "Work Item Description Version (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/description-versions/",
    ["workspace_slug", "project_id", "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_work_item_description_version_get_2",
    "Work Item Description Version (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/description-versions/{pk}/",
    ["workspace_slug", "project_id", "work_item_id", "pk"]
  ),
];
