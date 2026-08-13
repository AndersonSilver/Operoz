import { useParams } from "next/navigation";
// components
import { McpAuthorizeRoot } from "@/components/account/mcp-authorize/root";
import { AuthThemeToggle } from "@/components/auth-screens/theme-toggle";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// layouts
import DefaultLayout from "@/layouts/default-layout";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

/**
 * Tela de consentimento dos conectores MCP (Claude Desktop / claude.ai).
 *
 * Dois detalhes que falham em SILÊNCIO se mudarem:
 *
 * 1. O ticket TEM de ser segmento de path (`/mcp-authorize/:ticket`), nunca query
 *    string. O `next_path` do login é montado a partir do `pathname`
 *    (`authentication-wrapper.tsx`, `api.service.ts`) — a query é descartada — e
 *    `get_safe_redirect_url` (`apps/api/operoz/utils/path_validator.py`) reinjeta o
 *    valor SEM percent-encoding. Empurrar qualquer parâmetro para a query quebra
 *    exatamente aqui, e só no caminho deslogado/SSO: o caminho já logado continua
 *    a funcionar, o que torna a regressão fácil de não notar.
 *
 * 2. O `<AuthenticationWrapper pageType={EPageTypes.AUTHENTICATED}>` é o que dá o
 *    fallback para o login/SSO real do Operoz. Sem ele, a página fica pública e
 *    chama um endpoint autenticado. E a rota está registada no bloco de páginas de
 *    conta em `app/routes/core.ts`, FORA de `layout("./(all)/layout.tsx", …)` — se
 *    entrasse no shell de workspace, herdaria redirecionamentos para
 *    `/create-workspace`.
 */
function McpAuthorizePage() {
  const params = useParams();
  const rawTicket = params?.ticket as string | string[] | undefined;
  const ticket = Array.isArray(rawTicket) ? (rawTicket[0] ?? "") : (rawTicket ?? "");

  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.AUTHENTICATED}>
        <AuthThemeToggle />
        <McpAuthorizeRoot ticket={ticket} />
      </AuthenticationWrapper>
    </DefaultLayout>
  );
}

export default McpAuthorizePage;
