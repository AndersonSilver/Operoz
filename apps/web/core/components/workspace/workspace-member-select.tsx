import { observer } from "mobx-react";
import { Ban } from "lucide-react";
import { EUserPermissions } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import type { IUserLite } from "@operis/types";
import { Avatar, CustomSearchSelect } from "@operis/ui";
import { getFileURL } from "@operis/utils";
import { useMember } from "@/hooks/store/use-member";

type Props = {
  workspaceSlug: string;
  value: string | null | undefined;
  onChange: (val: string) => void;
  /** Fallback quando o membro vem da API mas ainda não está no mapa local */
  selectedMemberFromApi?: IUserLite | null;
  isDisabled?: boolean;
  /** Quando false, oculta opção «Não atribuído» (ex.: modal de adicionar pessoa) */
  allowEmpty?: boolean;
  placeholder?: string;
};

export const WorkspaceMemberSelect = observer(function WorkspaceMemberSelect(props: Props) {
  const {
    workspaceSlug,
    value,
    onChange,
    selectedMemberFromApi,
    isDisabled = false,
    allowEmpty = true,
    placeholder,
  } = props;
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
            <Avatar name={memberDetails.member.display_name} src={getFileURL(memberDetails.member.avatar_url)} />
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

  const emptyOption = allowEmpty
    ? [
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
      ]
    : [];

  return (
    <CustomSearchSelect
      value={value ?? ""}
      label={
        <div className="flex h-3.5 min-h-5 items-center gap-2">
          {displayMember && <Avatar name={displayMember.display_name} src={getFileURL(displayMember.avatar_url)} />}
          {displayMember ? (
            <span className="truncate text-13 text-primary">{displayMember.display_name}</span>
          ) : (
            <span className="text-13 text-placeholder">{placeholder ?? t("unassigned")}</span>
          )}
        </div>
      }
      buttonClassName="!px-3 !py-2.5 w-full rounded-md border border-subtle bg-layer-2 text-left"
      options={[...(options ?? []), ...emptyOption]}
      maxHeight="md"
      onChange={onChange}
      disabled={isDisabled}
    />
  );
});
