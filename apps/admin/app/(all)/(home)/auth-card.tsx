import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

/** Card de formulário — alinhado ao AuthContainer do login web. */
export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="flex w-full flex-grow flex-col items-center justify-center lg:justify-center">
      <div className="group relative w-full max-w-[28rem]">
        <div
          className="pointer-events-none absolute -inset-3 rounded-[1.75rem] bg-accent-primary/15 opacity-0 blur-2xl transition-opacity duration-500 group-focus-within:opacity-100 dark:bg-accent-primary/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-br from-accent-primary/25 via-white/[0.06] to-accent-primary/10 dark:from-accent-primary/35 dark:via-white/[0.04]"
          aria-hidden="true"
        />
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-layer-2/70 p-8 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-10 dark:border-white/[0.06] dark:bg-layer-2/80 dark:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)]">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-accent-primary/[0.03]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
            aria-hidden="true"
          />
          <div className="relative flex w-full flex-col gap-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
