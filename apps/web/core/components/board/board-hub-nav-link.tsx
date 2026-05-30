import type { ReactNode } from "react";
import { cn } from "@operis/utils";
import { useBoardHubNavigate } from "@/components/board/use-board-hub-navigate";

type Props = {
  to: string;
  className?: string;
  children: ReactNode;
};

/** Evita "component suspended while responding to synchronous input" ao mudar de tab no hub do board. */
export function BoardHubNavLink({ to, className, children }: Props) {
  const navigate = useBoardHubNavigate();

  return (
    <button
      type="button"
      className={cn(className)}
      onClick={() => navigate(to)}
    >
      {children}
    </button>
  );
}
