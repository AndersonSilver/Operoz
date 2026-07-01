"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { TClient360DetailResponse } from "@operoz/types";
import { renderFormattedDate } from "@operoz/utils";
import { buildClient360ClientBriefMd } from "@/components/board/client-360/build-client-360-client-brief-md";
import {
  Client360ClientBriefDocument,
  Client360ClientBriefEmptyState,
  Client360ClientBriefGenerateButton,
} from "@/components/board/client-360/client-360-client-brief-document";
import { Client360Section } from "@/components/board/client-360/client-360-ui";

type Props = {
  workspaceSlug: string;
  projectId: string;
  period: { start: string; end: string };
  data: TClient360DetailResponse;
  embedded?: boolean;
  generateSignal?: number;
  onLoadingChange?: (loading: boolean) => void;
  onBriefChange?: (hasBrief: boolean) => void;
};

function cacheKey(projectId: string, periodStart: string) {
  return `client360_client_brief_${projectId}_${periodStart}`;
}

export function Client360AiBriefBody({
  projectId,
  period,
  data,
  embedded = false,
  generateSignal = 0,
  onLoadingChange,
  onBriefChange,
}: Props) {
  const { t } = useTranslation();
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = sessionStorage.getItem(cacheKey(projectId, period.start));
      if (cached) {
        setMarkdown(cached);
        setGenerated(true);
        onBriefChange?.(true);
      }
    } catch {
      /* ignore */
    }
  }, [onBriefChange, projectId, period.start]);

  const periodLabel = `${renderFormattedDate(period.start)} — ${renderFormattedDate(period.end)}`;

  const generate = useCallback(() => {
    setGenerating(true);
    onLoadingChange?.(true);
    try {
      const text = buildClient360ClientBriefMd(data, periodLabel);
      setMarkdown(text);
      setGenerated(true);
      onBriefChange?.(true);
      try {
        sessionStorage.setItem(cacheKey(projectId, period.start), text);
      } catch {
        /* ignore quota */
      }
    } finally {
      setGenerating(false);
      onLoadingChange?.(false);
    }
  }, [data, onBriefChange, onLoadingChange, period.start, periodLabel, projectId]);

  useEffect(() => {
    if (generateSignal > 0) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateSignal]);

  if (generated) {
    return <Client360ClientBriefDocument data={data} period={period} markdown={markdown} />;
  }

  if (embedded) {
    return (
      <div className="space-y-3">
        <Button variant="primary" size="sm" loading={generating} onClick={generate}>
          {t("boards.client_360.ai_generate")}
        </Button>
        <Client360ClientBriefEmptyState onGenerate={generate} generating={generating} />
      </div>
    );
  }

  return <Client360ClientBriefEmptyState onGenerate={generate} generating={generating} />;
}

export function Client360AiBriefGenerateButton({
  hasBrief,
  loading,
  onClick,
}: {
  hasBrief: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return <Client360ClientBriefGenerateButton hasBrief={hasBrief} loading={loading} onClick={onClick} />;
}

export function Client360AiBrief(props: Props) {
  const { t } = useTranslation();

  return (
    <Client360Section
      sectionId="ai-brief"
      icon={Sparkles}
      iconTone="accent"
      title={t("boards.client_360.ai_title_client")}
      description={t("boards.client_360.ai_subtitle_client")}
    >
      <Client360AiBriefBody {...props} embedded />
    </Client360Section>
  );
}
