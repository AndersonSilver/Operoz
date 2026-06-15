import { useState } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { Client360DetailContent } from "@/components/board/client-360/client-360-detail-content";
import { Client360DetailHeader } from "@/components/board/client-360/client-360-detail-header";
import { useClient360Persona } from "@/components/board/client-360/use-client-360-persona";
import { Client360PageShell } from "@/components/board/client-360/client-360-ui";
import {
  CLIENT_360_SWR_CONFIG,
  defaultWeekPeriod,
  periodFromQuery,
} from "@/components/board/client-360/client-360-utils";
import { useAppRouter } from "@/hooks/use-app-router";
import { WorkspaceService } from "@/services/workspace.service";
import type { TLogoProps } from "@operis/types";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const workspaceService = new WorkspaceService();

export function WorkspaceClient360Detail({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState(() => periodFromQuery(searchParams) ?? defaultWeekPeriod());
  const { persona } = useClient360Persona("workspace");

  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && projectId
      ? `CLIENT_360_DETAIL_WS_${workspaceSlug}_${projectId}_${period.start}_${period.end}`
      : null,
    () =>
      workspaceService.getClient360Detail(workspaceSlug, projectId, {
        period_start: period.start,
        period_end: period.end,
      }),
    CLIENT_360_SWR_CONFIG
  );

  const showInitialLoading = isLoading && !data && !error;

  const listHref = `/${workspaceSlug}/visao-360`;
  const projectHref = `/${workspaceSlug}/projects/${projectId}/issues`;
  const statusReportHref = `/${workspaceSlug}/projects/${projectId}/status-report`;

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
        <p className="text-13 text-tertiary">{t("boards.client_360.load_error")}</p>
        <Link href={listHref} className="text-13 text-accent-primary hover:underline">
          {t("boards.client_360.back_to_list")}
        </Link>
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
        <Link href={listHref} className="text-13 text-accent-primary hover:underline">
          {t("boards.client_360.back_to_list")}
        </Link>
      </div>
    );
  }

  return (
    <Client360PageShell
      header={
        <Client360DetailHeader
          backLink={
            <Link
              href={listHref}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-12 font-medium text-tertiary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
            >
              <ArrowLeft className="size-3.5" strokeWidth={1.75} />
              {t("boards.client_360.back_to_list")}
            </Link>
          }
          logo={<Logo logo={data.logo_props as TLogoProps} size={24} />}
          data={data}
          period={period}
          onPeriodChange={setPeriod}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          exportParams={{
            scope: "workspace-client",
            workspaceSlug,
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
        persona={persona}
        statusReportHref={statusReportHref}
        onFinopsSaved={() => void mutate()}
      />
    </Client360PageShell>
  );
}
