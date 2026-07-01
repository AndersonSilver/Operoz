import { Plus } from "lucide-react";
import { cn } from "@operoz/ui";

type Props = {
  label: string;
  hint?: string;
  loading?: boolean;
  onClick: () => void;
  accentClass?: string;
};

export function AutomationCreateCard(props: Props) {
  const { label, hint, loading, onClick, accentClass = "text-accent-primary" } = props;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={cn(
        "group flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-subtle",
        "bg-transparent px-4 py-8 text-center transition-all duration-150",
        "hover:border-accent-subtle hover:bg-accent-subtle/10",
        "focus-visible:ring-accent-primary focus-visible:ring-offset-surface-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        loading && "pointer-events-none opacity-60"
      )}
    >
      <span
        className={cn(
          "grid size-11 place-items-center rounded-xl border border-subtle bg-layer-1 transition-colors",
          "group-hover:border-accent-subtle group-hover:bg-accent-subtle/30",
          accentClass
        )}
      >
        <Plus className="size-5" strokeWidth={1.75} />
      </span>
      <span className="text-13 font-semibold text-primary">{label}</span>
      {hint && <span className="max-w-[12rem] text-11 leading-relaxed text-tertiary">{hint}</span>}
    </button>
  );
}
