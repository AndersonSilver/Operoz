"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { FileText, RefreshCw } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Badge } from "@operoz/propel/badge";
import type { TBadgeVariant } from "@operoz/propel/badge";
import { Button } from "@operoz/propel/button";
import { IconButton } from "@operoz/propel/icon-button";
import { Tooltip } from "@operoz/propel/tooltip";
import { WorkspacePrdReviewService } from "@/services/workspace-prd-review.service";

type Props = {
  workspaceSlug: string;
};

const service = new WorkspacePrdReviewService();

const STATUS_LABEL: Record<string, string> = {
  draft: "page_review.status_draft",
  sent: "page_review.status_sent",
  approved: "page_review.status_approved",
  changes_requested: "page_review.status_changes_requested",
};

const STATUS_BADGE: Record<string, TBadgeVariant> = {
  draft: "neutral",
  sent: "brand",
  approved: "success",
  changes_requested: "warning",
};

const FILTERS = ["", "sent", "changes_requested", "approved"] as const;

export function WorkspacePrdReviewInbox({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<(typeof FILTERS)[number]>("");

  const { data: metrics } = useSWR(
    workspaceSlug ? `PRD_REVIEW_METRICS_${workspaceSlug}` : null,
    () => service.fetchMetrics(workspaceSlug),
    { revalidateOnFocus: false }
  );

  const { data, mutate, isValidating } = useSWR(
    workspaceSlug ? `PRD_REVIEW_INBOX_${workspaceSlug}_${statusFilter}` : null,
    () =>
      service.fetchInbox(workspaceSlug, {
        status: statusFilter || undefined,
        limit: 50,
      }),
    { revalidateOnFocus: false }
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-subtle px-6 py-4">
        <h1 className="text-18 font-semibold text-primary">{t("page_review.inbox_title")}</h1>
        <p className="mt-1 text-13 text-tertiary">{t("page_review.inbox_description")}</p>
        {metrics ? (
          <div className="mt-4 flex flex-wrap gap-3 text-12 text-secondary">
            <span>{t("page_review.metrics_pending", { count: metrics.pending_feedback })}</span>
            {metrics.approval_rate != null ? (
              <span>{t("page_review.metrics_approval_rate", { rate: Math.round(metrics.approval_rate * 100) })}</span>
            ) : null}
            {metrics.avg_hours_to_resolve != null ? (
              <span>{t("page_review.metrics_avg_hours", { hours: metrics.avg_hours_to_resolve })}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-b border-subtle px-6 py-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter || "all"}
            variant={statusFilter === filter ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(filter)}
          >
            {filter ? t(STATUS_LABEL[filter] ?? "page_review.status_sent") : t("page_review.inbox_filter_all")}
          </Button>
        ))}
        <Tooltip tooltipContent={t("page_review.refresh")} position="bottom">
          <IconButton
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            aria-label={t("page_review.refresh")}
            className={`ml-auto ${isValidating ? "[&_svg]:animate-spin" : ""}`}
            onClick={() => mutate()}
          />
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!data?.items?.length ? (
          <p className="text-13 text-tertiary">{t("page_review.inbox_empty")}</p>
        ) : (
          <ul className="space-y-2">
            {data.items.map((item) => (
              <li key={item.id} className="rounded-md border border-subtle bg-layer-2 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-tertiary" strokeWidth={1.75} />
                      <p className="truncate text-13 font-medium text-primary">{item.page_name}</p>
                    </div>
                    <p className="mt-1 text-11 text-tertiary">
                      {item.project_identifier} · {item.project_name}
                    </p>
                    {item.page_version ? (
                      <p className="mt-1 text-11 text-tertiary">
                        {t("page_review.page_version_label", { id: item.page_version.id.slice(0, 8) })}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={STATUS_BADGE[item.status] ?? "neutral"} size="sm">
                    {t(STATUS_LABEL[item.status] ?? "page_review.status_sent")}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-11 text-secondary">
                  <span>{t("page_review.comment_count", { count: item.comment_count })}</span>
                  <Link
                    href={`/${workspaceSlug}/projects/${item.project_id}/pages/${item.page_id}`}
                    className="text-accent-primary hover:underline"
                  >
                    {t("page_review.inbox_open_page")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
