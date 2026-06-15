import Link from "next/link";
import { AlertTriangle, Ban, CalendarRange, Gauge, GitBranch, Inbox, LayoutGrid, ShieldAlert } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360DetailResponse, TClient360OperationalPayload } from "@operis/types";
import { cn } from "@operis/utils";
import { Client360CompactMetric, Client360SubPanel } from "@/components/board/client-360/client-360-detail-group";
import { Client360Section, Client360StatusLozenge } from "@/components/board/client-360/client-360-ui";
import { reportCoverageHeatmapClass } from "@/components/board/client-360/client-360-utils";

type Props = {
  workspaceSlug: string;
  projectId: string;
  data: TClient360DetailResponse;
  variant?: "default" | "compact";
  /** When true, compact view renders without outer section chrome (for tab panels). */
  embedded?: boolean;
};

function RaidTable({
  items,
  workspaceSlug,
  projectId,
}: {
  items: TClient360OperationalPayload["raid"]["risk"];
  workspaceSlug: string;
  projectId: string;
}) {
  if (!items.length) return null;
  return (
    <ul className="divide-y divide-subtle">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-1.5 text-12">
          <Link
            href={`/${workspaceSlug}/projects/${projectId}/issues/${item.id}`}
            className="truncate font-medium text-accent-primary hover:underline"
          >
            #{item.sequence_id} {item.name}
          </Link>
          <span className="shrink-0 text-11 text-tertiary">{item.age_days}d</span>
        </li>
      ))}
    </ul>
  );
}

function hasRaidItems(op: TClient360OperationalPayload) {
  return (["risk", "assumption", "issue", "dependency"] as const).some((key) => op.raid[key].length > 0);
}

function reportLabelFromHeatmap(status: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (status === "complete") return t("boards.status_report.published");
  if (status === "partial") return t("boards.status_report.draft");
  if (status === "missing") return t("boards.client_360.report_missing");
  return "—";
}

function reportStatusFromHeatmap(status: string): "published" | "draft" | "missing" {
  if (status === "complete") return "published";
  if (status === "partial") return "draft";
  return "missing";
}

export function Client360OperationalSections({ workspaceSlug, projectId, data, variant = "default", embedded }: Props) {
  const { t } = useTranslation();
  const op = data.operational;
  if (!op) return null;

  if (variant === "compact") {
    return (
      <Client360OperationalCompact
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        data={data}
        op={op}
        embedded={embedded}
      />
    );
  }

  return <Client360OperationalDefault workspaceSlug={workspaceSlug} projectId={projectId} data={data} op={op} />;
}

function Client360OperationalCompact({
  workspaceSlug,
  projectId,
  data,
  op,
  embedded,
}: {
  workspaceSlug: string;
  projectId: string;
  data: TClient360DetailResponse;
  op: TClient360OperationalPayload;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const projectHref = `/${workspaceSlug}/projects/${projectId}/issues`;
  const showRaid = hasRaidItems(op);
  const kanbanLevels = (["ok", "warning", "critical"] as const)
    .map((level) => {
      const modules = (data.modules ?? []).filter((m) => {
        const st = m.status;
        if (level === "ok") return st === "published";
        if (level === "warning") return st === "draft";
        return st === "missing";
      });
      return { level, modules };
    })
    .filter((entry) => entry.modules.length > 0);

  const body = (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Client360CompactMetric
          label={t("boards.client_360.throughput_week")}
          value={op.delivery.throughput}
          tone="accent"
        />
        <Client360CompactMetric
          label={t("boards.client_360.cycle_time_median")}
          value={
            op.delivery.cycle_time_days_median != null
              ? t("boards.client_360.cycle_time_days", { days: op.delivery.cycle_time_days_median })
              : "—"
          }
        />
        <Client360CompactMetric
          label={t("boards.client_360.blockers_title")}
          value={op.blockers.count}
          tone={op.blockers.count > 0 ? "danger" : "success"}
        />
        {op.intake.pending > 0 ? (
          <Client360CompactMetric
            label={t("boards.client_360.intake_short")}
            value={op.intake.pending}
            tone="warning"
          />
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {op.milestones.length > 0 ? (
          <Client360SubPanel title={t("boards.client_360.milestones_title")} noPadding>
            <ul className="divide-y divide-subtle">
              {op.milestones.map((m) => (
                <li key={`${m.kind}-${m.id}`} className="flex items-center justify-between gap-3 px-3 py-2 text-12">
                  <span className={cn("truncate", m.status === "overdue" && "text-danger-primary")}>{m.name}</span>
                  <span className="font-mono shrink-0 text-11 text-tertiary">{m.target_date}</span>
                </li>
              ))}
            </ul>
          </Client360SubPanel>
        ) : null}

        {kanbanLevels.length > 0 ? (
          <Client360SubPanel title={t("boards.client_360.health_kanban_title")}>
            <div className="flex flex-wrap gap-2">
              {kanbanLevels.map(({ level, modules }) => (
                <div key={level} className="min-w-[140px] flex-1 rounded-sm border border-subtle bg-layer-2/40 p-2">
                  <p className="text-10 font-semibold tracking-wide text-tertiary uppercase">
                    {t(`boards.client_360.kanban_${level}`)} ({modules.length})
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {modules.map((m) => (
                      <li key={m.module_id ?? "p"} className="truncate text-11 text-secondary">
                        {m.module_name ?? data.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Client360SubPanel>
        ) : null}
      </div>

      {op.blockers.items && op.blockers.items.length > 0 ? (
        <Client360SubPanel title={t("boards.client_360.blockers_title")} className="mt-3" noPadding>
          <ul className="divide-y divide-subtle">
            {op.blockers.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-12">
                <Link href={`${projectHref}/${item.id}`} className="font-medium text-accent-primary hover:underline">
                  #{item.sequence_id} {item.name}
                </Link>
                <span className="text-11 text-tertiary">
                  {t("boards.client_360.blockers_aging", { days: item.aging_days })} · {item.blocked_by_name}
                </span>
              </li>
            ))}
          </ul>
        </Client360SubPanel>
      ) : null}

      {op.module_heatmap.length > 0 ? (
        <Client360SubPanel title={t("boards.client_360.modules_title")} className="mt-3" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-12">
              <thead>
                <tr className="border-b border-subtle bg-layer-2 text-10 font-medium tracking-wide text-tertiary uppercase">
                  <th className="px-3 py-2">{t("boards.client_360.module_column")}</th>
                  <th className="px-3 py-2">{t("boards.client_360.report_column")}</th>
                  <th className="px-3 py-2">{t("boards.client_360.col_overdue")}</th>
                  <th className="px-3 py-2">{t("boards.client_360.intake_short")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {op.module_heatmap.map((row) => {
                  const reportStatus = reportStatusFromHeatmap(row.cells.report);
                  return (
                    <tr key={row.module_id ?? "project"} className="hover:bg-layer-transparent-hover">
                      <td className="px-3 py-2 text-primary">{row.module_name ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 text-secondary">
                          <Client360StatusLozenge status={reportStatus} />
                          {reportLabelFromHeatmap(row.cells.report, t)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-secondary tabular-nums">{row.cells.overdue}</td>
                      <td className="px-3 py-2 text-secondary tabular-nums">{row.cells.intake}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Client360SubPanel>
      ) : null}

      {showRaid ? (
        <Client360SubPanel title={t("boards.client_360.raid_title")} className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {(["risk", "assumption", "issue", "dependency"] as const).map((key) =>
              op.raid[key].length > 0 ? (
                <div key={key}>
                  <h4 className="mb-1.5 text-10 font-semibold tracking-wide text-tertiary uppercase">
                    {t(`boards.client_360.raid_${key}`)}
                  </h4>
                  <RaidTable items={op.raid[key]} workspaceSlug={workspaceSlug} projectId={projectId} />
                </div>
              ) : null
            )}
          </div>
        </Client360SubPanel>
      ) : null}

      {op.support_sla.breached ? (
        <p className="mt-3 flex items-center gap-2 rounded-sm border border-danger-subtle bg-danger-subtle/20 px-3 py-2 text-12 text-danger-primary">
          <AlertTriangle className="size-3.5 shrink-0" strokeWidth={1.75} />
          {t("boards.client_360.sla_breach_count", {
            count: op.support_sla.breach_count,
            days: op.support_sla.sla_days,
          })}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-3">{body}</div>;
  }

  return (
    <Client360Section
      sectionId="operational"
      icon={LayoutGrid}
      iconTone="accent"
      title={t("boards.client_360.detail_group_operational_title")}
      description={t("boards.client_360.detail_group_operational_subtitle")}
    >
      {body}
    </Client360Section>
  );
}

function Client360OperationalDefault({
  workspaceSlug,
  projectId,
  data,
  op,
}: {
  workspaceSlug: string;
  projectId: string;
  data: TClient360DetailResponse;
  op: TClient360OperationalPayload;
}) {
  const { t } = useTranslation();
  const projectHref = `/${workspaceSlug}/projects/${projectId}/issues`;

  return (
    <>
      {op.intake.pending > 0 ? (
        <Client360Section
          icon={Inbox}
          iconTone="warning"
          title={t("boards.client_360.intake_title")}
          description={t("boards.client_360.intake_pending_count", { count: op.intake.pending })}
        />
      ) : null}

      <Client360Section
        icon={Ban}
        iconTone={op.blockers.count > 0 ? "danger" : "success"}
        title={t("boards.client_360.blockers_title")}
        description={
          op.blockers.count > 0
            ? t("boards.client_360.blockers_count", { count: op.blockers.count })
            : t("boards.client_360.blockers_empty")
        }
        noPadding={op.blockers.items && op.blockers.items.length > 0}
      >
        {op.blockers.items && op.blockers.items.length > 0 ? (
          <ul className="divide-y divide-subtle">
            {op.blockers.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-13">
                <Link href={`${projectHref}/${item.id}`} className="font-medium text-accent-primary hover:underline">
                  #{item.sequence_id} {item.name}
                </Link>
                <span className="text-12 text-secondary">
                  {t("boards.client_360.blockers_aging", { days: item.aging_days })} · {item.blocked_by_name}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Client360Section>

      <Client360Section
        icon={Gauge}
        iconTone="accent"
        title={t("boards.client_360.throughput_title")}
        description={t("boards.client_360.throughput_subtitle")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-subtle bg-layer-2 px-4 py-3">
            <p className="text-11 tracking-wide text-tertiary uppercase">{t("boards.client_360.throughput_week")}</p>
            <p className="mt-1 text-24 font-semibold text-primary tabular-nums">{op.delivery.throughput}</p>
          </div>
          <div className="rounded-md border border-subtle bg-layer-2 px-4 py-3">
            <p className="text-11 tracking-wide text-tertiary uppercase">{t("boards.client_360.cycle_time_median")}</p>
            <p className="mt-1 text-24 font-semibold text-primary tabular-nums">
              {op.delivery.cycle_time_days_median != null
                ? t("boards.client_360.cycle_time_days", { days: op.delivery.cycle_time_days_median })
                : "—"}
            </p>
          </div>
        </div>
      </Client360Section>

      {hasRaidItems(op) ? (
        <Client360Section icon={ShieldAlert} iconTone="info" title={t("boards.client_360.raid_title")} noPadding>
          <div className="grid gap-0 lg:grid-cols-2">
            {(["risk", "assumption", "issue", "dependency"] as const).map((key) =>
              op.raid[key].length > 0 ? (
                <div key={key} className="border-b border-subtle px-4 py-3 lg:border-r lg:last:border-r-0">
                  <h4 className="mb-2 text-12 font-semibold tracking-wide text-secondary uppercase">
                    {t(`boards.client_360.raid_${key}`)}
                  </h4>
                  <RaidTable items={op.raid[key]} workspaceSlug={workspaceSlug} projectId={projectId} />
                </div>
              ) : null
            )}
          </div>
        </Client360Section>
      ) : null}

      <Client360Section
        icon={CalendarRange}
        iconTone="neutral"
        title={t("boards.client_360.milestones_title")}
        description={t("boards.client_360.milestones_subtitle")}
        noPadding={op.milestones.length > 0}
      >
        {op.milestones.length === 0 ? (
          <p className="text-13 text-tertiary">{t("boards.client_360.milestones_empty")}</p>
        ) : (
          <ul className="divide-y divide-subtle">
            {op.milestones.map((m) => (
              <li key={`${m.kind}-${m.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-13">
                <span className={cn(m.status === "overdue" && "text-danger-primary")}>{m.name}</span>
                <span className="shrink-0 text-12 text-tertiary">{m.target_date}</span>
              </li>
            ))}
          </ul>
        )}
      </Client360Section>

      {op.module_heatmap.length > 0 ? (
        <Client360Section
          icon={LayoutGrid}
          iconTone="warning"
          title={t("boards.client_360.module_heatmap_title")}
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-13">
              <thead>
                <tr className="border-b border-subtle bg-layer-2 text-11 tracking-wide text-tertiary uppercase">
                  <th className="px-4 py-2">{t("boards.client_360.module_column")}</th>
                  <th className="px-4 py-2">{t("boards.client_360.col_report")}</th>
                  <th className="px-4 py-2">{t("boards.client_360.col_overdue")}</th>
                  <th className="px-4 py-2">{t("boards.client_360.intake_short")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {op.module_heatmap.map((row) => (
                  <tr key={row.module_id ?? "project"}>
                    <td className="px-4 py-2">{row.module_name ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "inline-block size-3 rounded-xs border",
                          reportCoverageHeatmapClass(row.cells.report as "complete" | "partial" | "missing" | "n_a")
                        )}
                      />
                    </td>
                    <td className="px-4 py-2 tabular-nums">{row.cells.overdue}</td>
                    <td className="px-4 py-2 tabular-nums">{row.cells.intake}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Client360Section>
      ) : null}

      <Client360Section icon={GitBranch} iconTone="accent" title={t("boards.client_360.health_kanban_title")}>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {(["ok", "warning", "critical"] as const).map((level) => {
            const modules = (data.modules ?? []).filter((m) => {
              const st = m.status;
              if (level === "ok") return st === "published";
              if (level === "warning") return st === "draft";
              return st === "missing";
            });
            if (modules.length === 0) return null;
            return (
              <div key={level} className="min-w-[160px] flex-1 rounded-md border border-subtle bg-layer-2 p-3">
                <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">
                  {t(`boards.client_360.kanban_${level}`)} ({modules.length})
                </p>
                <ul className="mt-2 space-y-1.5">
                  {modules.map((m) => (
                    <li key={m.module_id ?? "p"} className="rounded-sm bg-layer-1 px-2 py-1.5 text-12 text-secondary">
                      {m.module_name ?? data.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Client360Section>

      {op.support_sla.breached ? (
        <Client360Section
          icon={AlertTriangle}
          iconTone="danger"
          title={t("boards.client_360.sla_breach_title")}
          description={t("boards.client_360.sla_breach_count", {
            count: op.support_sla.breach_count,
            days: op.support_sla.sla_days,
          })}
        />
      ) : null}
    </>
  );
}
