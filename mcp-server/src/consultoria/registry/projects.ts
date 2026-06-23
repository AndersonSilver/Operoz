import { cop } from "./types.js";

export const PROJECT_OPERATIONS = [
  cop("projects", "list_projects", "Lista projetos de consultoria", [], false),
  cop("projects", "get_project", "Detalha um projeto por id", ["project_id"], false),
  cop("projects", "create_project", "Cria um projeto de consultoria (name, description?)", [], true),
  cop("projects", "update_project", "Atualiza dados ou status do projeto", ["project_id"], true),
  cop("projects", "archive_project", "Encerra e arquiva um projeto", ["project_id"], false),
];
