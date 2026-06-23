import { cop } from "./types.js";

export const TASK_OPERATIONS = [
  cop("tasks", "list_tasks", "Lista tarefas de um card", ["card_id"], false),
  cop("tasks", "create_task", "Cria tarefa num card (aplica prefixo [PROJETO] automaticamente)", ["card_id"], true),
  cop("tasks", "bulk_create_tasks", "Cria várias tarefas de uma vez num card", ["card_id"], true),
  cop("tasks", "update_task", "Edita título, descrição, responsável ou prioridade", ["task_id"], true),
  cop("tasks", "update_task_status", "Move o estado da tarefa: todo | in_progress | done | blocked", ["task_id"], true),
  cop("tasks", "delete_task", "Remove uma tarefa", ["task_id"], false),
];
