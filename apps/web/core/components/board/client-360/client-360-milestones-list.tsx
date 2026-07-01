"use client";

import { useMemo } from "react";
import { AlertCircle, CalendarRange, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@operoz/i18n";
import type { TClient360OperationalPayload } from "@operoz/types";
import { cn, renderFormattedDate } from "@operoz/utils";
import { Client360MetaChip } from "@/components/board/client-360/client-360-ui";

type Milestone = TClient360OperationalPayload["milestones"][number];

const STATUS_ORDER: Record<Milestone["status"], number> = {
  overdue: 0,
  pending: 1,
  done: 2,
};

type Props = {
  milestones: Milestone[];
  workspaceSlug: string;
  projectId: string;
  /** Limit visible rows in compact layouts (Pulse). */
  maxItems?: number;
};

export function Client360MilestonesList({ milestones, workspaceSlug, projectId, maxItems }: Props) {
  const sorted = useMemo(
    () =>
      [...milestones].sort((a, b) => {
        const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (byStatus !== 0) return byStatus;
        return a.target_date.localeCompare(b.target_date);
      }),
    [milestones]
  );

  const visible = maxItems != null ? sorted.slice(0, maxItems) : sorted;
  if (!visible.length) return null;

  return (
    <ul className="divide-y divide-subtle/80 overflow-hidden rounded-lg border border-subtle/80 bg-layer-1/50">
      {visible.map((milestone) => (
        <MilestoneRow
          key={`${milestone.kind}-${milestone.id}`}
          milestone={milestone}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
        />
      ))}
    </ul>
  );
}

function MilestoneRow({
  milestone,
  workspaceSlug,
  projectId,
}: {
  milestone: Milestone;
  workspaceSlug: string;
  projectId: string;
}) {
  const { t } = useTranslation();

  const content = (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 px-3.5 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <MilestoneStatusIcon status={milestone.status} />
        <span
          className={cn(
            "truncate text-12 font-medium",
            milestone.status === "overdue" ? "text-danger-primary" : "text-primary"
          )}
        >
          {milestone.name}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Client360MetaChip icon={CalendarRange} tone={milestone.status === "overdue" ? "danger" : "neutral"}>
          {renderFormattedDate(milestone.target_date)}
        </Client360MetaChip>
        {milestone.status === "overdue" ? (
          <span className="rounded-full border border-danger-subtle bg-danger-subtle/30 px-2 py-0.5 text-10 font-medium text-danger-primary">
            {t("boards.client_360.milestone_status_overdue")}
          </span>
        ) : null}
        {milestone.status === "done" ? (
          <span className="rounded-full border border-success-subtle bg-success-subtle/30 px-2 py-0.5 text-10 font-medium text-success-primary">
            {t("boards.client_360.milestone_status_done")}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (milestone.kind === "issue" && milestone.sequence_id != null) {
    return (
      <li>
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/issues/${milestone.id}`}
          className="block transition-colors hover:bg-layer-transparent-hover"
        >
          {content}
        </Link>
      </li>
    );
  }

  return <li>{content}</li>;
}

function MilestoneStatusIcon({ status }: { status: Milestone["status"] }) {
  if (status === "done") return <CheckCircle2 className="size-3.5 shrink-0 text-success-primary" strokeWidth={1.75} />;
  if (status === "overdue") return <AlertCircle className="size-3.5 shrink-0 text-danger-primary" strokeWidth={1.75} />;
  return <Circle className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />;
}
