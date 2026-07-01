"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, FileDown, Link2, MailPlus, MessageSquareText, RefreshCw, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Badge } from "@operoz/propel/badge";
import type { TBadgeVariant } from "@operoz/propel/badge";
import { Button } from "@operoz/propel/button";
import { IconButton } from "@operoz/propel/icon-button";
import { Tooltip } from "@operoz/propel/tooltip";
import { Input } from "@operoz/ui";
import { setToast, TOAST_TYPE } from "@operoz/propel/toast";
import { generateRandomColor, hslToHex } from "@operoz/utils";
import { ProjectPageService } from "@/services/page/project-page.service";
import type { TPageInstance } from "@/store/pages/base-page";
import { PageReviewShareButton, PageReviewShareModal } from "./page-review-share-modal";

type Props = {
  page: TPageInstance;
};

const RESOLVED_STATUSES = new Set(["approved", "changes_requested"]);

function isResolvedStatus(status: string | undefined): boolean {
  return status != null && RESOLVED_STATUSES.has(status);
}

const pageService = new ProjectPageService();

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

function truncate(text: string, max = 80) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function emailInitial(email: string): string {
  const trimmed = email.trim();
  return (trimmed[0] ?? "?").toUpperCase();
}

function emailAvatarColors(email: string): { backgroundColor: string; color: string } {
  const hsl = generateRandomColor(email.trim().toLowerCase());
  const color = hslToHex({ ...hsl, l: Math.max(32, hsl.l - 28) });
  return {
    backgroundColor: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.22)`,
    color,
  };
}

export function PageReviewPanel({ page }: Props) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const pid = projectId?.toString() ?? "";
  const pageId = page.id ?? "";
  const [newRoundOpen, setNewRoundOpen] = useState(false);
  const [syncIssueId, setSyncIssueId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    data: sessions,
    mutate,
    isValidating,
  } = useSWR(
    slug && pid && pageId ? `PAGE_REVIEW_${pageId}` : null,
    () => pageService.fetchReviewSessions(slug, pid, pageId),
    { revalidateOnFocus: false }
  );

  const latest = sessions?.[0];

  const { data: sessionDetail } = useSWR(
    slug && pid && pageId && latest?.id ? `PAGE_REVIEW_DETAIL_${latest.id}` : null,
    () => pageService.fetchReviewSessionDetail(slug, pid, pageId, latest!.id),
    { revalidateOnFocus: false }
  );

  const comments = sessionDetail?.comments ?? [];
  const latestResolved = latest ? isResolvedStatus(latest.status) : false;
  const sessionRoundCount = sessions?.length ?? 0;
  const showSync = latest?.status === "changes_requested" && comments.length > 0;

  const handleSyncToIssue = async () => {
    if (!syncIssueId.trim() || !latest?.id) return;
    setSyncing(true);
    try {
      const result = await pageService.syncReviewToIssue(slug, pid, pageId, latest.id, syncIssueId.trim());
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("page_review.sync_success_title"),
        message: t("page_review.sync_success_message", { count: result.synced_count }),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("page_review.sync_error_title"),
        message: t("page_review.sync_error_message"),
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async (includeComments: boolean) => {
    if (!latest?.id) return;
    setExporting(true);
    try {
      const result = await pageService.exportReviewSession(slug, pid, pageId, latest.id, includeComments);

      if (!result.pdfFallback) {
        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.filename;
        anchor.click();
        URL.revokeObjectURL(url);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("page_review.export_success_title"),
          message: t("page_review.export_success_message"),
        });
        return;
      }

      const text = await result.blob.text();
      const blob = new Blob([text], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.addEventListener("load", () => {
          win.print();
        });
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("page_review.export_success_title"),
        message: t("page_review.export_print_hint"),
      });
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("page_review.export_error_title"),
        message: t("page_review.export_error_message"),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pb-4">
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-13 font-semibold text-primary">{t("page_review.panel_title")}</p>
          <p className="mt-1 text-12 leading-relaxed text-tertiary">{t("page_review.panel_description")}</p>
        </div>
        <Tooltip tooltipContent={t("page_review.refresh")} position="bottom">
          <IconButton
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            aria-label={t("page_review.refresh")}
            className={isValidating ? "[&_svg]:animate-spin" : undefined}
            onClick={() => mutate()}
          />
        </Tooltip>
      </div>

      <div className="mt-4 space-y-3">
        {latestResolved ? (
          <div className="rounded-md border border-subtle bg-layer-2 p-3.5">
            <div className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-tertiary" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-12 font-medium text-primary">{t("page_review.session_resolved_title")}</p>
                <p className="mt-1 text-11 leading-relaxed text-tertiary">{t("page_review.session_resolved_hint")}</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="mt-3 w-full justify-center"
              prependIcon={<MailPlus className="size-3.5" strokeWidth={1.75} />}
              onClick={() => setNewRoundOpen(true)}
            >
              {t("page_review.new_round_button")}
            </Button>
          </div>
        ) : (
          <PageReviewShareButton
            workspaceSlug={slug}
            projectId={pid}
            pageId={pageId}
            variant="panel"
            className="w-full justify-center"
            onSuccess={() => mutate()}
          />
        )}

        <PageReviewShareModal
          workspaceSlug={slug}
          projectId={pid}
          pageId={pageId}
          open={newRoundOpen}
          onClose={() => setNewRoundOpen(false)}
          startNewRound
          previousSessionId={latest?.id}
          onSuccess={() => {
            setNewRoundOpen(false);
            mutate();
          }}
        />

        {latest ? (
          <div className="rounded-md border border-subtle bg-layer-2 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-12 font-medium text-primary">{t("page_review.latest_session")}</span>
              <Badge variant={STATUS_BADGE[latest.status] ?? "neutral"} size="sm">
                {t(STATUS_LABEL[latest.status] ?? "page_review.status_sent")}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-sm bg-layer-1 px-2.5 py-2">
                <MessageSquareText className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-14 font-semibold text-primary">{latest.comment_count}</p>
                  <p className="text-11 text-tertiary">{t("page_review.guest_comments_sidebar")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-sm bg-layer-1 px-2.5 py-2">
                <Users className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-14 font-semibold text-primary">{latest.invite_count}</p>
                  <p className="text-11 text-tertiary">{t("page_review.panel_stat_invites")}</p>
                </div>
              </div>
            </div>

            {sessionRoundCount > 1 ? (
              <p className="mt-2.5 text-11 text-tertiary">
                {t("page_review.session_round_count", { count: sessionRoundCount })}
              </p>
            ) : null}
            {sessionDetail?.page_version ? (
              <p className="mt-2 text-11 text-tertiary">
                {t("page_review.page_version_label", {
                  id: sessionDetail.page_version.id.slice(0, 8),
                })}
              </p>
            ) : null}

            <div className="mt-3 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center border border-subtle"
                prependIcon={<FileDown className="size-3.5" strokeWidth={1.75} />}
                disabled={exporting}
                onClick={() => void handleExport(true)}
              >
                {exporting ? t("page_review.export_downloading") : t("page_review.export_pdf_with_comments")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center border border-subtle"
                prependIcon={<FileDown className="size-3.5" strokeWidth={1.75} />}
                disabled={exporting}
                onClick={() => void handleExport(false)}
              >
                {exporting ? t("page_review.export_downloading") : t("page_review.export_pdf_without_comments")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-subtle bg-layer-1 px-4 py-8 text-center">
            <p className="text-12 text-tertiary">{t("page_review.no_sessions")}</p>
          </div>
        )}

        {sessionDetail ? (
          <div className="rounded-md border border-subtle bg-layer-2 p-3.5">
            <p className="text-12 font-medium text-primary">{t("page_review.panel_comments_title")}</p>
            {comments.length === 0 ? (
              <p className="mt-3 text-11 text-tertiary">{t("page_review.panel_no_comments")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {comments.map((comment) => {
                  const avatarColors = emailAvatarColors(comment.author_email);
                  return (
                    <li key={comment.id} className="rounded-md border border-subtle bg-layer-1 p-2.5">
                      <div className="flex gap-2.5">
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-11 font-semibold"
                          style={avatarColors}
                        >
                          {emailInitial(comment.author_email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="truncate text-11 font-medium text-secondary">{comment.author_email}</p>
                            <Badge variant="brand" size="sm">
                              {comment.type === "inline"
                                ? t("page_review.guest_inline_comment")
                                : t("page_review.guest_section_comment")}
                            </Badge>
                          </div>
                          {comment.type === "inline" && comment.quote ? (
                            <p className="border-accent-primary mt-1.5 border-l-2 pl-2 text-11 text-tertiary italic">
                              &ldquo;{truncate(comment.quote)}&rdquo;
                            </p>
                          ) : null}
                          <p className="mt-1.5 text-12 leading-relaxed text-primary">{comment.body}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {showSync ? (
          <div className="rounded-md border border-subtle bg-layer-2 p-3.5">
            <p className="text-12 font-medium text-primary">{t("page_review.sync_title")}</p>
            <p className="mt-1 text-11 text-tertiary">{t("page_review.sync_description")}</p>
            <div className="mt-3 flex gap-2">
              <Input
                value={syncIssueId}
                onChange={(e) => setSyncIssueId(e.target.value)}
                placeholder={t("page_review.sync_issue_placeholder")}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="sm"
                prependIcon={<Link2 className="size-3.5" strokeWidth={1.75} />}
                disabled={!syncIssueId.trim() || syncing}
                onClick={() => void handleSyncToIssue()}
              >
                {syncing ? t("page_review.sync_sending") : t("page_review.sync_button")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
