import type { ReactNode } from "react";

type WidgetSectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export function WidgetSection(props: WidgetSectionProps) {
  const { title, action, children } = props;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="text-14 font-semibold text-tertiary">{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}
