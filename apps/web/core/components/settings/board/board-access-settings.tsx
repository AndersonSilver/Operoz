/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBoardMember } from "@plane/types";
import { Avatar, Input, Loader } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { SettingsHeading } from "@/components/settings/heading";
import { useBoardAccess } from "@/hooks/store/use-board-access";
import { BoardAccessAddMemberModal } from "./board-access-add-member-modal";
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
  const { fetchBoardRoles, fetchBoardMembers, getBoardMembers, getBoardRoles, removeBoardMember } =
    useBoardAccess();
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
      const matchesRole =
        roleFilter === "all" || m.role_ids.includes(roleFilter as string);
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

  return (
    <div className="w-full">
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

      <SettingsHeading
        title={t("boards.settings.access.heading")}
        description={t("boards.settings.access.description", { board: boardName })}
        control={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="lg" onClick={() => setIsRolesOpen(true)}>
              {t("boards.settings.access.manage_roles")}
            </Button>
            <Link
              to={`/${workspaceSlug}/settings/boards/${boardSlug}/funcoes`}
              className="text-13 font-medium text-accent-primary hover:underline"
            >
              {t("boards.settings.access.open_roles_page")}
            </Link>
            <Button variant="primary" size="lg" onClick={() => setIsAddOpen(true)}>
              {t("boards.settings.access.add_people")}
            </Button>
          </div>
        }
      />

      <p className="mt-2 text-13 text-tertiary">
        {t("boards.settings.access.roles_count", { count: roles.length })}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-tertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("boards.settings.access.search_placeholder")}
            className="pl-9"
          />
        </div>
        <select
          className="rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">{t("boards.settings.access.filter_all_roles")}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && members.length === 0 ? (
        <Loader className="mt-6 w-full max-w-3xl space-y-2">
          <Loader.Item height="48px" />
          <Loader.Item height="48px" />
        </Loader>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-13 text-tertiary">{t("boards.settings.access.empty")}</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-subtle">
          <table className="w-full text-left text-13">
            <thead className="border-b border-subtle bg-layer-1 text-11 font-medium uppercase text-tertiary">
              <tr>
                <th className="px-4 py-2">{t("boards.settings.access.col_name")}</th>
                <th className="px-4 py-2">{t("boards.settings.access.col_email")}</th>
                <th className="px-4 py-2">{t("boards.settings.access.col_role")}</th>
                <th className="px-4 py-2 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {filtered.map((member) => (
                <tr key={member.user_id} className="bg-layer-2">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={member.member?.display_name}
                        src={getFileURL(member.member?.avatar_url)}
                      />
                      <span className="font-medium text-primary">{member.member?.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary">{member.email}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-left text-accent-primary hover:underline"
                      onClick={() => setEditMember(member)}
                    >
                      {member.role_label}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" size="sm" onClick={() => void handleRemove(member)}>
                      {t("remove")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
