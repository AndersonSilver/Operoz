/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import useSWR from "swr";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  FileText,
  Headphones,
  Layers,
  ListTodo,
} from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { IBoard } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";
import { Client360AiBrief } from "@/components/board/client-360/client-360-ai-brief";
import { Client360HealthBadge } from "@/components/board/client-360/client-360-health-badge";
import { Client360WeekNav } from "@/components/board/client-360/client-360-week-nav";
import {
  Client360ClientPeople,
  Client360MetaChip,
  Client360PageShell,
  Client360Section,
  Client360StatGrid,
  Client360StatTile,
  Client360StatusLozenge,
} from "@/components/board/client-360/client-360-ui";
import type { Client360Tone } from "@/components/board/client-360/client-360-tokens";
import {
  CLIENT_360_SWR_CONFIG,
  defaultWeekPeriod,
  reportCoverageLabelKey,
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
  const [period, setPeriod] = useState(() => defaultWeekPeriod());

  const { data, error, isLoading } = useSWR(
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

  const reportKey = reportCoverageLabelKey(data.status_report.coverage);

  return (
    <Client360PageShell
      header={
        <>
          <BoardHubNavLink
            to={listHref}
            className="mb-4 inline-flex items-center gap-1.5 text-12 font-medium text-tertiary hover:text-primary"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} />
            {t("boards.client_360.back_to_list")}
          </BoardHubNavLink>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-md border border-subtle bg-layer-2">
                <Logo logo={data.logo_props} size={26} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-16 font-semibold tracking-tight text-primary">{data.name}</h1>
                  <Client360HealthBadge health={data.health} />
                </div>
                <p className="mt-0.5 font-mono text-12 text-tertiary">{data.identifier}</p>
                <Client360ClientPeople
                  className="mt-1.5"
                  stakeholder={data.responsible_stakeholder}
                  responsibleName={data.project_lead?.display_name}
                  stakeholderLabel={t("boards.client_360.stakeholder")}
                  responsibleLabel={t("boards.client_360.responsible")}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => router.push(projectHref)}>
                <ExternalLink className="size-3.5" strokeWidth={1.75} />
                {t("boards.open_project")}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => router.push(statusReportHref)}>
                <FileText className="size-3.5" strokeWidth={1.75} />
                {t("boards.client_360.open_status_reports")}
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Client360WeekNav period={period} onPeriodChange={setPeriod} />
          </div>
        </>
      }
    >
      <Client360StatGrid>
        <Client360StatTile
          icon={FileText}
          label={t("boards.client_360.report_column")}
          value={t(reportKey)}
          tone={
            data.status_report.coverage === "complete"
              ? "success"
              : data.status_report.coverage === "partial"
                ? "warning"
                : data.status_report.coverage === "missing"
                  ? "danger"
                  : "neutral"
          }
        />
        <Client360StatTile
          icon={Clock}
          label={t("boards.client_360.overdue_short")}
          value={data.issues.overdue}
          tone="danger"
          highlightValue={data.issues.overdue > 0}
        />
        <Client360StatTile
          icon={Headphones}
          label={t("boards.client_360.support_short")}
          value={data.support.open_count}
          tone="info"
          highlightValue={data.support.open_count > 0}
        />
        <Client360StatTile
          icon={ListTodo}
          label={t("boards.overview_pending_kpi")}
          value={data.issues.pending}
          tone="accent"
        />
        {data.status_report.modules_total > 0 ? (
          <Client360StatTile
            icon={Layers}
            label={t("boards.client_360.modules_published_short")}
            value={`${data.status_report.modules_published}/${data.status_report.modules_total}`}
            tone={
              data.status_report.modules_published >= data.status_report.modules_total
                ? "success"
                : "warning"
            }
          />
        ) : null}
      </Client360StatGrid>

      <Client360AiBrief
        key={`${projectId}-${period.start}`}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        period={period}
        data={data}
      />

      {data.modules.length > 0 && (
        <Client360Section icon={Layers} iconTone="info" title={t("boards.client_360.modules_title")} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-13">
              <thead>
                <tr className="border-b border-subtle bg-layer-2 text-11 font-medium uppercase tracking-wide text-tertiary">
                  <th className="px-4 py-2.5">{t("boards.client_360.module_column")}</th>
                  <th className="px-4 py-2.5">{t("boards.client_360.report_column")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {data.modules.map((row) => (
                  <tr key={row.module_id ?? "project"} className="hover:bg-layer-transparent-hover">
                    <td className="px-4 py-3 text-primary">
                      {row.module_name ?? t("boards.client_360.report_project_level")}
                    </td>
                    <td className="px-4 py-3">
                      <ModuleStatusCell
                        status={row.status}
                        reportId={row.report_id}
                        publishedAt={row.published_at}
                        statusReportHref={statusReportHref}
                        t={t}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Client360Section>
      )}

      {data.overdue_issues.length > 0 && (
        <IssueSection
          icon={Clock}
          iconTone="danger"
          title={t("boards.client_360.overdue_section")}
          issues={data.overdue_issues}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          showDate
        />
      )}

      {data.support_issues.length > 0 && (
        <IssueSection
          icon={Headphones}
          iconTone="info"
          title={t("boards.client_360.support_section")}
          issues={data.support_issues}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          showType
        />
      )}
    </Client360PageShell>
  );
}

function ModuleStatusCell({
  status,
  reportId,
  publishedAt,
  statusReportHref,
  t,
}: {
  status: "published" | "draft" | "missing";
  reportId: string | null;
  publishedAt: string | null;
  statusReportHref: string;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const label =
    status === "published"
      ? t("boards.status_report.published")
      : status === "draft"
        ? t("boards.status_report.draft")
        : t("boards.client_360.report_missing");

  const content = (
    <span className="inline-flex items-center gap-2 text-13 text-secondary">
      <Client360StatusLozenge status={status} />
      {label}
      {publishedAt ? (
        <span className="text-11 text-tertiary">· {renderFormattedDate(publishedAt)}</span>
      ) : null}
    </span>
  );

  if (reportId) {
    return (
      <a href={`${statusReportHref}/${reportId}`} className="hover:underline">
        {content}
      </a>
    );
  }

  return content;
}

function IssueSection({
  icon: Icon,
  iconTone,
  title,
  issues,
  workspaceSlug,
  projectId,
  showDate,
  showType,
}: {
  icon: typeof Clock;
  iconTone?: Client360Tone;
  title: string;
  issues: Array<{
    id: string;
    name: string;
    sequence_id: number;
    target_date: string | null;
    state__name?: string;
    type__name?: string;
  }>;
  workspaceSlug: string;
  projectId: string;
  showDate?: boolean;
  showType?: boolean;
}) {
  const router = useAppRouter();

  return (
    <Client360Section icon={Icon} title={title} noPadding>
      <ul className="divide-y divide-subtle">
        {issues.map((issue) => (
          <li key={issue.id}>
            <button
              type="button"
              onClick={() =>
                router.push(`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`)
              }
              className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-layer-transparent-hover"
            >
              <span className="text-13 font-medium text-primary">{issue.name}</span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-11 text-tertiary">
                <span>#{issue.sequence_id}</span>
                {issue.state__name ? <span>{issue.state__name}</span> : null}
                {showType && issue.type__name ? <span>{issue.type__name}</span> : null}
                {showDate && issue.target_date ? (
                  <Client360MetaChip icon={Clock} tone="danger">
                    {renderFormattedDate(issue.target_date)}
                  </Client360MetaChip>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Client360Section>
  );
}
