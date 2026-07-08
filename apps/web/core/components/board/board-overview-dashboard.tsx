import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, CheckCircle2, ClipboardList, Layers, Pencil, PieChart as PieChartIcon, Save } from "lucide-react";
import { ISSUE_PRIORITY_FILTERS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { PieChart } from "@operoz/propel/charts/pie-chart";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import type { IBoardMeta } from "@operoz/types";
import { Avatar } from "@operoz/ui";
import { calculateTimeAgo, cn, getFileURL } from "@operoz/utils";
import { Client360BreakdownRow } from "@/components/board/client-360/client-360-ui";
import type { Client360Tone } from "@/components/board/client-360/client-360-tokens";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import { useAppRouter } from "@/hooks/use-app-router";
import { aggregateBoardStateDistributionByGroup } from "./board-overview-state.utils";

const PRIORITY_ORDER = ["urgent", "high", "medium", "low", "none"] as const;

const PRIORITY_BAR_COLORS: Record<string, string> = {
  urgent: "var(--priority-urgent)",
  high: "var(--priority-high)",
  medium: "var(--priority-medium)",
  low: "var(--priority-low)",
  none: "var(--priority-none)",
};

/** Cartão sólido — legível sobre wallpaper, sem vidro extra. */
const OVERVIEW_CARD = "overflow-hidden rounded-lg border border-subtle bg-layer-1 shadow-sm";

function BoardOverviewWidget({
  title,
  icon: Icon,
  iconTone = "neutral",
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  iconTone?: Client360Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const tone = CLIENT_360_TONE[iconTone];

  return (
    <section className={cn(OVERVIEW_CARD, className)}>
      <header className="flex items-center gap-2.5 border-b border-subtle px-4 py-3">
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-sm", tone.iconBg)}>
          <Icon className={cn("size-3.5", tone.icon)} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="text-13 font-semibold text-primary">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  iconClassName: string;
}) {
  return (
    <div className={cn(OVERVIEW_CARD, "flex items-start gap-3 p-4")}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-sm border border-subtle bg-layer-2",
          iconClassName
        )}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-20 leading-tight font-semibold text-primary tabular-nums">{value}</p>
        <p className="mt-1 text-11 leading-snug text-secondary">{label}</p>
      </div>
    </div>
  );
}

export function BoardOverviewKpiStrip({ meta }: { meta: IBoardMeta }) {
  const { t } = useTranslation();
  const activity = meta.activity_last_7_days;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        icon={CheckCircle2}
        value={activity.completed}
        label={t("boards.overview_kpi_completed_7d")}
        iconClassName="text-success-primary"
      />
      <KpiCard
        icon={Pencil}
        value={activity.updated}
        label={t("boards.overview_kpi_updated_7d")}
        iconClassName="text-accent-primary"
      />
      <KpiCard
        icon={ClipboardList}
        value={activity.created}
        label={t("boards.overview_kpi_created_7d")}
        iconClassName="text-info-primary"
      />
      <KpiCard
        icon={Save}
        value={meta.due_soon}
        label={t("boards.overview_kpi_due_soon")}
        iconClassName="text-warning-primary"
      />
    </div>
  );
}

export function BoardOverviewStatusChart({ meta }: { meta: IBoardMeta }) {
  const { t } = useTranslation();
  const total = meta.total_issues;

  const groupedStates = useMemo(
    () => aggregateBoardStateDistributionByGroup(meta.state_distribution),
    [meta.state_distribution]
  );

  const chartData = useMemo(
    () =>
      groupedStates.map((row) => ({
        id: row.group,
        key: row.group,
        value: row.count,
        name: t(`workspace_projects.state.${row.group}`),
        color: row.color,
      })),
    [groupedStates, t]
  );

  if (!total) {
    return (
      <EmptyStateCompact assetKey="work-item" assetClassName="size-16" title={t("boards.overview_status_empty")} />
    );
  }

  return (
    <div className="grid min-h-[260px] grid-cols-1 gap-4 md:grid-cols-2">
      <div className="relative h-[220px] w-full">
        <PieChart
          className="size-full"
          dataKey="value"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          data={chartData}
          cells={chartData.map((row) => ({ key: row.key, fill: row.color }))}
          showTooltip
          tooltipLabel={t("boards.overview_chart_count")}
          paddingAngle={3}
          cornerRadius={3}
          innerRadius="58%"
          outerRadius="88%"
          showLabel={false}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-22 font-semibold text-primary tabular-nums">{total}</span>
          <span className="mt-0.5 max-w-[7rem] text-11 leading-tight text-tertiary">
            {t("boards.overview_status_total")}
          </span>
        </div>
      </div>
      <ul className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
        {groupedStates.map((row) => (
          <li key={row.group} className="flex items-center justify-between gap-2 text-12">
            <span className="flex min-w-0 items-center gap-2 text-secondary">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="truncate">{t(`workspace_projects.state.${row.group}`)}</span>
            </span>
            <span className="shrink-0 font-medium text-primary tabular-nums">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BoardOverviewPriorityChart({ meta }: { meta: IBoardMeta }) {
  const { t } = useTranslation();

  const rows = useMemo(() => {
    const byKey = Object.fromEntries(meta.priority_distribution.map((r) => [r.priority, r.count]));
    return PRIORITY_ORDER.map((key) => ({
      key,
      count: byKey[key] ?? 0,
      label: t(ISSUE_PRIORITY_FILTERS.find((p) => p.key === key)?.titleTranslationKey ?? "common.none"),
    }));
  }, [meta.priority_distribution, t]);

  const max = Math.max(...rows.map((r) => r.count), 1);

  if (!meta.total_issues) {
    return (
      <EmptyStateCompact assetKey="priority" assetClassName="size-16" title={t("boards.overview_priority_empty")} />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-[168px] items-end justify-between gap-2 px-1">
        {rows.map((row) => {
          const barHeight = row.count > 0 ? Math.max(Math.round((row.count / max) * 168), 6) : 3;
          return (
            <div key={row.key} className="flex min-w-0 flex-1 items-end justify-center">
              <div
                className="w-full max-w-[2.75rem] shrink-0 rounded-t-md"
                style={{
                  height: barHeight,
                  backgroundColor: PRIORITY_BAR_COLORS[row.key],
                  opacity: row.count ? 0.92 : 0.2,
                }}
                title={`${row.label}: ${row.count}`}
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-5 gap-1 border-t border-subtle/60 pt-3">
        {rows.map((row) => (
          <div key={row.key} className="flex min-w-0 flex-col items-center gap-0.5 text-center">
            <span className="text-12 font-semibold text-primary tabular-nums">{row.count > 0 ? row.count : "—"}</span>
            <span className="max-w-full truncate text-10 text-tertiary">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardOverviewTypeChart({ meta }: { meta: IBoardMeta }) {
  const { t } = useTranslation();
  const total = meta.total_issues;

  if (!total || meta.type_distribution.length === 0) {
    return <EmptyStateCompact assetKey="work-item" assetClassName="size-16" title={t("boards.overview_types_empty")} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {meta.type_distribution.slice(0, 8).map((row, index) => (
        <Client360BreakdownRow
          key={row.type_id ?? row.type_name}
          label={row.type_name}
          value={row.count}
          total={total}
          tone={index % 2 === 0 ? "accent" : "info"}
        />
      ))}
    </div>
  );
}

function formatActivityMessage(verb: string, field: string | null, t: ReturnType<typeof useTranslation>["t"]): string {
  if (verb === "created") return t("boards.overview_activity_created");
  if (verb === "deleted") return t("boards.overview_activity_deleted");
  if (field === "state") return t("boards.overview_activity_state");
  if (field === "priority") return t("boards.overview_activity_priority");
  if (field === "assignees") return t("boards.overview_activity_assignees");
  if (field === "target_date") return t("boards.overview_activity_target_date");
  return t("boards.overview_activity_updated");
}

export function BoardOverviewRecentActivity({ meta, workspaceSlug }: { meta: IBoardMeta; workspaceSlug: string }) {
  const { t } = useTranslation();
  const router = useAppRouter();

  if (meta.recent_activity.length === 0) {
    return <EmptyStateCompact assetKey="update" assetClassName="size-16" title={t("boards.overview_activity_empty")} />;
  }

  return (
    <ul className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
      {meta.recent_activity.map((item) => {
        const issue = item.issue;
        const identifier = issue ? `${issue.project_identifier}-${issue.sequence_id}` : null;
        const action = formatActivityMessage(item.verb, item.field, t);

        return (
          <li key={item.id} className="flex gap-2.5 text-12">
            {item.actor ? (
              <Avatar
                name={item.actor.display_name}
                src={getFileURL(item.actor.avatar_url)}
                size="sm"
                showTooltip={false}
              />
            ) : (
              <span className="size-6 shrink-0 rounded-full bg-layer-2" />
            )}
            <div className="min-w-0 flex-1">
              <p className="leading-snug text-secondary">
                {item.actor ? (
                  <span className="font-medium text-primary">{item.actor.display_name}</span>
                ) : (
                  <span className="font-medium text-primary">{t("boards.overview_activity_system")}</span>
                )}{" "}
                {action}
                {issue ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="font-medium text-accent-primary hover:underline"
                      onClick={() => router.push(`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`)}
                    >
                      {identifier}
                    </button>
                    <span className="text-tertiary"> · {issue.name}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-0.5 text-11 text-placeholder">{calculateTimeAgo(item.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BoardOverviewDashboard({ meta, workspaceSlug }: { meta: IBoardMeta; workspaceSlug: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <BoardOverviewKpiStrip meta={meta} />

      <div className="grid gap-4 lg:grid-cols-2">
        <BoardOverviewWidget title={t("boards.overview_status_title")} icon={PieChartIcon} iconTone="info">
          <BoardOverviewStatusChart meta={meta} />
        </BoardOverviewWidget>

        <BoardOverviewWidget title={t("boards.overview_activity_title")} icon={Activity} iconTone="accent">
          <BoardOverviewRecentActivity meta={meta} workspaceSlug={workspaceSlug} />
        </BoardOverviewWidget>

        <BoardOverviewWidget title={t("boards.overview_priority_title")} icon={Layers} iconTone="warning">
          <BoardOverviewPriorityChart meta={meta} />
        </BoardOverviewWidget>

        <BoardOverviewWidget title={t("boards.overview_types_title")} icon={ClipboardList} iconTone="neutral">
          <BoardOverviewTypeChart meta={meta} />
        </BoardOverviewWidget>
      </div>
    </div>
  );
}
