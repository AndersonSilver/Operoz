import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import useSWR from "swr";
import { Bot, CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
import { Tooltip } from "@operoz/propel/tooltip";
import type { TAssistantPageIndexStatus } from "@/services/assistant.service";
import { AssistantService } from "@/services/assistant.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
  contentRevision?: number;
};

const assistantService = new AssistantService();

const ACTIVE_STATUSES = new Set<TAssistantPageIndexStatus["status"]>(["pending", "processing", "stale", "not_indexed"]);

const COUNTDOWN_STATUSES = new Set<TAssistantPageIndexStatus["status"]>([
  "pending",
  "processing",
  "stale",
  "not_indexed",
]);

const VISIBLE_STATUSES = new Set<TAssistantPageIndexStatus["status"]>([
  "pending",
  "processing",
  "indexed",
  "failed",
  "stale",
  "not_indexed",
]);

type IndexStatusKey = Exclude<TAssistantPageIndexStatus["status"], "disabled" | "empty">;

const STATUS_PILL_CLASS: Record<IndexStatusKey, string> = {
  pending: "border-accent-primary/50 bg-accent-primary/20 text-accent-primary",
  processing: "border-accent-primary/50 bg-accent-primary/20 text-accent-primary",
  indexed: "border-success-subtle bg-success-subtle text-success-primary",
  failed: "border-danger-subtle bg-danger-subtle text-danger-primary",
  stale: "border-warning-subtle bg-warning-subtle text-warning-primary",
  not_indexed: "border-warning-subtle bg-warning-subtle text-warning-primary",
};

function pollInterval(status: TAssistantPageIndexStatus["status"] | undefined): number {
  if (!status) return 3000;
  if (status === "not_indexed") return 3000;
  if (ACTIVE_STATUSES.has(status)) return 5000;
  if (status === "failed") return 15000;
  if (status === "indexed") return 60000;
  return 0;
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  return `${seconds}s`;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

type TooltipBodyProps = {
  heading: string;
  description: string;
  status: TAssistantPageIndexStatus["status"];
  etaAt: string | null | undefined;
  fallbackSeconds: number | null | undefined;
  lastIndexDurationSeconds: number | null | undefined;
  chunkCount: number;
};

function AssistantIndexTooltipBody(props: TooltipBodyProps) {
  const { heading, description, status, etaAt, fallbackSeconds, lastIndexDurationSeconds, chunkCount } = props;
  const { t } = useTranslation();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const showCountdown = COUNTDOWN_STATUSES.has(status);

  useEffect(() => {
    if (!showCountdown) {
      setRemainingSeconds(null);
      return;
    }

    const tick = () => {
      if (etaAt) {
        const seconds = Math.max(0, Math.ceil((new Date(etaAt).getTime() - Date.now()) / 1000));
        setRemainingSeconds(seconds);
        return;
      }
      if (fallbackSeconds != null) {
        setRemainingSeconds(Math.max(0, fallbackSeconds));
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [etaAt, fallbackSeconds, showCountdown]);

  const metaLine = useMemo(() => {
    if (status === "indexed" && lastIndexDurationSeconds != null && lastIndexDurationSeconds > 0) {
      return t("operoz_assistant.assistant_index.indexed_duration", {
        time: formatDuration(lastIndexDurationSeconds),
        count: chunkCount,
      });
    }
    if (!showCountdown || remainingSeconds === null) return null;
    if (remainingSeconds <= 0) {
      return t("operoz_assistant.assistant_index.countdown_finishing");
    }
    return t("operoz_assistant.assistant_index.countdown_remaining", {
      time: formatCountdown(remainingSeconds),
    });
  }, [chunkCount, lastIndexDurationSeconds, remainingSeconds, showCountdown, status, t]);

  const metaClass =
    status === "indexed" ? "text-success-primary" : status === "failed" ? "text-danger-primary" : "text-accent-primary";

  return (
    <div className="flex max-w-xs flex-col gap-1.5 text-left">
      <span className="text-12 font-medium text-primary">{heading}</span>
      <span className="text-12 text-secondary">{description}</span>
      {metaLine ? <span className={cn("text-12 font-semibold tabular-nums", metaClass)}>{metaLine}</span> : null}
    </div>
  );
}

function useStableIndexStatus(data: TAssistantPageIndexStatus | undefined) {
  const stableRef = useRef<TAssistantPageIndexStatus | null>(null);

  if (data?.status && VISIBLE_STATUSES.has(data.status)) {
    stableRef.current = data;
  }

  return data ?? stableRef.current;
}

export function PageAssistantIndexBadge(props: Props) {
  const { workspaceSlug, projectId, pageId, contentRevision = 0 } = props;
  const { t } = useTranslation();

  const swrKey =
    workspaceSlug && projectId && pageId
      ? `PAGE_ASSISTANT_INDEX_${workspaceSlug}_${projectId}_${pageId}_${contentRevision}`
      : null;

  const { data, error, isLoading } = useSWR(
    swrKey,
    () => assistantService.getPageIndexStatus(workspaceSlug, projectId, pageId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      keepPreviousData: true,
      refreshInterval: (latest) => pollInterval(latest?.status),
    }
  );

  const stableData = useStableIndexStatus(data);

  const presentation = useMemo(() => {
    const status = stableData?.status;
    if (!status || status === "disabled" || status === "empty") return null;

    const chunkCount = stableData?.chunk_count ?? 0;

    const variants: Record<
      IndexStatusKey,
      {
        icon: ReactNode;
        label: string;
        description: string;
      }
    > = {
      pending: {
        icon: <Clock className="size-3.5 shrink-0" strokeWidth={2} />,
        label: t("operoz_assistant.assistant_index.pending_label"),
        description: t("operoz_assistant.assistant_index.pending_tooltip"),
      },
      processing: {
        icon: <Loader2 className="size-3.5 shrink-0 animate-spin" strokeWidth={2} />,
        label: t("operoz_assistant.assistant_index.processing_label"),
        description: t("operoz_assistant.assistant_index.processing_tooltip"),
      },
      indexed: {
        icon: <CheckCircle2 className="size-3.5 shrink-0" strokeWidth={2} />,
        label: t("operoz_assistant.assistant_index.indexed_label"),
        description: t("operoz_assistant.assistant_index.indexed_tooltip", { count: chunkCount }),
      },
      failed: {
        icon: <AlertCircle className="size-3.5 shrink-0" strokeWidth={2} />,
        label: t("operoz_assistant.assistant_index.failed_label"),
        description: t("operoz_assistant.assistant_index.failed_tooltip"),
      },
      stale: {
        icon: <Clock className="size-3.5 shrink-0" strokeWidth={2} />,
        label: t("operoz_assistant.assistant_index.stale_label"),
        description: t("operoz_assistant.assistant_index.stale_tooltip"),
      },
      not_indexed: {
        icon: <Bot className="size-3.5 shrink-0" strokeWidth={2} />,
        label: t("operoz_assistant.assistant_index.not_indexed_label"),
        description: t("operoz_assistant.assistant_index.not_indexed_tooltip"),
      },
    };

    return { ...variants[status], status, chunkCount };
  }, [stableData, t]);

  if (!presentation) {
    if (isLoading) {
      return (
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-subtle bg-layer-2 px-2.5 text-12 font-semibold text-tertiary">
          <Loader2 className="size-3.5 shrink-0 animate-spin" strokeWidth={2} />
          <span className="whitespace-nowrap">{t("operoz_assistant.assistant_index.loading_label")}</span>
        </span>
      );
    }
    if (error) {
      return (
        <Tooltip tooltipContent={t("operoz_assistant.assistant_index.status_error_tooltip")}>
          <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-danger-subtle bg-danger-subtle px-2.5 text-12 font-semibold text-danger-primary">
            <AlertCircle className="size-3.5 shrink-0" strokeWidth={2} />
            <span className="whitespace-nowrap">{t("operoz_assistant.assistant_index.status_error_label")}</span>
          </span>
        </Tooltip>
      );
    }
    return null;
  }

  return (
    <Tooltip
      tooltipContent={
        <AssistantIndexTooltipBody
          heading={presentation.label}
          description={presentation.description}
          status={presentation.status}
          etaAt={stableData?.eta_at}
          fallbackSeconds={stableData?.estimated_seconds_remaining}
          lastIndexDurationSeconds={stableData?.last_index_duration_seconds}
          chunkCount={presentation.chunkCount}
        />
      }
    >
      <span
        className={cn(
          "animate-quickFadeIn shadow-sm inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-12 font-semibold backdrop-blur-sm",
          STATUS_PILL_CLASS[presentation.status]
        )}
      >
        {presentation.icon}
        <span className="whitespace-nowrap">{presentation.label}</span>
      </span>
    </Tooltip>
  );
}
