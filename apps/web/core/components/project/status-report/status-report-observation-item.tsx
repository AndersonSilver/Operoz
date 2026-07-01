import { Pencil, X } from "lucide-react";
import { cn } from "@operoz/utils";
import { isObservationHtml } from "@/components/project/status-report/observation-content";
import { ObservationHtmlView } from "@/components/project/status-report/observation-html-view";

function renderObservationBoldText(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  return segments.map((segment, index) => {
    const bold = segment.match(/^\*\*(.+)\*\*$/);
    if (bold) {
      return (
        <strong key={index} className="font-medium text-primary">
          {bold[1]}
        </strong>
      );
    }
    return <span key={index}>{segment}</span>;
  });
}

function parseObservationCard(line: string): { title?: string; body: string; date?: string } {
  const dateMatch = line.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  const date = dateMatch?.[1];
  let rest = line;
  if (date) {
    rest = rest
      .replace(date, "")
      .replace(/\s*[·|]\s*$/, "")
      .trim();
  }

  const parts = rest.split(/\s+[—–-]\s+/);
  if (parts.length >= 2 && parts[0].length > 0 && parts[0].length < 120) {
    return {
      title: parts[0].trim(),
      body: parts.slice(1).join(" — ").trim() || parts[0].trim(),
      date,
    };
  }

  return { body: line, date };
}

type Props = {
  line: string;
  variant: "exec" | "attention" | "next";
  onEdit?: () => void;
  onRemove?: () => void;
  editLabel?: string;
  removeLabel?: string;
};

const ACCENT_BAR_CLASS = {
  exec: "bg-[#00d386]",
  attention: "bg-[#ff4a4a]",
  next: "bg-[#3b82f6]",
} as const;

export function StatusReportObservationItem(props: Props) {
  const { line, variant, onEdit, onRemove, editLabel = "Edit", removeLabel = "Remove" } = props;
  const hasActions = Boolean(onEdit || onRemove);

  return (
    <div className={cn("group relative flex gap-2 py-2.5 first:pt-0 last:pb-0", hasActions && "pr-14")}>
      <span className={cn("w-1 shrink-0 self-stretch rounded-sm", ACCENT_BAR_CLASS[variant])} aria-hidden />
      <div className="min-w-0 flex-1">
        {isObservationHtml(line) ? (
          <ObservationHtmlView html={line} />
        ) : (
          (() => {
            const { title, body, date } = parseObservationCard(line);
            const showBody = Boolean(body && body !== title);
            return (
              <div className="text-[11px] leading-relaxed text-secondary">
                {title && <p className="font-medium text-primary">{renderObservationBoldText(title)}</p>}
                {date && <p className="mt-0.5 text-[10px] text-tertiary">{date}</p>}
                {showBody && <p className={cn((title || date) && "mt-0.5")}>{renderObservationBoldText(body)}</p>}
                {!title && !showBody && !date && <p>{renderObservationBoldText(line)}</p>}
              </div>
            );
          })()
        )}
      </div>
      {(onEdit || onRemove) && (
        <div className="absolute top-2 right-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded p-0.5 text-tertiary hover:bg-layer-3 hover:text-primary"
              aria-label={editLabel}
            >
              <Pencil className="size-3.5" strokeWidth={1.75} />
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded p-0.5 text-tertiary hover:bg-layer-3 hover:text-danger-primary"
              aria-label={removeLabel}
            >
              <X className="size-3.5" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
