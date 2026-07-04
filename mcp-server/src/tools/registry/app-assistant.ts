import { op } from "./types.js";

export const APP_ASSISTANT_OPERATIONS = [
  op(
    "assistant",
    "operoz_assistant_chat_job_stream_get",
    "Assistant Chat Job Stream (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/assistant/chat/jobs/{job_id}/stream/",
    ["workspace_slug","job_id"]
  ),
  op(
    "assistant",
    "operoz_assistant_confirm_action_post",
    "Assistant Confirm Action (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/assistant/sessions/{session_id}/confirm-action/",
    ["workspace_slug","session_id"], { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_message_feedback_patch",
    "Assistant Message Feedback (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/assistant/sessions/{session_id}/messages/{message_id}/feedback/",
    ["workspace_slug","session_id","message_id"], { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_ops_metrics_get",
    "Assistant Ops Metrics (Consulta)",
    "app",
    "GET",
    "/assistant/ops/metrics/",
    []
  ),
  op(
    "assistant",
    "operoz_assistant_quality_get",
    "Assistant Quality (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/assistant/quality/",
    ["workspace_slug"]
  ),
  op(
    "assistant",
    "operoz_assistant_quality_review_get",
    "Assistant Quality Review (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/assistant/quality/reviews/",
    ["workspace_slug"]
  ),
  op(
    "assistant",
    "operoz_assistant_quality_review_post",
    "Assistant Quality Review (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/assistant/quality/reviews/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_session_chat_post",
    "Assistant Session Chat (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/assistant/sessions/{session_id}/chat/",
    ["workspace_slug","session_id"], { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_session_detail_delete",
    "Assistant Session Detail (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/assistant/sessions/{session_id}/",
    ["workspace_slug","session_id"], { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_session_detail_get",
    "Assistant Session Detail (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/assistant/sessions/{session_id}/",
    ["workspace_slug","session_id"]
  ),
  op(
    "assistant",
    "operoz_assistant_session_detail_patch",
    "Assistant Session Detail (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/assistant/sessions/{session_id}/",
    ["workspace_slug","session_id"], { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_session_list_create_get",
    "Assistant Session List Create (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/assistant/sessions/",
    ["workspace_slug"]
  ),
  op(
    "assistant",
    "operoz_assistant_session_list_create_post",
    "Assistant Session List Create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/assistant/sessions/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_session_messages_get",
    "Assistant Session Messages (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/assistant/sessions/{session_id}/messages/",
    ["workspace_slug","session_id"]
  ),
  op(
    "assistant",
    "operoz_assistant_usage_get",
    "Assistant Usage (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/assistant/usage/",
    ["workspace_slug"]
  ),
];
