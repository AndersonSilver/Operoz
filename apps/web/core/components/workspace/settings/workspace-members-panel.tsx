import type { ReactNode } from "react";
import { useTranslation } from "@operis/i18n";
import { CountChip } from "@/components/common/count-chip";
import "@/components/exporter/workspace-exports-settings.css";

type Props = {
  memberCount: number;
  toolbar: ReactNode;
  children: ReactNode;
  title?: string;
  hint?: string;
};

export function WorkspaceMembersPanel(props: Props) {
  const { memberCount, toolbar, children, title, hint } = props;
  const { t } = useTranslation();

  const panelTitle = title ?? t("workspace_settings.settings.members.title");
  const panelHint = hint ?? t("workspace_settings.settings.members.list_hint");

  return (
    <section className="workspace-exports-history-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div className="flex flex-col gap-3 border-b border-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-13 font-semibold text-primary">{panelTitle}</h3>
            {memberCount > 0 ? <CountChip count={memberCount} className="h-5" /> : null}
          </div>
          <p className="mt-0.5 text-12 text-tertiary">{panelHint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}
