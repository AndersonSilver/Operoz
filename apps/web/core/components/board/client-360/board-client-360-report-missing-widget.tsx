import useSWR from "swr";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@operis/i18n";
import type { IBoard } from "@operis/types";
import { cn } from "@operis/utils";
import { CLIENT_360_BOARD_IDS_PARAM } from "@/components/board/client-360/client-360-board-filter";
import { CLIENT_360_FILTER_PARAM } from "@/components/board/client-360/client-360-client-filters";
import { CLIENT_360_SWR_CONFIG, defaultWeekPeriod } from "@/components/board/client-360/client-360-utils";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

export function BoardClient360ReportMissingWidget({ workspaceSlug, board }: Props) {
  const { t } = useTranslation();
  const period = defaultWeekPeriod();

  if (board.archived_at) return null;

  const { data, isLoading } = useSWR(
    workspaceSlug && board.slug ? `CLIENT_360_WIDGET_${workspaceSlug}_${board.slug}_${period.start}` : null,
    () =>
      boardService.getClient360(workspaceSlug, board.slug, {
        period_start: period.start,
        period_end: period.end,
      }),
    { ...CLIENT_360_SWR_CONFIG, refreshInterval: 60 * 60 * 1000 }
  );

  const missing = data?.summary?.report_missing ?? 0;
  const href = `/${workspaceSlug}/visao-360?${CLIENT_360_BOARD_IDS_PARAM}=${board.id}&${CLIENT_360_FILTER_PARAM}=report_missing`;
  const ok = !isLoading && missing === 0;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-layer-transparent-hover",
        ok ? "border-success-subtle bg-success-subtle/20" : "border-warning-subtle bg-warning-subtle/10"
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-sm border border-subtle bg-layer-2",
          ok ? "text-success-primary" : "text-warning-primary"
        )}
      >
        {ok ? (
          <CheckCircle2 className="size-4" strokeWidth={1.75} />
        ) : (
          <ClipboardList className="size-4" strokeWidth={1.75} />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-13 font-semibold text-primary">
          {isLoading
            ? t("boards.client_360.widget_report_loading")
            : ok
              ? t("boards.client_360.widget_report_all_ok")
              : t("boards.client_360.widget_report_missing", { count: missing })}
        </p>
        <p className="mt-0.5 text-12 text-secondary">{t("boards.client_360.widget_report_hint")}</p>
      </div>
    </Link>
  );
}
