/** Liga a sidebar hierárquica Boards → Projetos (Etapa 2+). Definir VITE_ENABLE_BOARDS=true no .env local. */
export const ENABLE_WORKSPACE_BOARDS =
  process.env.VITE_ENABLE_BOARDS === "true" || process.env.VITE_ENABLE_BOARDS === "1";
