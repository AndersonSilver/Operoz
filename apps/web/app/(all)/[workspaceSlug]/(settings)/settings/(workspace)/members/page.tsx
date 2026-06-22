import { useState } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
// types
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IWorkspaceBulkInviteFormData } from "@operis/types";
import { cn } from "@operis/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { MemberListFiltersDropdown } from "@/components/project/dropdowns/filters/member-list";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkspaceMembersList } from "@/components/workspace/settings/members-list";
import { WorkspaceMembersPanel } from "@/components/workspace/settings/workspace-members-panel";
import { WorkspaceMembersSettingsHero } from "@/components/workspace/settings/workspace-members-settings-hero";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import {
  SendWorkspaceInvitationModal,
  MembersActivityButton,
  MembersCsvImportButton,
} from "@/plane-web/components/workspace/members";
// local imports
import type { Route } from "./+types/page";
import { MembersWorkspaceSettingsHeader } from "./header";

const WorkspaceMembersSettingsPage = observer(function WorkspaceMembersSettingsPage({ params }: Route.ComponentProps) {
  const [inviteModal, setInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { workspaceSlug } = params;
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const {
    workspace: { workspaceMemberIds, workspaceMemberInvitationIds, inviteMembersToWorkspace, filtersStore },
  } = useMember();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleWorkspaceInvite = async (data: IWorkspaceBulkInviteFormData) => {
    try {
      await inviteMembersToWorkspace(workspaceSlug, data);
      setInviteModal(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: t("workspace_settings.settings.members.invitations_sent_successfully"),
      });
    } catch (error: unknown) {
      let message = undefined;
      if (error instanceof Error) {
        const err = error as Error & { error?: string };
        message = err.error;
      }
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: `${message ?? t("something_went_wrong_please_try_again")}`,
      });
      throw error;
    }
  };

  const handleRoleFilterUpdate = (role: string) => {
    const currentFilters = filtersStore.filters;
    const currentRoles = currentFilters?.roles || [];
    const updatedRoles = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];

    filtersStore.updateFilters({
      roles: updatedRoles.length > 0 ? updatedRoles : undefined,
    });
  };

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.members.title")}`
    : undefined;
  const appliedRoleFilters = filtersStore.filters?.roles || [];
  const memberCount = workspaceMemberIds?.length ?? 0;
  const pendingInviteCount = workspaceMemberInvitationIds?.length ?? 0;

  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const toolbar = (
    <>
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 size-3.5 text-tertiary" strokeWidth={1.75} />
        <input
          className="h-8 w-full max-w-[240px] min-w-[180px] rounded-full border border-subtle bg-surface-1 py-0 pr-3 pl-9 text-12 text-primary transition-colors outline-none placeholder:text-placeholder focus:border-accent-subtle focus:ring-1 focus:ring-accent-subtle/40 sm:min-w-[220px]"
          placeholder={`${t("search")}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <MemberListFiltersDropdown
        appliedFilters={appliedRoleFilters}
        handleUpdate={handleRoleFilterUpdate}
        memberType="workspace"
      />
      <MembersActivityButton workspaceSlug={workspaceSlug} />
      {canPerformWorkspaceAdminActions && (
        <>
          <MembersCsvImportButton onSubmit={handleWorkspaceInvite} />
          <Button variant="primary" size="sm" onClick={() => setInviteModal(true)}>
            {t("workspace_settings.settings.members.add_member")}
          </Button>
        </>
      )}
    </>
  );

  return (
    <SettingsContentWrapper header={<MembersWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <SendWorkspaceInvitationModal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        onSubmit={handleWorkspaceInvite}
      />
      <div
        className={cn("flex w-full flex-col gap-6", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <WorkspaceMembersSettingsHero memberCount={memberCount} pendingInviteCount={pendingInviteCount} />
        <WorkspaceMembersPanel memberCount={memberCount} toolbar={toolbar}>
          <WorkspaceMembersList searchQuery={searchQuery} isAdmin={canPerformWorkspaceAdminActions} />
        </WorkspaceMembersPanel>
      </div>
    </SettingsContentWrapper>
  );
});

export default WorkspaceMembersSettingsPage;
