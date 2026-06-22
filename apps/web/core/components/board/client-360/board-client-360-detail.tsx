import { useState } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import type { IBoard } from "@operis/types";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";
import { Client360DetailContent } from "@/components/board/client-360/client-360-detail-content";
import { Client360DetailHeader } from "@/components/board/client-360/client-360-detail-header";
import { Client360PageShell } from "@/components/board/client-360/client-360-ui";
import {
  CLIENT_360_SWR_CONFIG,
  defaultWeekPeriod,
  periodFromQuery,
} from "@/components/board/client-360/client-360-utils";
import { useAppRouter } from "@/hooks/use-app-router";
import { BoardService } from "@/services/board/board.service";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  projectId: string;
};

const boardService = new BoardService();

export function BoardClient360Detail({ workspaceSlug, board, projectId }: Props) {
  const { t } = useTranslation();
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState(() => periodFromQuery(searchParams) ?? defaultWeekPeriod());

  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && board.slug && projectId
      ? `CLIENT_360_DETAIL_${workspaceSlug}_${board.slug}_${projectId}_${period.start}_${period.end}`
      : null,
    () =>
      boardService.getClient360Detail(workspaceSlug, board.slug, projectId, {
        period_start: period.start,
        period_end: period.end,
      }),
    CLIENT_360_SWR_CONFIG
  );

  const showInitialLoading = isLoading && !data && !error;

  const listHref = `/${workspaceSlug}/boards/${board.slug}/clientes`;
  const projectHref = `/${workspaceSlug}/projects/${projectId}/issues`;
  const statusReportHref = `/${workspaceSlug}/projects/${projectId}/status-report`;

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
        <p className="text-13 text-tertiary">{t("boards.client_360.load_error")}</p>
        <BoardHubNavLink to={listHref} className="text-13 text-accent-primary hover:underline">
          {t("boards.client_360.back_to_list")}
        </BoardHubNavLink>
      </div>
    );
  }

  if (showInitialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-13 text-tertiary">{t("boards.client_360.loading")}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
        <p className="text-13 text-tertiary">{t("boards.client_360.load_error")}</p>
        <BoardHubNavLink to={listHref} className="text-13 text-accent-primary hover:underline">
          {t("boards.client_360.back_to_list")}
        </BoardHubNavLink>
      </div>
    );
  }

  return (
    <Client360PageShell
      header={
        <Client360DetailHeader
          backLink={
            <BoardHubNavLink
              to={listHref}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-12 font-medium text-tertiary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.75} />
              {t("boards.client_360.back_to_list")}
            </BoardHubNavLink>
          }
          logo={<Logo logo={data.logo_props} size={24} />}
          data={data}
          period={period}
          onPeriodChange={setPeriod}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          exportParams={{
            scope: "board-client",
            workspaceSlug,
            boardSlug: board.slug,
            projectId,
            periodStart: period.start,
            periodEnd: period.end,
          }}
          onOpenProject={() => router.push(projectHref)}
          onOpenStatusReports={() => router.push(statusReportHref)}
        />
      }
    >
      <Client360DetailContent
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        period={period}
        data={data}
        statusReportHref={statusReportHref}
        onFinopsSaved={() => void mutate()}
      />
    </Client360PageShell>
  );
}
