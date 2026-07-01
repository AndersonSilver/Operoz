import Link from "next/link";
import { AlertTriangle, Ban, CalendarRange, Gauge, GitBranch, Inbox, LayoutGrid, ShieldAlert } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TClient360DetailResponse, TClient360OperationalPayload } from "@operoz/types";
import { cn } from "@operoz/utils";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { reportCoverageHeatmapClass } from "@/components/board/client-360/client-360-utils";

type Props = {
  workspaceSlug: string;
  projectId: string;
  data: TClient360DetailResponse;
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

export function Client360OperationalSections({ workspaceSlug, projectId, data }: Props) {
  const op = data.operational;
  if (!op) return null;

  return <Client360OperationalDefault workspaceSlug={workspaceSlug} projectId={projectId} data={data} op={op} />;
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
