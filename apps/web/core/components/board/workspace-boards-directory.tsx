import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Copy, ExternalLink, MoreHorizontal, Search } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Avatar } from "@operis/propel/avatar";
import { EmptyStateCompact } from "@operis/propel/empty-state";
import { setToast, TOAST_TYPE } from "@operis/propel/toast";
import { Logo } from "@operis/propel/emoji-icon-picker";
import type { IBoard, IUserLite, TBoardSpaceType } from "@operis/types";
import { CustomMenu, CustomSelect, Loader } from "@operis/ui";
import { cn, getFileURL } from "@operis/utils";
import { BoardFavoriteStar } from "@/components/board/board-favorite-star";
import {
  BOARD_SPACE_TYPES,
  getBoardIdentifier,
  getBoardSpaceUrl,
  isBoardSpaceType,
} from "@/components/board/board-spaces-utils";
import { CreateBoardModal } from "@/components/board/create-board-modal";
import { useBoard } from "@/hooks/store/use-board";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  isLoading?: boolean;
};

type SortKey = "name" | "identifier" | "category";

const SPACES_FILTER_INPUT_CLASS =
  "h-9 w-full rounded-sm border border-subtle bg-layer-1 pl-8 pr-3 text-13 text-primary placeholder:text-tertiary focus:border-strong focus:outline-none focus:ring-1 focus:ring-accent-primary";

const SPACES_FILTER_SELECT_CLASS =
  "h-9 min-w-[11rem] !rounded-sm !border-subtle !bg-layer-1 !px-3 !py-0 !text-13 !font-normal shadow-none hover:!bg-layer-1";

function resolveBoardLead(lead: IBoard["board_lead"]): IUserLite | null {
  if (!lead || typeof lead === "string") return null;
  return lead;
}

function getSpaceTypeLabel(t: (key: string) => string, spaceType?: string): string {
  if (spaceType === "company_managed") return t("boards.spaces_type_company_managed");
  return t("boards.spaces_type_team_managed");
}

export const WorkspaceBoardsDirectory = observer(function WorkspaceBoardsDirectory(props: Props) {
  const { workspaceSlug, isLoading = false } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const { currentWorkspaceBoardIds, getBoardById, isBoardFavorite } = useBoard();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | TBoardSpaceType>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const allBoards = useMemo(() => {
    return currentWorkspaceBoardIds
      .map((id) => getBoardById(id))
      .filter((b): b is IBoard => Boolean(b && !b.archived_at));
  }, [currentWorkspaceBoardIds, getBoardById]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allBoards.forEach((b) => {
      const c = b.category?.trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allBoards]);

  const boards = useMemo(() => {
    let items = [...allBoards];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      items = items.filter((b) => {
        const key = getBoardIdentifier(b);
        return (
          b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          key.toLowerCase().includes(q) ||
          (b.category?.toLowerCase().includes(q) ?? false) ||
          (b.description?.toLowerCase().includes(q) ?? false)
        );
      });
    }

    if (typeFilter) {
      items = items.filter((b) => (b.space_type ?? "team_managed") === typeFilter);
    }

    if (categoryFilter) {
      items = items.filter((b) => (b.category?.trim() ?? "") === categoryFilter);
    }

    const dir = sortAsc ? 1 : -1;
    items.sort((a, b) => {
      const aFav = isBoardFavorite(a.id) ? 1 : 0;
      const bFav = isBoardFavorite(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      if (sortKey === "identifier") {
        return getBoardIdentifier(a).localeCompare(getBoardIdentifier(b)) * dir;
      }
      if (sortKey === "category") {
        return (a.category ?? "").localeCompare(b.category ?? "") * dir;
      }
      return a.name.localeCompare(b.name) * dir;
    });

    return items;
  }, [allBoards, categoryFilter, isBoardFavorite, searchQuery, sortAsc, sortKey, typeFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const openBoard = (slug: string) => {
    router.push(`/${workspaceSlug}/boards/${slug}`);
  };

  const copyBoardUrl = async (board: IBoard) => {
    const url = getBoardSpaceUrl(workspaceSlug, board.slug);
    try {
      await navigator.clipboard.writeText(url);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.spaces_url_copied"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-surface-1">
      <CreateBoardModal workspaceSlug={workspaceSlug} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <div className="mx-auto flex w-full max-w-none flex-col gap-4 px-8 py-6 xl:px-12">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-2xl">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-tertiary" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("boards.spaces_search_placeholder")}
              className={SPACES_FILTER_INPUT_CLASS}
            />
          </div>

          <CustomSelect
            input
            value={typeFilter}
            onChange={(val: string) => setTypeFilter(isBoardSpaceType(val) ? val : "")}
            label={typeFilter ? getSpaceTypeLabel(t, typeFilter) : t("boards.spaces_filter_type")}
            buttonClassName={SPACES_FILTER_SELECT_CLASS}
          >
            <CustomSelect.Option value="">{t("boards.spaces_filter_all_types")}</CustomSelect.Option>
            {BOARD_SPACE_TYPES.map((type) => (
              <CustomSelect.Option key={type} value={type}>
                {getSpaceTypeLabel(t, type)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>

          <CustomSelect
            input
            value={categoryFilter}
            onChange={(val: string) => setCategoryFilter(val)}
            label={categoryFilter || t("boards.spaces_filter_category")}
            buttonClassName={SPACES_FILTER_SELECT_CLASS}
          >
            <CustomSelect.Option value="">{t("boards.spaces_filter_all_categories")}</CustomSelect.Option>
            {categories.map((category) => (
              <CustomSelect.Option key={category} value={category}>
                {category}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>

        {isLoading ? (
          <Loader className="w-full space-y-2">
            <Loader.Item height="48px" />
            <Loader.Item height="48px" />
            <Loader.Item height="48px" />
          </Loader>
        ) : boards.length === 0 ? (
          <EmptyStateCompact
            assetKey="project"
            title={searchQuery || typeFilter || categoryFilter ? t("boards.spaces_empty_search") : t("boards.empty")}
            description={
              searchQuery || typeFilter || categoryFilter ? undefined : t("boards.spaces_empty_description")
            }
            actions={
              searchQuery || typeFilter || categoryFilter
                ? undefined
                : [
                    {
                      label: t("boards.spaces_create"),
                      onClick: () => setIsCreateOpen(true),
                    },
                  ]
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-subtle">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-subtle bg-layer-2 text-11 font-medium text-tertiary">
                  <th className="w-9 px-3 py-2" aria-label={t("boards.spaces_col_favorite")} />
                  <th className="px-4 py-2 font-medium">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-primary"
                      onClick={() => toggleSort("name")}
                    >
                      {t("boards.spaces_col_name")}
                      {sortKey === "name" ? <ChevronDown className={cn("size-3", !sortAsc && "rotate-180")} /> : null}
                    </button>
                  </th>
                  <th className="hidden w-24 px-4 py-2 font-medium lg:table-cell">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-primary"
                      onClick={() => toggleSort("identifier")}
                    >
                      {t("boards.spaces_col_key")}
                      {sortKey === "identifier" ? (
                        <ChevronDown className={cn("size-3", !sortAsc && "rotate-180")} />
                      ) : null}
                    </button>
                  </th>
                  <th className="hidden min-w-[200px] px-4 py-2 font-medium xl:table-cell">
                    {t("boards.spaces_col_type")}
                  </th>
                  <th className="hidden px-4 py-2 font-medium md:table-cell">{t("boards.spaces_col_lead")}</th>
                  <th className="hidden w-36 px-4 py-2 font-medium lg:table-cell">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-primary"
                      onClick={() => toggleSort("category")}
                    >
                      {t("boards.spaces_col_category")}
                      {sortKey === "category" ? (
                        <ChevronDown className={cn("size-3", !sortAsc && "rotate-180")} />
                      ) : null}
                    </button>
                  </th>
                  <th className="hidden min-w-[180px] px-4 py-2 font-medium 2xl:table-cell">
                    {t("boards.spaces_col_url")}
                  </th>
                  <th className="w-9 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {boards.map((board) => {
                  const lead = resolveBoardLead(board.board_lead);
                  const boardKey = getBoardIdentifier(board);
                  const spaceUrl = getBoardSpaceUrl(workspaceSlug, board.slug);

                  return (
                    <tr
                      key={board.id}
                      className="group cursor-pointer border-b border-subtle last:border-b-0 hover:bg-layer-transparent-hover"
                      onClick={() => openBoard(board.slug)}
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <BoardFavoriteStar
                          workspaceSlug={workspaceSlug}
                          boardId={board.id}
                          buttonClassName="size-6"
                          iconClassName="size-3"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid size-6 shrink-0 place-items-center rounded border border-subtle bg-layer-2">
                            <Logo logo={board.logo_props} size={14} />
                          </span>
                          <span className="truncate text-12 font-medium text-accent-primary group-hover:underline">
                            {board.name}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-2 lg:table-cell">
                        <span className="font-mono text-11 font-medium text-secondary">{boardKey}</span>
                      </td>
                      <td className="hidden px-4 py-2 text-12 text-secondary xl:table-cell">
                        {getSpaceTypeLabel(t, board.space_type)}
                      </td>
                      <td className="hidden px-4 py-2 md:table-cell">
                        {lead ? (
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Avatar name={lead.display_name} src={getFileURL(lead.avatar_url)} size="sm" />
                            <span className="truncate text-12 text-secondary">{lead.display_name}</span>
                          </div>
                        ) : (
                          <span className="text-12 text-tertiary">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2 lg:table-cell">
                        <span className="truncate text-12 text-secondary">{board.category?.trim() || "—"}</span>
                      </td>
                      <td className="hidden px-4 py-2 2xl:table-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="inline-flex max-w-full items-center gap-1 truncate text-11 text-accent-primary hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void copyBoardUrl(board);
                          }}
                          title={t("boards.spaces_copy_url")}
                        >
                          <span className="truncate">{spaceUrl.replace(/^https?:\/\//, "")}</span>
                          <Copy className="size-3 shrink-0 opacity-60" />
                        </button>
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <CustomMenu
                          customButton={
                            <button
                              type="button"
                              className="grid size-6 place-items-center rounded text-tertiary opacity-0 transition-opacity hover:bg-layer-2 hover:text-primary group-hover:opacity-100"
                              aria-label={t("boards.spaces_row_menu")}
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          }
                          placement="bottom-end"
                          closeOnSelect
                        >
                          <CustomMenu.MenuItem onClick={() => openBoard(board.slug)}>
                            <span className="flex items-center gap-2">
                              {t("boards.open_board")}
                              <ExternalLink className="size-3 opacity-60" />
                            </span>
                          </CustomMenu.MenuItem>
                          <CustomMenu.MenuItem onClick={() => void copyBoardUrl(board)}>
                            {t("boards.spaces_copy_url")}
                          </CustomMenu.MenuItem>
                          <CustomMenu.MenuItem
                            onClick={() =>
                              router.push(`/${workspaceSlug}/settings/boards/${board.slug}`)
                            }
                          >
                            {t("boards.spaces_settings")}
                          </CustomMenu.MenuItem>
                        </CustomMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

