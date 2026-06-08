import { ArrowLeft } from "lucide-react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import type { IBoard } from "@operis/types";
import { cn } from "@operis/utils";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

export const BoardSettingsSidebarHeader = observer(function BoardSettingsSidebarHeader(props: Props) {
  const { workspaceSlug, board } = props;
  const router = useAppRouter();
  const { t } = useTranslation();

  return (
    <div className="shrink-0 border-b border-subtle px-2.5 pt-2 pb-3">
      <button
        type="button"
        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-12 text-tertiary transition-colors hover:bg-layer-transparent-hover hover:text-secondary"
        onClick={() => router.push(`/${workspaceSlug}/settings/boards`)}
      >
        <ArrowLeft className="size-3.5 shrink-0" strokeWidth={1.75} />
        <span>{t("boards.settings.back_to_boards")}</span>
      </button>

      <div className="mt-2.5 flex min-w-0 items-center gap-2.5 rounded-lg border border-subtle/80 bg-layer-1/40 px-2.5 py-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle bg-layer-1">
          <Logo logo={board.logo_props} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-13 font-semibold text-primary">{board.name}</p>
          <p className={cn("truncate text-11 text-tertiary")}>{t("boards.settings.title")}</p>
        </div>
      </div>
    </div>
  );
});
