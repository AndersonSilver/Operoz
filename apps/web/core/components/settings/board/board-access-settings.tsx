import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Link } from "react-router";
import { ChevronDown, Search } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button, getButtonStyling } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoardMember } from "@operoz/types";
import { Avatar, CustomMenu, Loader, Table } from "@operoz/ui";
import { cn, getFileURL } from "@operoz/utils";
import { WorkspaceMembersPanel } from "@/components/workspace/settings/workspace-members-panel";
import { useBoardAccess } from "@/hooks/store/use-board-access";
import { BoardAccessAddMemberModal } from "./board-access-add-member-modal";
import { BoardAccessSettingsHero } from "./board-access-settings-hero";
import { BoardMemberRolesModal } from "./board-member-roles-modal";
import { BoardRolesManageModal } from "./board-roles-manage-modal";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardName: string;
};

export const BoardAccessSettings = observer(function BoardAccessSettings(props: Props) {
  const { workspaceSlug, boardSlug, boardName } = props;
  const { t } = useTranslation();
  const { fetchBoardRoles, fetchBoardMembers, getBoardMembers, getBoardRoles, removeBoardMember } = useBoardAccess();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | "all">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [editMember, setEditMember] = useState<IBoardMember | null>(null);

  const reload = () => {
    void fetchBoardRoles(workspaceSlug, boardSlug);
    void fetchBoardMembers(workspaceSlug, boardSlug);
  };

  const { isLoading } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_ACCESS_${workspaceSlug}_${boardSlug}` : null,
    async () => {
      await fetchBoardRoles(workspaceSlug, boardSlug);
      return fetchBoardMembers(workspaceSlug, boardSlug);
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const members = getBoardMembers(workspaceSlug, boardSlug);
  const roles = getBoardRoles(workspaceSlug, boardSlug);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const name = (m.member?.display_name ?? "").toLowerCase();
      const email = (m.email ?? "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q);
      const matchesRole = roleFilter === "all" || m.role_ids.includes(roleFilter as string);
      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);

  const handleRemove = async (member: IBoardMember) => {
    try {
      await removeBoardMember(workspaceSlug, boardSlug, member.user_id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.access.remove_success_title"),
        message: t("boards.settings.access.remove_success_message"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const roleFilterLabel =
    roleFilter === "all"
      ? t("boards.settings.access.filter_all_roles")
      : (roles.find((role) => role.id === roleFilter)?.name ?? t("boards.settings.access.filter_all_roles"));

  const toolbar = (
    <>
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 size-3.5 text-tertiary" strokeWidth={1.75} />
        <input
          className="h-8 w-full max-w-[240px] min-w-[180px] rounded-md border border-subtle bg-surface-1 py-0 pr-3 pl-9 text-12 text-primary transition-colors outline-none placeholder:text-placeholder focus:border-accent-subtle focus:ring-1 focus:ring-accent-subtle/40 sm:min-w-[220px]"
          placeholder={t("boards.settings.access.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <CustomMenu
        customButton={
          <Button variant="secondary" size="lg" className="gap-1.5">
            <span className="max-w-[10rem] truncate">{roleFilterLabel}</span>
            <ChevronDown className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
          </Button>
        }
        placement="bottom-start"
      >
        <div className="min-w-[12rem] py-1">
          <button
            type="button"
            className={`flex w-full px-3 py-2 text-left text-12 transition-colors hover:bg-layer-transparent-hover ${
              roleFilter === "all" ? "font-medium text-primary" : "text-secondary"
            }`}
            onClick={() => setRoleFilter("all")}
          >
            {t("boards.settings.access.filter_all_roles")}
          </button>
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`flex w-full px-3 py-2 text-left text-12 transition-colors hover:bg-layer-transparent-hover ${
                roleFilter === role.id ? "font-medium text-primary" : "text-secondary"
              }`}
              onClick={() => setRoleFilter(role.id)}
            >
              {role.name}
            </button>
          ))}
        </div>
      </CustomMenu>
      <Button variant="secondary" size="lg" onClick={() => setIsRolesOpen(true)}>
        {t("boards.settings.access.manage_roles")}
      </Button>
      <Link
        to={`/${workspaceSlug}/settings/boards/${boardSlug}/funcoes`}
        className={cn(getButtonStyling("secondary", "lg"))}
      >
        {t("boards.settings.access.open_roles_page")}
      </Link>
      <Button variant="primary" size="lg" onClick={() => setIsAddOpen(true)}>
        {t("boards.settings.access.add_people")}
      </Button>
    </>
  );

  const columns = [
    {
      key: "name",
      content: t("boards.settings.access.col_name"),
      tdRender: (member: IBoardMember) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={member.member?.display_name} src={getFileURL(member.member?.avatar_url)} />
          <span className="truncate font-medium text-primary">{member.member?.display_name}</span>
        </div>
      ),
    },
    {
      key: "email",
      content: t("boards.settings.access.col_email"),
      tdRender: (member: IBoardMember) => <span className="truncate text-secondary">{member.email}</span>,
    },
    {
      key: "role",
      content: t("boards.settings.access.col_role"),
      tdRender: (member: IBoardMember) => (
        <button
          type="button"
          className="text-left text-accent-primary hover:underline"
          onClick={() => setEditMember(member)}
        >
          {member.role_label}
        </button>
      ),
    },
    {
      key: "actions",
      content: "",
      tdRender: (member: IBoardMember) => (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-12 font-medium text-danger-primary hover:underline"
            onClick={() => void handleRemove(member)}
          >
            {t("remove")}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <BoardAccessAddMemberModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdded={reload}
      />
      <BoardRolesManageModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        boardName={boardName}
        isOpen={isRolesOpen}
        onClose={() => setIsRolesOpen(false)}
        onRolesChanged={reload}
      />
      <BoardMemberRolesModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        member={editMember}
        isOpen={Boolean(editMember)}
        onClose={() => setEditMember(null)}
        onSaved={reload}
      />

      <div className="flex w-full flex-col gap-6">
        <BoardAccessSettingsHero boardName={boardName} memberCount={members.length} rolesCount={roles.length} />

        <WorkspaceMembersPanel
          memberCount={filtered.length}
          title={t("boards.settings.access.panel_title")}
          hint={t("boards.settings.access.list_hint")}
          toolbar={toolbar}
        >
          {isLoading && members.length === 0 ? (
            <div className="px-5 py-6 lg:px-6">
              <Loader className="w-full space-y-2">
                <Loader.Item height="44px" />
                <Loader.Item height="44px" />
              </Loader>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex w-full items-center justify-center px-5 py-12 lg:px-6">
              <p className="text-center text-13 text-placeholder">{t("boards.settings.access.empty")}</p>
            </div>
          ) : (
            <div className="divide-y divide-subtle overflow-x-auto">
              <Table<IBoardMember>
                columns={columns}
                data={filtered}
                keyExtractor={(member) => member.user_id}
                tHeadClassName="border-b border-subtle bg-layer-2/40"
                thClassName="text-left font-medium divide-x-0 text-placeholder text-11 uppercase tracking-wide first:pl-5 last:pr-5 lg:first:pl-6 lg:last:pr-6"
                tBodyClassName="divide-y-0"
                tBodyTrClassName="divide-x-0 h-11 text-secondary transition-colors hover:bg-layer-1-hover/50 [&>td:first-child]:pl-5 [&>td:last-child]:pr-5 lg:[&>td:first-child]:pl-6 lg:[&>td:last-child]:pr-6"
                tHeadTrClassName="divide-x-0 h-10 [&>th:first-child]:pl-5 [&>th:last-child]:pr-5 lg:[&>th:first-child]:pl-6 lg:[&>th:last-child]:pr-6"
              />
            </div>
          )}
        </WorkspaceMembersPanel>
      </div>
    </>
  );
});
