import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function AlertsSettingsSection(props: Props) {
  const { title, description, action, children } = props;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-15 font-semibold tracking-tight text-primary">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-13 leading-relaxed text-secondary">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
