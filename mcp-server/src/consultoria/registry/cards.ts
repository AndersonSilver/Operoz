import { cop } from "./types.js";

export const CARD_OPERATIONS = [
  cop("cards", "list_cards", "Lista os cards (fases) de um módulo", ["module_id"], false),
  cop("cards", "get_card", "Detalha um card e suas tarefas", ["card_id"], false),
  cop("cards", "update_card_status", "Atualiza status do card: todo | in_progress | done | blocked", ["card_id"], true),
  cop("cards", "set_card_dates", "Define data de início e/ou prazo de uma fase", ["card_id"], true),
];
