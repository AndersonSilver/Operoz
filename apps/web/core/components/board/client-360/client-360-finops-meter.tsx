import { cn } from "@operis/utils";
import { CLIENT_360_TONE, type Client360Tone } from "@/components/board/client-360/client-360-tokens";

type Props = {
  label: string;
  valueLabel: string;
  pct: number;
  tone?: Client360Tone;
  detail?: string;
  secondary?: { label: string; pct: number; tone?: Client360Tone };
};

export function Client360FinopsMeter({ label, valueLabel, pct, tone = "accent", detail, secondary }: Props) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const barColor = CLIENT_360_TONE[tone].bar;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <span className="text-12 font-medium text-primary">{label}</span>
        <span className="text-12 font-semibold text-secondary tabular-nums">{valueLabel}</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-layer-2">
        {secondary ? (
          <div
            className="bg-tertiary/25 absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
            style={{ width: `${Math.min(Math.max(secondary.pct, 0), 100)}%` }}
            aria-hidden
          />
        ) : null}
        <div
          className={cn("relative h-full rounded-full transition-[width] duration-300", secondary && "z-[1]")}
          style={{ width: `${clamped}%`, backgroundColor: barColor }}
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
      {secondary ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-11 text-tertiary">
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-tertiary/40 size-2 rounded-full" aria-hidden />
            {secondary.label}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: barColor }} aria-hidden />
            {label}
          </span>
        </div>
      ) : null}
      {detail ? <p className="text-11 leading-snug text-tertiary">{detail}</p> : null}
    </div>
  );
}
