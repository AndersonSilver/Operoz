/** Liga a sidebar hierárquica Boards → Projetos (Etapa 2+). Definir VITE_ENABLE_BOARDS=true no .env local. */
const boardsFlag = import.meta.env.VITE_ENABLE_BOARDS;

export const ENABLE_WORKSPACE_BOARDS = boardsFlag === "true" || boardsFlag === "1";
