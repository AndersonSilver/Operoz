"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@operis/utils";
import { Check, CheckCircle2, Link2, Loader2, Mail, MailPlus, RefreshCw, RotateCw, Users } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Badge } from "@operis/propel/badge";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { Input } from "@operis/propel/input";
import { setToast, TOAST_TYPE } from "@operis/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@operis/ui";
import {
  calculateTimeAgo,
  copyTextToClipboard,
  generateRandomColor,
  hslToHex,
  renderFormattedDate,
} from "@operis/utils";
import type { TPrdReviewInvite } from "@/services/guest-prd-review.service";
import { ProjectPageService } from "@/services/page/project-page.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  startNewRound?: boolean;
  previousSessionId?: string;
};

type TInviteStatus = "sent" | "expired" | "revoked";

const RESOLVED_STATUSES = new Set(["approved", "changes_requested"]);

function isResolvedStatus(status: string | undefined): boolean {
  return status != null && RESOLVED_STATUSES.has(status);
}

async function ensureActiveReviewSession(
  workspaceSlug: string,
  projectId: string,
  pageId: string,
  sessionId: string | null,
  latestStatus: string | undefined,
  options: { startNewRound?: boolean; previousSessionId?: string }
): Promise<string> {
  if (sessionId && !isResolvedStatus(latestStatus) && !options.startNewRound) {
    return sessionId;
  }

  const session = await pageService.createReviewSession(workspaceSlug, projectId, pageId, {
    send: true,
    snapshot_version: true,
    previous_session_id: options.previousSessionId ?? sessionId ?? undefined,
  });
  return session.id;
}

const pageService = new ProjectPageService();

const EXPIRY_OPTIONS = [7, 14, 30] as const;
type TExpiryDays = (typeof EXPIRY_OPTIONS)[number];

function getInviteStatus(invite: TPrdReviewInvite): TInviteStatus {
  if (invite.revoked_at) return "revoked";
  if (new Date(invite.expires_at).getTime() < Date.now()) return "expired";
  return "sent";
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

const INVITE_STATUS_BADGE: Record<TInviteStatus, "brand" | "warning" | "danger"> = {
  sent: "brand",
  expired: "warning",
  revoked: "danger",
};

const INVITE_STATUS_LABEL: Record<TInviteStatus, string> = {
  sent: "page_review.invite_status_sent",
  expired: "page_review.invite_status_expired",
  revoked: "page_review.invite_status_revoked",
};

async function copyLink(url: string, t: (key: string) => string): Promise<boolean> {
  try {
    await copyTextToClipboard(url);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("link_copied"),
      message: t("page_review.copy_link_success"),
    });
    return true;
  } catch {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("page_review.share_error_title"),
      message: t("page_review.copy_link_error"),
    });
    return false;
  }
}

function InviteListSkeleton() {
  return (
    <div className="divide-y divide-subtle rounded-md border border-subtle bg-layer-1">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-3">
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-layer-2" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-40 animate-pulse rounded-sm bg-layer-2" />
            <div className="h-2.5 w-28 animate-pulse rounded-sm bg-layer-2" />
          </div>
          <div className="h-5 w-14 animate-pulse rounded-full bg-layer-2" />
        </div>
      ))}
    </div>
  );
}

type InviteListProps = {
  invites: TPrdReviewInvite[];
  loading: boolean;
  resendingId: string | null;
  copiedInviteId: string | null;
  t: (key: string, options?: Record<string, unknown>) => string;
  onCopyInvite: (invite: TPrdReviewInvite) => void;
  onResendInvite: (invite: TPrdReviewInvite) => void;
};

function PageReviewInviteList({
  invites,
  loading,
  resendingId,
  copiedInviteId,
  t,
  onCopyInvite,
  onResendInvite,
}: InviteListProps) {
  if (loading) {
    return <InviteListSkeleton />;
  }

  if (!invites.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-subtle bg-layer-1 px-6 py-10 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-layer-2">
          <MailPlus className="size-4 text-tertiary" strokeWidth={1.75} />
        </div>
        <div className="space-y-1">
          <p className="text-13 font-medium text-secondary">{t("page_review.invites_empty_title")}</p>
          <p className="max-w-xs text-12 text-tertiary">{t("page_review.invites_empty")}</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="max-h-64 divide-y divide-subtle overflow-y-auto rounded-md border border-subtle bg-layer-1">
      {invites.map((invite) => {
        const status = getInviteStatus(invite);
        const avatarColors = emailAvatarColors(invite.email);
        const canCopy = status === "sent";
        const isResending = resendingId === invite.id;
        const isCopied = copiedInviteId === invite.id;
        const lastAccessLabel = invite.last_access_at
          ? t("page_review.invite_last_access", {
              date: calculateTimeAgo(invite.last_access_at),
            })
          : t("page_review.invite_never_accessed");

        return (
          <li
            key={invite.id}
            className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-layer-transparent-hover"
          >
            <span
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-11 font-semibold"
              style={avatarColors}
              aria-hidden
            >
              {emailInitial(invite.email)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="truncate text-13 font-medium text-primary">{invite.email}</p>
                <Badge variant={INVITE_STATUS_BADGE[status]} size="sm">
                  {t(INVITE_STATUS_LABEL[status])}
                </Badge>
              </div>
              <p className="mt-1 text-11 text-tertiary">{lastAccessLabel}</p>
              {invite.expires_at && status === "sent" ? (
                <p className="mt-0.5 text-11 text-placeholder">
                  {t("page_review.invite_expires", { date: renderFormattedDate(invite.expires_at) })}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {canCopy ? (
                <Tooltip tooltipContent={isCopied ? t("copied") : t("page_review.copy_invite_link")} position="top">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={isCopied ? Check : Link2}
                    aria-label={isCopied ? t("copied") : t("page_review.copy_invite_link")}
                    className={cn(isCopied && "text-success-primary")}
                    onClick={() => onCopyInvite(invite)}
                  />
                </Tooltip>
              ) : null}
              <Tooltip
                tooltipContent={isResending ? t("page_review.resending_invite") : t("page_review.resend_invite")}
                position="top"
              >
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={isResending ? Loader2 : RotateCw}
                  aria-label={isResending ? t("page_review.resending_invite") : t("page_review.resend_invite")}
                  disabled={isResending}
                  className={cn(isResending && "[&_svg]:animate-spin")}
                  onClick={() => onResendInvite(invite)}
                />
              </Tooltip>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function PageReviewShareModal({
  workspaceSlug,
  projectId,
  pageId,
  open,
  onClose,
  onSuccess,
  startNewRound = false,
  previousSessionId,
}: Props) {
  const { t } = useTranslation();
  const [emails, setEmails] = useState("");
  const [expiryDays, setExpiryDays] = useState<TExpiryDays>(14);
  const [sending, setSending] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [invites, setInvites] = useState<TPrdReviewInvite[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [latestSessionStatus, setLatestSessionStatus] = useState<string | undefined>();
  const [justSent, setJustSent] = useState(false);
  const [headerCopied, setHeaderCopied] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const headerCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLatestInvites = useCallback(async () => {
    setLoadingInvites(true);
    try {
      const sessions = await pageService.fetchReviewSessions(workspaceSlug, projectId, pageId);
      const latest = sessions?.[0];
      if (!latest) {
        setInvites([]);
        setSessionId(null);
        setLatestSessionStatus(undefined);
        return;
      }
      setLatestSessionStatus(latest.status);
      if (startNewRound || isResolvedStatus(latest.status)) {
        setInvites([]);
        setSessionId(null);
        return;
      }
      setSessionId(latest.id);
      const detail = await pageService.fetchReviewSessionDetail(workspaceSlug, projectId, pageId, latest.id);
      setInvites(detail.invites ?? []);
    } catch {
      setInvites([]);
      setSessionId(null);
      setLatestSessionStatus(undefined);
    } finally {
      setLoadingInvites(false);
    }
  }, [pageId, projectId, startNewRound, workspaceSlug]);

  useEffect(() => {
    if (!open) return;
    setJustSent(false);
    setEmails("");
    setExpiryDays(14);
    setHeaderCopied(false);
    setCopiedInviteId(null);
    void loadLatestInvites();
  }, [loadLatestInvites, open]);

  useEffect(
    () => () => {
      if (headerCopyTimerRef.current) clearTimeout(headerCopyTimerRef.current);
      if (rowCopyTimerRef.current) clearTimeout(rowCopyTimerRef.current);
    },
    []
  );

  const primaryCopyUrl = useMemo(
    () => invites.find((invite) => getInviteStatus(invite) === "sent")?.url ?? null,
    [invites]
  );

  const handleRefresh = useCallback(async () => {
    if (refreshing || loadingInvites) return;
    setRefreshing(true);
    try {
      await loadLatestInvites();
    } finally {
      setRefreshing(false);
    }
  }, [loadLatestInvites, loadingInvites, refreshing]);

  const handleHeaderCopy = useCallback(async () => {
    if (!primaryCopyUrl) return;
    const ok = await copyLink(primaryCopyUrl, t);
    if (!ok) return;
    setHeaderCopied(true);
    if (headerCopyTimerRef.current) clearTimeout(headerCopyTimerRef.current);
    headerCopyTimerRef.current = setTimeout(() => {
      setHeaderCopied(false);
      headerCopyTimerRef.current = null;
    }, 1500);
  }, [primaryCopyUrl, t]);

  const handleCopyInvite = useCallback(
    async (invite: TPrdReviewInvite) => {
      const ok = await copyLink(invite.url, t);
      if (!ok) return;
      setCopiedInviteId(invite.id);
      if (rowCopyTimerRef.current) clearTimeout(rowCopyTimerRef.current);
      rowCopyTimerRef.current = setTimeout(() => {
        setCopiedInviteId(null);
        rowCopyTimerRef.current = null;
      }, 1500);
    },
    [t]
  );

  const showNewRoundBanner = startNewRound || isResolvedStatus(latestSessionStatus);

  const handleResendInvite = useCallback(
    async (invite: TPrdReviewInvite) => {
      if (resendingId) return;
      setResendingId(invite.id);
      try {
        const activeSessionId = await ensureActiveReviewSession(
          workspaceSlug,
          projectId,
          pageId,
          sessionId,
          latestSessionStatus,
          { startNewRound, previousSessionId: previousSessionId ?? sessionId ?? undefined }
        );
        setSessionId(activeSessionId);
        setLatestSessionStatus("sent");
        await pageService.createReviewInvites(workspaceSlug, projectId, pageId, activeSessionId, {
          emails: [invite.email],
          expires_in_days: expiryDays,
          send_email: true,
        });
        const detail = await pageService.fetchReviewSessionDetail(workspaceSlug, projectId, pageId, activeSessionId);
        setInvites(detail.invites ?? []);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("page_review.resend_success_title"),
          message: t("page_review.resend_success_message", { email: invite.email }),
        });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("page_review.share_error_title"),
          message: t("page_review.resend_error_message"),
        });
      } finally {
        setResendingId(null);
      }
    },
    [
      expiryDays,
      latestSessionStatus,
      pageId,
      previousSessionId,
      projectId,
      resendingId,
      sessionId,
      startNewRound,
      t,
      workspaceSlug,
    ]
  );

  const handleSubmit = useCallback(async () => {
    const list = emails
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (!list.length || sending) return;

    setSending(true);
    try {
      const needsNewRound = startNewRound || isResolvedStatus(latestSessionStatus);
      const session = await pageService.createReviewSession(workspaceSlug, projectId, pageId, {
        send: true,
        ...(needsNewRound
          ? {
              snapshot_version: true,
              previous_session_id: previousSessionId ?? sessionId ?? undefined,
            }
          : {}),
      });
      setSessionId(session.id);
      setLatestSessionStatus(session.status);
      await pageService.createReviewInvites(workspaceSlug, projectId, pageId, session.id, {
        emails: list,
        expires_in_days: expiryDays,
        send_email: true,
      });
      const detail = await pageService.fetchReviewSessionDetail(workspaceSlug, projectId, pageId, session.id);
      setInvites(detail.invites ?? []);
      setEmails("");
      setJustSent(true);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("page_review.share_success_title"),
        message: t("page_review.share_success_message"),
      });
      onSuccess?.();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("page_review.share_error_title"),
        message: t("page_review.share_error_message"),
      });
    } finally {
      setSending(false);
    }
  }, [
    emails,
    expiryDays,
    latestSessionStatus,
    onSuccess,
    pageId,
    previousSessionId,
    projectId,
    sending,
    sessionId,
    startNewRound,
    t,
    workspaceSlug,
  ]);

  if (!open) return null;

  return (
    <ModalCore isOpen={open} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex w-[min(100vw-2rem,42rem)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-subtle px-6 pt-6 pb-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-16 font-semibold text-primary">
              {showNewRoundBanner ? t("page_review.new_round_modal_title") : t("page_review.share_modal_title")}
            </h2>
            <p className="mt-1.5 text-13 text-secondary">
              {showNewRoundBanner
                ? t("page_review.new_round_modal_description")
                : t("page_review.share_modal_description")}
            </p>
          </div>
          {primaryCopyUrl ? (
            <Tooltip tooltipContent={headerCopied ? t("copied") : t("copy_link")} position="left">
              <IconButton
                variant="ghost"
                size="lg"
                icon={headerCopied ? Check : Link2}
                aria-label={headerCopied ? t("copied") : t("copy_link")}
                className={cn("shrink-0", headerCopied && "text-success-primary")}
                onClick={() => void handleHeaderCopy()}
              />
            </Tooltip>
          ) : null}
        </header>

        <div className="flex flex-col gap-5 px-6 py-5">
          {showNewRoundBanner ? (
            <div className="rounded-md border border-warning-subtle bg-warning-subtle/15 px-4 py-3">
              <p className="text-12 text-secondary">{t("page_review.new_round_banner")}</p>
            </div>
          ) : null}

          {justSent ? (
            <div className="flex items-start gap-3 rounded-md border border-success-subtle bg-success-subtle/15 px-4 py-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-primary" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-13 font-medium text-primary">{t("page_review.share_success_title")}</p>
                <p className="mt-0.5 text-12 text-secondary">{t("page_review.share_success_message")}</p>
              </div>
            </div>
          ) : null}

          <section className="space-y-4">
            <div>
              <h3 className="text-13 font-medium text-primary">{t("page_review.invite_form_section")}</h3>
              <p className="mt-0.5 text-11 text-tertiary">{t("page_review.invite_form_hint")}</p>
            </div>

            <div>
              <label htmlFor="page-review-emails" className="mb-1.5 block text-11 font-medium text-secondary">
                {t("page_review.emails_label")}
              </label>
              <Input
                id="page-review-emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder={t("page_review.emails_placeholder")}
                disabled={sending}
              />
            </div>

            <div>
              <p className="mb-2 text-11 font-medium text-secondary">{t("page_review.expiry_label")}</p>
              <div className="flex flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant={expiryDays === days ? "primary" : "secondary"}
                    size="sm"
                    disabled={sending}
                    onClick={() => setExpiryDays(days)}
                  >
                    {t("page_review.expiry_days", { days })}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-subtle pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Users className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
                <h3 className="text-13 font-medium text-primary">{t("page_review.invites_section_title")}</h3>
                {!loadingInvites && invites.length > 0 ? (
                  <span className="text-11 text-tertiary">
                    {t("page_review.invite_count", { count: invites.length })}
                  </span>
                ) : null}
              </div>
              <Tooltip tooltipContent={t("page_review.refresh_invites")} position="left">
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={refreshing ? Loader2 : RefreshCw}
                  aria-label={t("page_review.refresh_invites")}
                  disabled={loadingInvites || refreshing}
                  className={cn(refreshing && "[&_svg]:animate-spin")}
                  onClick={() => void handleRefresh()}
                />
              </Tooltip>
            </div>
            <PageReviewInviteList
              invites={invites}
              loading={loadingInvites}
              resendingId={resendingId}
              copiedInviteId={copiedInviteId}
              t={t}
              onCopyInvite={(invite) => void handleCopyInvite(invite)}
              onResendInvite={(invite) => void handleResendInvite(invite)}
            />
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-subtle px-6 py-4">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={sending}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" disabled={sending || !emails.trim()} onClick={() => void handleSubmit()}>
            {sending ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
            ) : (
              <Mail className="size-3.5" strokeWidth={1.75} />
            )}
            {sending ? t("page_review.share_sending") : t("page_review.share_send")}
          </Button>
        </footer>
      </div>
    </ModalCore>
  );
}

type ButtonProps = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
  className?: string;
  variant?: "header" | "panel";
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  startNewRound?: boolean;
  previousSessionId?: string;
};

export function PageReviewShareButton({
  workspaceSlug,
  projectId,
  pageId,
  className,
  variant = "header",
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  startNewRound = false,
  previousSessionId,
}: ButtonProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const label = startNewRound ? t("page_review.new_round_button") : t("page_review.share_button");
  const showTrigger = controlledOpen === undefined;

  return (
    <>
      {showTrigger ? (
        variant === "header" ? (
          <Tooltip tooltipContent={label} position="bottom">
            <IconButton variant="ghost" size="lg" icon={Mail} onClick={() => setOpen(true)} aria-label={label} />
          </Tooltip>
        ) : (
          <Button variant="secondary" size="sm" className={cn("shrink-0", className)} onClick={() => setOpen(true)}>
            <Mail className="size-3.5" strokeWidth={1.75} />
            {label}
          </Button>
        )
      ) : null}
      <PageReviewShareModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        pageId={pageId}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={onSuccess}
        startNewRound={startNewRound}
        previousSessionId={previousSessionId}
      />
    </>
  );
}
