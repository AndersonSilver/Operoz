import type { ReactNode } from "react";
import { History } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
import { BOARD_HUB_CYCLE_SECTION_HEADER } from "@/components/board/board-hub-background";

type Props = {
  count: number;
  toolbar: ReactNode;
};

export function StatusReportHistoryHeader(props: Props) {
  const { count, toolbar } = props;
  const { t } = useTranslation();

  return (
    <div className={cn(BOARD_HUB_CYCLE_SECTION_HEADER, "flex flex-col gap-3 px-4 py-3")}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle/50 bg-layer-2/80 text-secondary">
            <History className="size-4" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-13 font-semibold text-primary">{t("project.status_report.history_title")}</h2>
            <p className="text-11 text-tertiary">{t("project.status_report.history_count", { count })}</p>
          </div>
        </div>
        <div className="flex w-full min-w-0 justify-end sm:w-auto">{toolbar}</div>
      </div>
    </div>
  );
}
