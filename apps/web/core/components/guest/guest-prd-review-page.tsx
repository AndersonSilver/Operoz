"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { MessageSquare, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TextArea } from "@operoz/ui";
import { LogoSpinner } from "@/components/common/logo-spinner";
import {
  deleteGuestPrdReviewComment,
  fetchGuestPrdReview,
  postGuestPrdReviewComment,
  submitGuestPrdReview,
  updateGuestPrdReviewComment,
} from "@/services/guest-prd-review.service";

type Props = {
  token: string;
};

type TSelectionPayload = {
  sectionId: string;
  sectionTitle: string;
  quote: string;
  rect: { top: number; left: number; width: number; height: number };
  clientX?: number;
  clientY?: number;
};

type TInlineBadgePayload = {
  id: string;
  quote: string;
  text: string;
};

type TInlineEditorState =
  | { mode: "create"; selection: TSelectionPayload }
  | { mode: "view"; comment: { id: string; quote: string; text: string; sectionId: string } };

function truncateQuote(quote: string, max = 100) {
  if (quote.length <= max) return quote;
  return `${quote.slice(0, max - 1)}…`;
}

export function GuestPrdReviewPage({ token }: Props) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<TSelectionPayload | null>(null);
  const [inlineEditor, setInlineEditor] = useState<TInlineEditorState | null>(null);
  const [inlineDraft, setInlineDraft] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commentsClosedHint, setCommentsClosedHint] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    token ? `GUEST_PRD_REVIEW_${token}` : null,
    () => fetchGuestPrdReview(token),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const resolved = data ? ["approved", "changes_requested"].includes(data.session.status) : false;
  const readOnly = resolved;

  const refreshIframeComments = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "operoz-prd-refresh-comments" }, "*");
  }, []);

  const scrollIframeToComment = useCallback((commentId: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "operoz-prd-scroll-to-inline", payload: { id: commentId } },
      "*"
    );
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (type === "operoz-prd-review-comments-changed" || type === "operoz-prd-comment-save") {
        void mutate();
        return;
      }

      if (type === "operoz-prd-selection-clear") {
        setSelectionToolbar(null);
        return;
      }

      if (readOnly) {
        if (type === "operoz-prd-selection") {
          setCommentsClosedHint(true);
          return;
        }
        if (type === "operoz-prd-inline-badge-click" && event.data.payload) {
          const payload = event.data.payload as TInlineBadgePayload;
          scrollIframeToComment(payload.id);
        }
        return;
      }

      if (type === "operoz-prd-selection" && event.data.payload) {
        setSelectionToolbar(event.data.payload as TSelectionPayload);
        setInlineEditor(null);
        return;
      }
      if (type === "operoz-prd-inline-badge-click" && event.data.payload) {
        const payload = event.data.payload as TInlineBadgePayload;
        setSelectionToolbar(null);
        setInlineEditor({
          mode: "view",
          comment: {
            id: payload.id,
            quote: payload.quote,
            text: payload.text,
            sectionId: data?.inline_comments.find((c) => c.id === payload.id)?.sectionId || "",
          },
        });
        setInlineDraft(payload.text);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [data?.inline_comments, mutate, readOnly, scrollIframeToComment]);

  useEffect(() => {
    if (!commentsClosedHint) return;
    const timer = window.setTimeout(() => setCommentsClosedHint(false), 5000);
    return () => window.clearTimeout(timer);
  }, [commentsClosedHint]);

  const commentCount = useMemo(() => {
    if (!data) return 0;
    const sectionCount = Object.keys(data.section_comments || {}).length;
    return sectionCount + (data.inline_comments?.length || 0);
  }, [data]);

  const handleSubmit = useCallback(
    async (action: "approve" | "feedback") => {
      if (submitting) return;
      setSubmitting(true);
      try {
        await submitGuestPrdReview(token, action);
        await mutate();
      } finally {
        setSubmitting(false);
      }
    },
    [mutate, submitting, token]
  );

  const handleOpenInlineEditor = useCallback(() => {
    if (!selectionToolbar) return;
    setInlineEditor({ mode: "create", selection: selectionToolbar });
    setInlineDraft("");
    setSelectionToolbar(null);
  }, [selectionToolbar]);

  const handleSaveInlineComment = useCallback(async () => {
    if (!inlineEditor || commentSaving) return;
    const body = inlineDraft.trim();
    if (!body) return;

    setCommentSaving(true);
    try {
      if (inlineEditor.mode === "create") {
        await postGuestPrdReviewComment(token, {
          type: "inline",
          section_id: inlineEditor.selection.sectionId,
          body,
          quote: inlineEditor.selection.quote,
        });
      } else {
        await updateGuestPrdReviewComment(token, {
          type: "inline",
          section_id: inlineEditor.comment.sectionId,
          body,
          quote: inlineEditor.comment.quote,
          comment_id: inlineEditor.comment.id,
        });
      }
      await mutate();
      refreshIframeComments();
      setInlineEditor(null);
      setInlineDraft("");
    } finally {
      setCommentSaving(false);
    }
  }, [commentSaving, inlineDraft, inlineEditor, mutate, refreshIframeComments, token]);

  const handleDeleteInlineComment = useCallback(async () => {
    if (!inlineEditor || inlineEditor.mode !== "view" || commentSaving) return;
    setCommentSaving(true);
    try {
      await deleteGuestPrdReviewComment(token, inlineEditor.comment.id);
      await mutate();
      refreshIframeComments();
      setInlineEditor(null);
      setInlineDraft("");
    } finally {
      setCommentSaving(false);
    }
  }, [commentSaving, inlineEditor, mutate, refreshIframeComments, token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-layer-1">
        <LogoSpinner />
      </div>
    );
  }

  if (error) {
    const status = (error as { status?: number }).status;
    const message =
      status === 410
        ? t("page_review.guest_expired")
        : status === 403
          ? t("page_review.guest_revoked")
          : t("page_review.guest_error");

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-layer-1 px-6 text-center">
        <p className="text-16 font-semibold text-primary">{t("page_review.guest_title")}</p>
        <p className="max-w-md text-13 text-tertiary">{message}</p>
      </div>
    );
  }

  if (!data) return null;

  const sectionComments = Object.entries(data.section_comments || {});
  const inlineComments = data.inline_comments || [];

  return (
    <div className="flex min-h-screen flex-col bg-layer-1">
      <header className="border-b border-subtle bg-layer-2">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">
            <p className="tracking-wider text-10 font-semibold text-accent-primary uppercase">Operoz · PRD Review</p>
            <h1 className="mt-1 text-16 leading-snug font-semibold text-primary sm:text-18">
              {data.page.name || t("page_review.guest_title")}
            </h1>
            <p className="mt-1.5 text-11 text-tertiary">
              {data.guest_email}
              <span className="mx-1.5 text-placeholder">·</span>
              {readOnly ? t("page_review.guest_readonly") : t("page_review.guest_review_active")}
            </p>
          </div>

          {!resolved ? (
            <div className="flex w-full shrink-0 flex-col gap-2 lg:w-auto lg:min-w-[18rem] lg:items-end">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submitting || commentCount > 0}
                  onClick={() => handleSubmit("approve")}
                >
                  {t("page_review.approve")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={submitting || commentCount === 0}
                  onClick={() => handleSubmit("feedback")}
                >
                  {t("page_review.send_feedback")}
                </Button>
                {commentCount > 0 ? (
                  <Button variant="tertiary" size="sm" onClick={() => setSidebarOpen((v) => !v)}>
                    {sidebarOpen ? t("page_review.guest_hide_comments") : t("page_review.guest_show_comments")}
                  </Button>
                ) : null}
              </div>
              <p className="text-10 leading-relaxed text-tertiary lg:text-right">
                {t("page_review.guest_banner")}
                <span className="mt-0.5 block text-placeholder">{t("page_review.guest_selection_hint")}</span>
              </p>
            </div>
          ) : (
            <div className="w-full shrink-0 rounded-md border border-success-subtle bg-success-subtle/15 px-3 py-2.5 lg:max-w-md">
              <p className="text-12 font-medium text-primary">
                {data.session.status === "approved"
                  ? t("page_review.guest_approved")
                  : t("page_review.guest_feedback_sent")}
              </p>
              <p className="mt-1 text-11 text-secondary">{t("page_review.guest_comments_closed")}</p>
              {commentCount > 0 ? (
                <Button variant="tertiary" size="sm" className="mt-2" onClick={() => setSidebarOpen((v) => !v)}>
                  {sidebarOpen ? t("page_review.guest_hide_comments") : t("page_review.guest_show_comments")}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </header>

      {commentsClosedHint ? (
        <div
          className="border-b border-subtle bg-warning-subtle/30 px-4 py-2 text-12 text-secondary sm:px-6"
          role="status"
        >
          {t("page_review.guest_comments_closed_selection")}
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <iframe
            ref={iframeRef}
            title={data.page.name}
            srcDoc={data.page.render_html}
            className="h-[calc(100vh-7rem)] w-full border-0 bg-white pb-20"
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-same-origin"
          />

          {!readOnly && inlineEditor ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-backdrop/40 p-4">
              <div
                className="w-full max-w-md rounded-md border border-subtle bg-surface-1 shadow-raised-200"
                role="dialog"
                aria-modal="true"
                aria-label={t("page_review.guest_inline_title")}
              >
                <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
                  <p className="text-13 font-medium text-primary">{t("page_review.guest_inline_title")}</p>
                  <button
                    type="button"
                    className="rounded p-1 text-tertiary hover:bg-layer-2 hover:text-primary"
                    onClick={() => {
                      setInlineEditor(null);
                      setInlineDraft("");
                    }}
                    aria-label={t("close")}
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="space-y-3 px-4 py-3">
                  <p className="text-12 text-tertiary italic">
                    &ldquo;
                    {truncateQuote(
                      inlineEditor.mode === "create" ? inlineEditor.selection.quote : inlineEditor.comment.quote
                    )}
                    &rdquo;
                  </p>
                  <TextArea
                    value={inlineDraft}
                    onChange={(e) => setInlineDraft(e.target.value)}
                    placeholder={t("page_review.guest_inline_placeholder")}
                    rows={4}
                    className="text-13"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={commentSaving || !inlineDraft.trim()}
                      onClick={() => void handleSaveInlineComment()}
                    >
                      {t("page_review.guest_inline_save")}
                    </Button>
                    {inlineEditor.mode === "view" ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={commentSaving}
                          onClick={() => scrollIframeToComment(inlineEditor.comment.id)}
                        >
                          {t("page_review.guest_go_to_quote")}
                        </Button>
                        <Button
                          variant="error-outline"
                          size="sm"
                          disabled={commentSaving}
                          onClick={() => void handleDeleteInlineComment()}
                        >
                          {t("page_review.guest_inline_delete")}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>

        {sidebarOpen && commentCount > 0 ? (
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-subtle bg-layer-2">
            <div className="border-b border-subtle px-3 py-2">
              <p className="text-11 font-medium text-secondary">{t("page_review.guest_comments_sidebar")}</p>
              <p className="text-10 text-tertiary">{t("page_review.guest_comments_count", { count: commentCount })}</p>
            </div>
            <ul className="divide-y divide-subtle">
              {sectionComments.map(([sectionId, comment]) => (
                <li key={comment.id} className="px-3 py-2.5">
                  <p className="text-10 font-medium tracking-wide text-accent-primary uppercase">
                    {t("page_review.guest_section_comment")}
                  </p>
                  <p className="mt-0.5 text-11 font-medium text-primary">{comment.title || sectionId}</p>
                  <p className="mt-1 text-11 text-secondary">{comment.text}</p>
                </li>
              ))}
              {inlineComments.map((comment) => (
                <li key={comment.id} className="px-3 py-2.5">
                  <p className="text-10 font-medium tracking-wide text-accent-primary uppercase">
                    {t("page_review.guest_inline_comment")}
                  </p>
                  <p className="mt-0.5 text-11 text-tertiary italic">
                    &ldquo;{truncateQuote(comment.quote, 60)}&rdquo;
                  </p>
                  <p className="mt-1 text-11 text-secondary">{comment.text}</p>
                  <button
                    type="button"
                    className="mt-1 text-10 text-accent-primary hover:underline"
                    onClick={() => {
                      scrollIframeToComment(comment.id);
                      if (!readOnly) {
                        setInlineEditor({
                          mode: "view",
                          comment: {
                            id: comment.id,
                            quote: comment.quote,
                            text: comment.text,
                            sectionId: comment.sectionId,
                          },
                        });
                        setInlineDraft(comment.text);
                      }
                    }}
                  >
                    {readOnly ? t("page_review.guest_go_to_quote") : t("page_review.guest_inline_edit")}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>

      {!readOnly && selectionToolbar ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-subtle bg-layer-2/95 px-4 py-3 shadow-raised-200 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <p className="min-w-0 flex-1 text-12 text-secondary italic">
              &ldquo;{truncateQuote(selectionToolbar.quote, 120)}&rdquo;
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="primary" size="sm" onClick={handleOpenInlineEditor}>
                <MessageSquare className="size-3.5" />
                {t("page_review.guest_comment_selection")}
              </Button>
              <Button variant="tertiary" size="sm" onClick={() => setSelectionToolbar(null)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
