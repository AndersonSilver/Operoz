import { cn } from "@operis/ui";

type Props = {
  className?: string;
};

/** Ilustração abstrata de fluxo (gatilho → nós → ação) para o hero. */
export function AutomationHeroIllustration(props: Props) {
  const { className } = props;

  return (
    <svg
      viewBox="0 0 200 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[5.5rem] w-[12.5rem] shrink-0 opacity-95", className)}
      aria-hidden
    >
      <path
        d="M28 44 H52 M148 44 H172 M76 44 H124"
        stroke="var(--border-subtle-1)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <rect
        x="8"
        y="30"
        width="36"
        height="28"
        rx="8"
        fill="var(--bg-accent-subtle)"
        stroke="var(--border-accent-subtle)"
        strokeWidth="1"
      />
      <circle cx="24" cy="44" r="4" stroke="var(--bg-accent-primary)" strokeWidth="2" />
      <rect
        x="72"
        y="26"
        width="56"
        height="36"
        rx="8"
        fill="var(--bg-layer-2)"
        stroke="var(--border-subtle-1)"
        strokeWidth="1"
      />
      <rect x="82" y="36" width="36" height="6" rx="2" fill="var(--border-subtle-1)" opacity="0.7" />
      <rect x="82" y="46" width="24" height="6" rx="2" fill="var(--border-subtle-1)" opacity="0.45" />
      <rect
        x="156"
        y="30"
        width="36"
        height="28"
        rx="8"
        fill="var(--bg-success-subtle)"
        stroke="var(--border-success-subtle)"
        strokeWidth="1"
      />
      <path
        d="M168 40 L174 44 L168 48"
        stroke="var(--bg-success-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
