"use client";

import { Bot, FileText, HeartPulse, Sparkles } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
import {
  buildIntelRailHint,
  type Client360IntelligencePanelKind,
  type Client360IntelligenceRailContext,
} from "@/components/board/client-360/client-360-intelligence-panel";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import "@/components/exporter/workspace-exports-settings.css";

const RAIL_ITEM_TONE: Record<Client360IntelligencePanelKind, keyof typeof CLIENT_360_TONE> = {
  explainer: "info",
  brief: "accent",
  portfolio_brief: "accent",
  qbr: "warning",
  assistant: "accent",
};

type Props = {
  context: Client360IntelligenceRailContext;
  onOpen: (kind: Client360IntelligencePanelKind) => void;
  persona?: "management" | "pm";
  className?: string;
};

export function Client360DetailSidebar({ context, onOpen, persona = "management", className }: Props) {
  const { t } = useTranslation();

  const items: Array<{
    kind: Client360IntelligencePanelKind;
    label: string;
    descriptionKey: string;
    icon: typeof Sparkles;
  }> = [
    {
      kind: "explainer",
      label: t("boards.client_360.intelligence_explainer_action"),
      descriptionKey: "boards.client_360.detail_intel_rail_action_explainer_desc",
      icon: HeartPulse,
    },
    {
      kind: "brief",
      label: t("boards.client_360.ai_generate"),
      descriptionKey: "boards.client_360.detail_intel_rail_action_brief_desc",
      icon: Sparkles,
    },
    ...(persona !== "pm"
      ? [
          {
            kind: "qbr" as const,
            label: t("boards.client_360.intelligence_qbr_generate"),
            descriptionKey: "boards.client_360.detail_intel_rail_action_qbr_desc",
            icon: FileText,
          },
        ]
      : []),
    {
      kind: "assistant",
      label: t("boards.client_360.intelligence_chat_open"),
      descriptionKey: "boards.client_360.detail_intel_rail_action_chat_desc",
      icon: Bot,
    },
  ];

  const hint = buildIntelRailHint(context, t);

  return (
    <aside
      className={cn(
        "client-360-workspace-sidebar workspace-exports-history-panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1",
        className
      )}
    >
      <div className="workspace-exports-hero-dot-grid shrink-0 border-b border-subtle bg-gradient-to-br from-accent-subtle/15 via-transparent to-transparent px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary">
            <Sparkles className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-13 font-semibold text-primary">{t("boards.client_360.detail_intel_rail_label")}</p>
            <p className="mt-0.5 text-11 leading-relaxed text-tertiary">
              {t("boards.client_360.detail_intel_rail_subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col divide-y divide-subtle">
        <section className="shrink-0 px-5 py-4">
          <p className="rounded-lg border border-subtle/80 bg-layer-2/40 px-3.5 py-3 text-12 leading-relaxed text-secondary">
            {hint}
          </p>
        </section>

        <section className="shrink-0 px-5 py-4">
          <h3 className="tracking-widest mb-3 text-10 font-semibold text-tertiary uppercase">
            {t("boards.client_360.portfolio_sidebar_section_actions")}
          </h3>
          <div className={cn("grid gap-2", items.length <= 2 ? "grid-cols-1" : "grid-cols-2")}>
            {items.map(({ kind, label, descriptionKey, icon: Icon }) => {
              const token = CLIENT_360_TONE[RAIL_ITEM_TONE[kind]];
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onOpen(kind)}
                  className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-subtle bg-layer-1 px-2.5 py-2.5 text-left transition-colors hover:border-strong hover:bg-layer-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", token.iconBg)}>
                      <Icon className={cn("size-3.5", token.icon)} strokeWidth={1.75} />
                    </span>
                    <span className="line-clamp-2 min-w-0 text-11 leading-snug font-medium text-primary">{label}</span>
                  </span>
                  <span className="line-clamp-2 text-10 leading-relaxed text-tertiary">{t(descriptionKey)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <footer className="mt-auto shrink-0 bg-layer-2/20 px-5 py-3">
          <p className="text-10 leading-relaxed text-tertiary">{t("boards.client_360.detail_intel_rail_tip")}</p>
        </footer>
      </div>
    </aside>
  );
}
