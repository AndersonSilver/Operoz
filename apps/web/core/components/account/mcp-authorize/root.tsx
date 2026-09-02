import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
// operoz imports
import { Button } from "@operoz/propel/button";
import { OperozLogo } from "@operoz/propel/icons";
// hooks
import { useUser } from "@/hooks/store/user";
// services
import {
  McpConnectorError,
  McpConnectorService,
  type TMcpPendingAuthorization,
} from "@/services/mcp-connector.service";

const mcpConnectorService = new McpConnectorService();

type Props = {
  ticket: string;
};

type TScreen =
  | { status: "loading" }
  | { status: "consent"; pending: TMcpPendingAuthorization }
  | { status: "submitting"; pending: TMcpPendingAuthorization }
  | { status: "redirecting" }
  | { status: "denied" }
  | { status: "error"; message: string; hint?: string };

/** Descrição legível dos escopos pedidos. Escopo desconhecido é mostrado cru. */
const SCOPE_LABELS: Record<string, string> = {
  "mcp:tools": "Ler e escrever nos seus dados do Operoz através das ferramentas MCP",
};

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex h-screen w-screen items-center justify-center overflow-y-auto px-6 py-10">
      <div className="shadow-sm w-full max-w-md space-y-6 rounded-lg border border-subtle bg-surface-1 p-8">
        <OperozLogo className="h-8 w-auto text-primary" />
        {children}
      </div>
    </div>
  );
}

export const McpAuthorizeRoot = observer(function McpAuthorizeRoot({ ticket }: Props) {
  const { data: currentUser, signOut } = useUser();
  const [screen, setScreen] = useState<TScreen>({ status: "loading" });

  const loadPending = useCallback(async () => {
    try {
      const pending = await mcpConnectorService.lookupPending(ticket);
      setScreen({ status: "consent", pending });
    } catch (error) {
      const reason = error instanceof McpConnectorError ? error.reason : "unavailable";
      if (reason === "invalid_ticket") {
        setScreen({
          status: "error",
          message: "Este pedido de autorização é inválido ou já expirou.",
          hint: "Volte à aplicação que iniciou a ligação e tente adicionar o conector novamente.",
        });
        return;
      }
      // Risco 13 do plano: rollback só do MCP deixa esta página apontando para
      // endpoints inexistentes. Nunca deixar tela branca.
      setScreen({
        status: "error",
        message: "O serviço de conectores do Operoz está indisponível de momento.",
        hint: "Tente novamente daqui a alguns minutos.",
      });
    }
  }, [ticket]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const scopeLines = useMemo(() => {
    if (screen.status !== "consent" && screen.status !== "submitting") return [];
    return screen.pending.scopes.map((scope) => SCOPE_LABELS[scope] ?? scope);
  }, [screen]);

  const handleAccept = async () => {
    if (screen.status !== "consent") return;
    const { pending } = screen;
    setScreen({ status: "submitting", pending });

    try {
      const redirectUrl = await mcpConnectorService.authorize(ticket);
      setScreen({ status: "redirecting" });
      window.location.assign(redirectUrl);
    } catch (error) {
      const reason = error instanceof McpConnectorError ? error.reason : "unavailable";
      setScreen({
        status: "error",
        message:
          reason === "invalid_ticket"
            ? "Este pedido de autorização é inválido ou já expirou."
            : "Não foi possível concluir a autorização.",
        hint:
          reason === "invalid_ticket"
            ? "Volte à aplicação que iniciou a ligação e tente adicionar o conector novamente."
            : "Nenhum acesso foi concedido. Tente novamente daqui a alguns minutos.",
      });
    }
  };

  const handleCancel = async () => {
    try {
      const redirectUrl = await mcpConnectorService.deny(ticket);
      setScreen({ status: "redirecting" });
      window.location.assign(redirectUrl);
      return;
    } catch {
      // Segue para o fallback pelo Django.
    }

    try {
      // O browser pode não alcançar o mcp-server (rede corporativa, CORS bloqueado);
      // o Django alcança, servidor-a-servidor.
      const redirectUrl = await mcpConnectorService.denyViaApi(ticket);
      setScreen({ status: "redirecting" });
      window.location.assign(redirectUrl);
    } catch {
      // Risco 18 do plano: a página NÃO conhece o `redirect_uri` (de propósito), por
      // isso não há como montar o retorno de `access_denied` do lado do cliente.
      // Dizer isso em texto claro em vez de fingir sucesso.
      setScreen({ status: "denied" });
    }
  };

  const handleSwitchAccount = async () => {
    await signOut();
    // Ticket é SEGMENTO DE PATH e não query: o `next_path` do login é montado a
    // partir do `pathname` e reinjetado sem percent-encoding, então uma query aqui
    // seria perdida no round-trip de login/SSO. Não mover o ticket para a query.
    window.location.assign(`/?next_path=/mcp-authorize/${encodeURIComponent(ticket)}`);
  };

  if (screen.status === "loading") {
    return (
      <ScreenShell>
        <div className="flex items-center gap-2 text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-13">A carregar o pedido de autorização…</span>
        </div>
      </ScreenShell>
    );
  }

  if (screen.status === "redirecting") {
    return (
      <ScreenShell>
        <div className="flex items-center gap-2 text-secondary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-13">A voltar para a aplicação…</span>
        </div>
      </ScreenShell>
    );
  }

  if (screen.status === "denied") {
    return (
      <ScreenShell>
        <h1 className="text-16 font-semibold">Autorização cancelada</h1>
        <p className="text-13 text-secondary">
          Nenhum acesso foi concedido. Não conseguimos avisar a aplicação automaticamente — pode fechar esta janela e
          cancelar a ligação por lá.
        </p>
      </ScreenShell>
    );
  }

  if (screen.status === "error") {
    return (
      <ScreenShell>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
          <div className="space-y-1">
            <h1 className="text-16 font-semibold">{screen.message}</h1>
            {screen.hint ? <p className="text-13 text-secondary">{screen.hint}</p> : null}
          </div>
        </div>
      </ScreenShell>
    );
  }

  const { pending } = screen;
  const isSubmitting = screen.status === "submitting";

  return (
    <ScreenShell>
      <div className="space-y-2">
        <h1 className="text-18 font-semibold">«{pending.client_name}» quer aceder à sua conta Operoz</h1>
        <p className="text-11 text-secondary">
          Este nome foi informado pela própria aplicação e não é verificado pelo Operoz.
          {pending.client_uri ? ` Endereço declarado: ${pending.client_uri}` : ""}
        </p>
      </div>

      <div className="space-y-2 rounded-md border border-subtle bg-layer-1 p-4">
        <div className="flex items-center gap-2 text-13 font-medium">
          <ShieldCheck className="h-4 w-4" />
          Se aceitar, a aplicação vai poder:
        </div>
        <ul className="ml-6 list-disc space-y-1 text-13 text-secondary">
          {scopeLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
          <li>Aceder a todos os seus workspaces — este acesso não é limitado a um workspace.</li>
        </ul>
      </div>

      <p className="text-11 text-secondary">
        A autorizar como <span className="font-medium text-primary">{currentUser?.email}</span>. Pode revogar este
        acesso a qualquer momento em Definições → API tokens.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="lg" onClick={handleAccept} disabled={isSubmitting} loading={isSubmitting}>
          Aceitar
        </Button>
        <Button variant="secondary" size="lg" onClick={handleCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>

      <button
        type="button"
        onClick={handleSwitchAccount}
        disabled={isSubmitting}
        className="text-11 text-secondary underline underline-offset-2 hover:text-primary disabled:opacity-50"
      >
        Sair e entrar com outra conta
      </button>
    </ScreenShell>
  );
});
