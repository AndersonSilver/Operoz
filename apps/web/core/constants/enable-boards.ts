/**
 * Operis: boards ligados por defeito (sidebar Boards → Projetos, settings /settings/boards).
 * Desligar só com VITE_ENABLE_BOARDS=false no .env ou no build Docker.
 *
 * Opt-out (não opt-in): evita bundle com process.env vazio ({}) desligar boards em produção.
 */
const boardsFlag = import.meta.env.VITE_ENABLE_BOARDS;

export const ENABLE_WORKSPACE_BOARDS = boardsFlag !== "false" && boardsFlag !== "0";
