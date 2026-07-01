import { useState } from "react";
import { ChevronDown, FileText, Link2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
import type { TAssistantCitation } from "@/services/assistant.service";
import { AssistantCitationLink } from "@/components/assistant/assistant-citation-link";

type Props = {
  citation: TAssistantCitation;
  workspaceSlug: string;
};

function citationTitle(citation: TAssistantCitation, fallback: string): string {
  return (citation.label || "").trim() || fallback;
}

export function AssistantSourcePreview({ citation, workspaceSlug }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasExcerpt = Boolean(citation.excerpt?.trim());
  const title = citationTitle(citation, t("operoz_assistant.source_unknown"));

  if (!hasExcerpt || citation.source !== "rag") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-subtle/80 bg-layer-2/80 px-2.5 py-2">
        <FileText className="mt-0.5 size-3.5 shrink-0 text-accent-primary" />
        <div className="min-w-0 flex-1">
          <AssistantCitationLink citation={citation} workspaceSlug={workspaceSlug} />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-subtle/80 bg-layer-2/80">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-layer-3/60"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <FileText className="size-3.5 shrink-0 text-accent-primary" />
        <span className="min-w-0 flex-1 truncate text-11 font-medium text-primary">
          {t("operoz_assistant.source_label", { label: title })}
        </span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-tertiary transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="space-y-2 border-t border-subtle/80 bg-layer-1/50 px-2.5 py-2.5">
          <p className="line-clamp-6 text-11 leading-relaxed whitespace-pre-wrap text-secondary">{citation.excerpt}</p>
          <div className="flex items-center gap-1.5 text-10 text-tertiary">
            <Link2 className="size-3" />
            <AssistantCitationLink citation={citation} workspaceSlug={workspaceSlug} />
          </div>
        </div>
      )}
    </div>
  );
}
