import { cn } from "@operoz/utils";
import type { ToneKey } from "@/components/common/tone-tokens";
import { TONE_TOKENS } from "@/components/common/tone-tokens";

/** Linha de distribuição com rótulo, contagem, percentual e barra de progresso. */
export function BreakdownRow({
  label,
  value,
  total,
  tone = "neutral",
}: {
  label: string;
  value: number;
  total: number;
  tone?: ToneKey;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const t = TONE_TOKENS[tone];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-12">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-secondary">
          <span className={cn("size-1.5 shrink-0 rounded-full", t.dot)} />
          {label}
        </span>
        <span className="shrink-0 text-tertiary tabular-nums">
          {value}
          <span className="ml-1 text-11">({pct}%)</span>
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-layer-2">
        <div className="h-full rounded-full opacity-90" style={{ width: `${pct}%`, backgroundColor: t.bar }} />
      </div>
    </div>
  );
}
