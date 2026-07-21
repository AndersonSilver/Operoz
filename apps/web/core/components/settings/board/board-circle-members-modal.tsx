import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Info, UserPlus, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoardCircle } from "@operoz/types";
import { Avatar, EModalPosition, EModalWidth, Loader, ModalCore } from "@operoz/ui";
import { getFileURL } from "@operoz/utils";
import { WorkspaceMemberSelect } from "@/components/workspace/workspace-member-select";
import { useBoardAccess } from "@/hooks/store/use-board-access";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  circle: IBoardCircle | null;
  isOpen: boolean;
  onClose: () => void;
};

export const BoardCircleMembersModal = observer(function BoardCircleMembersModal(props: Props) {
  const { workspaceSlug, boardSlug, circle, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { fetchBoardCircleMembers, getBoardCircleMembers, addBoardCircleMembers, removeBoardCircleMember } =
    useBoardAccess();
  const [newMemberId, setNewMemberId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { isLoading } = useSWR(
    isOpen && circle ? `BOARD_CIRCLE_MEMBERS_${workspaceSlug}_${boardSlug}_${circle.id}` : null,
    () => fetchBoardCircleMembers(workspaceSlug, boardSlug, circle!.id),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  useEffect(() => {
    if (!isOpen) setNewMemberId("");
  }, [isOpen]);

  if (!circle) return null;

  const members = getBoardCircleMembers(workspaceSlug, boardSlug, circle.id);

  const handleAdd = async () => {
    if (!newMemberId) return;
    setIsAdding(true);
    try {
      await addBoardCircleMembers(workspaceSlug, boardSlug, circle.id, [newMemberId]);
      setNewMemberId("");
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.circles.add_success_title"),
        message: t("boards.settings.circles.add_success_message"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    try {
      await removeBoardCircleMember(workspaceSlug, boardSlug, circle.id, userId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.circles.remove_success_title"),
        message: t("boards.settings.circles.remove_success_message"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start gap-3 border-b border-subtle px-5 py-4">
          <span className="shadow-sm grid size-10 shrink-0 place-items-center rounded-lg border border-subtle bg-accent-subtle text-accent-primary">
            <Users className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-16 font-semibold text-primary">{t("boards.settings.circles.members_modal_title")}</h3>
              <span className="shrink-0 rounded-full bg-layer-2 px-2 py-0.5 text-11 text-tertiary">
                {members.length}
              </span>
            </div>
            <p className="mt-0.5 truncate text-13 text-tertiary">{circle.name}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 border-b border-subtle bg-accent-subtle/10 px-5 py-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-accent-primary" strokeWidth={1.75} />
          <p className="text-12 leading-relaxed text-secondary">{t("boards.settings.circles.members_hint")}</p>
        </div>

        <div className="flex items-center gap-2 border-b border-subtle px-5 py-3">
          <div className="min-w-0 flex-1">
            <WorkspaceMemberSelect
              workspaceSlug={workspaceSlug}
              value={newMemberId}
              onChange={setNewMemberId}
              allowEmpty={false}
              placeholder={t("boards.settings.circles.add_member_placeholder")}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleAdd()}
            loading={isAdding}
            disabled={!newMemberId}
            prependIcon={<UserPlus />}
          >
            {t("boards.settings.circles.add_member")}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading && members.length === 0 ? (
            <Loader className="w-full space-y-2">
              <Loader.Item height="44px" />
              <Loader.Item height="44px" />
            </Loader>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="grid size-9 place-items-center rounded-full bg-layer-2 text-tertiary">
                <Users className="size-4" strokeWidth={1.75} />
              </span>
              <p className="text-13 text-placeholder">{t("boards.settings.circles.members_empty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-subtle">
              {members.map((member) => (
                <li
                  key={member.user_id}
                  className="group flex items-center justify-between gap-2 rounded-md px-1.5 py-2 transition-colors hover:bg-layer-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={member.member?.display_name} src={getFileURL(member.member?.avatar_url)} />
                    <div className="min-w-0">
                      <p className="truncate text-13 font-medium text-primary">{member.member?.display_name}</p>
                      <p className="truncate text-11 text-tertiary">{member.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md px-2 py-1 text-12 font-medium text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-layer-1 hover:text-danger-primary"
                    onClick={() => void handleRemove(member.user_id)}
                    disabled={removingId === member.user_id}
                  >
                    {t("remove")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-subtle px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
