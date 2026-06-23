import { cop } from "./types.js";

export const MODULE_OPERATIONS = [
  cop("modules", "list_modules", "Lista módulos de um projeto", ["project_id"], false),
  cop(
    "modules",
    "create_module",
    "Cria módulo + 8 cards de fase + tarefas-template das fases fixas. Pergunta sobre o PRD após criar.",
    ["project_id"],
    true
  ),
  cop("modules", "update_module", "Renomeia ou reordena um módulo", ["module_id"], true),
  cop("modules", "delete_module", "Remove módulo e todos os seus cards e tarefas", ["module_id"], false),
];
