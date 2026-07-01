import { observer } from "mobx-react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { PlusIcon } from "@operoz/propel/icons";
import type { THomeWidgetProps } from "@operoz/types";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useHome } from "@/hooks/store/use-home";
import { usePowerK } from "@/hooks/store/use-power-k";

export const HomeShortcutsWidget = observer(function HomeShortcutsWidget(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { toggleWidgetSettings } = useHome();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { togglePowerKModal } = usePowerK();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => toggleCommandPaletteModal(true)}
        className="rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 font-medium text-primary hover:bg-layer-1"
      >
        {t("home.shortcuts.search")} <span className="text-tertiary">⌘K</span>
      </button>
      <button
        type="button"
        onClick={() => toggleCreateIssueModal(true)}
        className="flex items-center gap-1 rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 font-medium text-accent-primary hover:bg-layer-1"
      >
        <PlusIcon className="size-4" />
        {t("home.shortcuts.new_work_item")}
      </button>
      <button
        type="button"
        onClick={() => toggleWidgetSettings(true)}
        className="flex items-center gap-1 rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 font-medium text-primary hover:bg-layer-1"
      >
        <Settings className="size-4" />
        {t("home.manage_widgets")}
      </button>
      <Link
        href={`/${workspaceSlug}/notifications`}
        className="rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 font-medium text-primary hover:bg-layer-1"
      >
        {t("home.shortcuts.notifications")}
      </Link>
      <Link
        href={`/${workspaceSlug}/drafts`}
        className="rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 font-medium text-primary hover:bg-layer-1"
      >
        {t("home.shortcuts.drafts")}
      </Link>
    </div>
  );
});
