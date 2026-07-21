import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Search, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBoardCircle } from "@operoz/types";
import { Input, Loader } from "@operoz/ui";
import { useBoardAccess } from "@/hooks/store/use-board-access";
import { BoardCircleCard } from "./board-circle-card";
import { BoardCircleCreateCard } from "./board-circle-create-card";
import { BoardCircleFormModal } from "./board-circle-form-modal";
import { BoardCircleMembersModal } from "./board-circle-members-modal";
import { BoardCirclesSettingsHero } from "./board-circles-settings-hero";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardName: string;
};

const GRID_CLASS = "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]";

export const BoardCirclesSettings = observer(function BoardCirclesSettings(props: Props) {
  const { workspaceSlug, boardSlug, boardName } = props;
  const { t } = useTranslation();
  const { fetchBoardRoles, fetchBoardCircles, getBoardCircles, deleteBoardCircle } = useBoardAccess();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCircle, setEditCircle] = useState<IBoardCircle | null>(null);
  const [membersCircle, setMembersCircle] = useState<IBoardCircle | null>(null);
  const [search, setSearch] = useState("");

  const { isLoading } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_CIRCLES_${workspaceSlug}_${boardSlug}` : null,
    async () => {
      await fetchBoardRoles(workspaceSlug, boardSlug);
      return fetchBoardCircles(workspaceSlug, boardSlug);
    },
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false }
  );

  const circles = getBoardCircles(workspaceSlug, boardSlug);
  const reload = () => void fetchBoardCircles(workspaceSlug, boardSlug);
  const totalMembers = circles.reduce((sum, circle) => sum + circle.member_count, 0);

  const filteredCircles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return circles;
    return circles.filter((circle) => circle.name.toLowerCase().includes(query));
  }, [circles, search]);

  const handleDelete = async (circle: IBoardCircle) => {
    try {
      await deleteBoardCircle(workspaceSlug, boardSlug, circle.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.circles.delete_success_title"),
        message: t("boards.settings.circles.delete_success_message", { name: circle.name }),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <BoardCircleFormModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        isOpen={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSaved={reload}
      />
      {editCircle && (
        <BoardCircleFormModal
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          isOpen={Boolean(editCircle)}
          mode="edit"
          circle={editCircle}
          onClose={() => setEditCircle(null)}
          onSaved={reload}
        />
      )}
      <BoardCircleMembersModal
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        circle={membersCircle}
        isOpen={Boolean(membersCircle)}
        onClose={() => setMembersCircle(null)}
      />

      <BoardCirclesSettingsHero boardName={boardName} circleCount={circles.length} memberCount={totalMembers} />

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-13 font-semibold text-secondary">{t("boards.settings.circles.heading")}</h2>
            <span className="rounded-full bg-layer-2 px-2 py-0.5 text-11 text-tertiary">{circles.length}</span>
          </div>
        </div>

        {circles.length > 0 && (
          <div className="mb-4 rounded-xl border border-subtle bg-layer-1 p-3">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-placeholder" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("boards.settings.circles.search_placeholder")}
                className="w-full rounded-lg border-subtle bg-surface-1 pr-8 pl-8 text-13"
              />
              {search && (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-tertiary hover:text-primary"
                  onClick={() => setSearch("")}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {isLoading && circles.length === 0 ? (
          <div className={GRID_CLASS}>
            <Loader className="w-full">
              <Loader.Item height="168px" />
            </Loader>
            <Loader className="w-full">
              <Loader.Item height="168px" />
            </Loader>
            <Loader className="w-full">
              <Loader.Item height="168px" />
            </Loader>
          </div>
        ) : filteredCircles.length === 0 && search ? (
          <p className="rounded-xl border border-subtle bg-layer-1 px-4 py-10 text-center text-13 text-tertiary">
            {t("boards.settings.circles.no_results")}
          </p>
        ) : (
          <div className={GRID_CLASS}>
            <BoardCircleCreateCard
              label={t("boards.settings.circles.create_circle")}
              hint={t("boards.settings.circles.list_hint")}
              onClick={() => setCreateOpen(true)}
            />
            {filteredCircles.map((circle) => (
              <BoardCircleCard
                key={circle.id}
                circle={circle}
                onManageMembers={() => setMembersCircle(circle)}
                onEdit={() => setEditCircle(circle)}
                onDelete={() => void handleDelete(circle)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
});
