// plane imports
import { cn } from "@operis/utils";

type Props = {
  className?: string;
  control?: React.ReactNode;
  description?: React.ReactNode;
  stacked?: boolean;
  title: React.ReactNode;
};

export function SettingsBoxedControlItem(props: Props) {
  const { className, control, description, stacked, title } = props;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border border-subtle bg-surface-1 px-4 py-4",
        !stacked && "items-start md:flex-row md:items-center md:justify-between md:gap-8",
        stacked && "items-start",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h4 className="text-13 font-semibold text-primary">{title}</h4>
        {description && <p className="text-12 leading-relaxed text-tertiary">{description}</p>}
      </div>
      {control && <div className="shrink-0 self-start">{control}</div>}
    </div>
  );
}
