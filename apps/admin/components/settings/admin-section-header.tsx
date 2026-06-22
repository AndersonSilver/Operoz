import { cn } from "@operis/utils";

type AdminSectionHeaderProps = {
  title: string;
  count?: number;
  hint?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function AdminSectionHeader(props: AdminSectionHeaderProps) {
  const { title, count, hint, actions, className } = props;

  return (
    <div className={cn("mb-4 flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h2 className="text-13 font-semibold text-secondary">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-layer-2 px-2 py-0.5 text-11 text-tertiary">{count}</span>
        )}
        {hint ? <p className="text-11 text-tertiary">{hint}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
