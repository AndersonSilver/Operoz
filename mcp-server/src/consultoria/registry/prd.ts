import { cop } from "./types.js";

export const PRD_OPERATIONS = [
  cop("prd", "register_prd", "Vincula um PRD ao módulo. Status: pending | approved", ["module_id"], true),
  cop(
    "prd",
    "approve_prd",
    "Marca o PRD como aprovado e retorna seu conteúdo para geração das tarefas dinâmicas",
    ["module_id"],
    false
  ),
  cop(
    "prd",
    "generate_from_prd",
    "Recebe tarefas geradas pelo agente a partir do PRD e popula as fases DESENVOLVIMENTO, HOMOLOGACAO_INTERNA e HOMOLOGACAO_EXTERNA",
    ["module_id"],
    true
  ),
  cop("prd", "get_prd", "Retorna o PRD vinculado a um módulo", ["module_id"], false),
];
