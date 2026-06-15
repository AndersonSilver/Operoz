import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import type { IWorkspaceMemberInvitation } from "@operis/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { WorkspaceLogo } from "@/components/workspace/logo";
// helpers
import { EAuthModes, EAuthSteps } from "@/helpers/authentication.helper";
// services
import { WorkspaceService } from "@/services/workspace.service";

type TAuthHeader = {
  workspaceSlug: string | undefined;
  invitationId: string | undefined;
  invitationEmail: string | undefined;
  authMode: EAuthModes;
  currentAuthStep: EAuthSteps;
};

const Titles = {
  [EAuthModes.SIGN_IN]: {
    [EAuthSteps.EMAIL]: {
      header: "Bem-vindo de volta",
      subHeader: "Entre com sua conta para continuar",
    },
    [EAuthSteps.PASSWORD]: {
      header: "Bem-vindo de volta",
      subHeader: "Informe sua senha para acessar",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Bem-vindo de volta",
      subHeader: "Digite o código enviado ao seu e-mail",
    },
  },
  [EAuthModes.SIGN_UP]: {
    [EAuthSteps.EMAIL]: {
      header: "Criar conta",
      subHeader: "Comece a gerenciar seu trabalho com o time",
    },
    [EAuthSteps.PASSWORD]: {
      header: "Criar conta",
      subHeader: "Defina uma senha segura para continuar",
    },
    [EAuthSteps.UNIQUE_CODE]: {
      header: "Criar conta",
      subHeader: "Digite o código enviado ao seu e-mail",
    },
  },
};

const workSpaceService = new WorkspaceService();

export const AuthHeader = observer(function AuthHeader(props: TAuthHeader) {
  const { workspaceSlug, invitationId, invitationEmail, authMode, currentAuthStep } = props;
  // plane imports
  const { t } = useTranslation();

  const { data: invitation, isLoading } = useSWR(
    workspaceSlug && invitationId ? `WORKSPACE_INVITATION_${workspaceSlug}_${invitationId}` : null,
    async () => workspaceSlug && invitationId && workSpaceService.getWorkspaceInvitation(workspaceSlug, invitationId),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const getHeaderSubHeader = (
    step: EAuthSteps,
    mode: EAuthModes,
    invitation: IWorkspaceMemberInvitation | undefined,
    email: string | undefined
  ) => {
    if (invitation && email && invitation.email === email && invitation.workspace) {
      const workspace = invitation.workspace;
      return {
        header: (
          <div className="relative inline-flex items-center gap-2">
            {t("common.join")}{" "}
            <WorkspaceLogo logo={workspace?.logo_url} name={workspace?.name} classNames="size-9 flex-shrink-0" />{" "}
            {workspace.name}
          </div>
        ),
        subHeader:
          mode == EAuthModes.SIGN_UP
            ? "Create an account to start managing work with your team."
            : "Log in to start managing work with your team.",
      };
    }

    return Titles[mode][step];
  };

  const { header, subHeader } = getHeaderSubHeader(currentAuthStep, authMode, invitation || undefined, invitationEmail);

  if (isLoading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );

  return <AuthHeaderBase subHeader={subHeader} header={header} />;
});

type TAuthHeaderBase = {
  header: React.ReactNode;
  subHeader: string;
};

export function AuthHeaderBase(props: TAuthHeaderBase) {
  return (
    <div className="flex flex-col gap-3 text-balance">
      <div
        className="h-[3px] w-10 rounded-full bg-gradient-to-r from-accent-primary to-accent-primary/30"
        aria-hidden="true"
      />
      <div className="space-y-1.5">
        <div className="text-20 leading-[1.2] font-semibold tracking-[-0.02em] text-primary sm:text-24">
          {props.header}
        </div>
        <p className="sm:text-15 text-14 leading-relaxed text-tertiary">{props.subHeader}</p>
      </div>
    </div>
  );
}
