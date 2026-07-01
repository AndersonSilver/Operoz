// helpers
import { cn } from "@operoz/utils";

type Props = {
  name: string;
  description: string;
  icon: React.ReactNode;
  config: React.ReactNode;
  disabled?: boolean;
  withBorder?: boolean;
  unavailable?: boolean;
  active?: boolean;
};

export function AuthenticationMethodCard(props: Props) {
  const {
    name,
    description,
    icon,
    config,
    disabled = false,
    withBorder = true,
    unavailable = false,
    active = false,
  } = props;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-150",
        withBorder && "px-4 py-3",
        active
          ? "border-accent-subtle/50 bg-accent-subtle/10"
          : "border-subtle bg-layer-2/30 hover:border-strong hover:bg-layer-1-hover/30",
        unavailable && "opacity-60"
      )}
    >
      {active ? <span className="absolute inset-x-0 top-0 h-0.5 bg-accent-primary" aria-hidden /> : null}
      <div className="flex w-full items-center gap-4 sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-subtle bg-layer-1">
            {icon}
          </div>
          <div className="min-w-0 grow">
            <div
              className={cn("leading-snug font-medium text-primary", {
                "text-13": withBorder,
                "text-16": !withBorder,
              })}
            >
              {name}
            </div>
            <div
              className={cn("mt-0.5 leading-relaxed text-tertiary", {
                "text-11": withBorder,
                "text-13": !withBorder,
              })}
            >
              {description}
            </div>
          </div>
        </div>
        <div className={cn("shrink-0", disabled && "opacity-70")}>{config}</div>
      </div>
    </div>
  );
}
