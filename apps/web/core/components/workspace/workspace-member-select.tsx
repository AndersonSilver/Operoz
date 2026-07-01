/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Ban } from "lucide-react";
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IUserLite } from "@plane/types";
import { Avatar, CustomSearchSelect } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";

type Props = {
  workspaceSlug: string;
  value: string | null | undefined;
  onChange: (val: string) => void;
  /** Fallback quando o membro vem da API mas ainda não está no mapa local */
  selectedMemberFromApi?: IUserLite | null;
  isDisabled?: boolean;
};

export const WorkspaceMemberSelect = observer(function WorkspaceMemberSelect(props: Props) {
  const { workspaceSlug, value, onChange, selectedMemberFromApi, isDisabled = false } = props;
  const { t } = useTranslation();
  const {
    workspace: { getWorkspaceMemberIds, workspaceMemberMap },
    memberMap,
  } = useMember();

  const resolveMemberDetails = (userId: string) => {
    const membership = workspaceMemberMap?.[workspaceSlug]?.[userId];
    if (!membership) return null;
    const member = memberMap?.[membership.member];
    if (!member) return null;
    return { member };
  };

  const memberIds = getWorkspaceMemberIds(workspaceSlug);

  const options = memberIds
    ?.map((userId) => {
      const memberDetails = resolveMemberDetails(userId);
      if (!memberDetails?.member) return;
      if (Number(memberDetails.role) === EUserPermissions.GUEST) return;

      return {
        value: memberDetails.member.id,
        query: memberDetails.member.display_name ?? "",
        content: (
          <div className="flex items-center gap-2">
            <Avatar
              name={memberDetails.member.display_name}
              src={getFileURL(memberDetails.member.avatar_url)}
            />
            {memberDetails.member.display_name}
          </div>
        ),
      };
    })
    .filter((option) => !!option) as
    | {
        value: string;
        query: string;
        content: React.ReactNode;
      }[]
    | undefined;

  const selectedMember = value ? resolveMemberDetails(value) : null;
  const displayMember =
    selectedMember?.member ?? (value && selectedMemberFromApi?.id === value ? selectedMemberFromApi : null);

  return (
    <CustomSearchSelect
      value={value ?? ""}
      label={
        <div className="flex h-3.5 items-center gap-2">
          {displayMember && (
            <Avatar name={displayMember.display_name} src={getFileURL(displayMember.avatar_url)} />
          )}
          {displayMember ? (
            displayMember.display_name
          ) : (
            <div className="flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 rotate-90 text-placeholder" />
              <span className="text-13 text-placeholder">{t("unassigned")}</span>
            </div>
          )}
        </div>
      }
      buttonClassName="!px-3 !py-2 w-full bg-layer-2"
      options={[
        ...(options ?? []),
        {
          value: "none",
          query: "none",
          content: (
            <div className="flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 rotate-90 text-placeholder" />
              <span className="py-0.5 text-13 text-placeholder">{t("unassigned")}</span>
            </div>
          ),
        },
      ]}
      maxHeight="md"
      onChange={onChange}
      disabled={isDisabled}
    />
  );
});
