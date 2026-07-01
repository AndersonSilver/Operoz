import React, { useState } from "react";
import { observer } from "mobx-react";
import { BookOpen, HelpCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@operoz/i18n";
import Link from "next/link";
// ui
import { CustomMenu } from "@operoz/ui";
import { cn } from "@operoz/utils";
// components
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
// plane web components
import { PlaneVersionNumber } from "@/plane-web/components/global";

export const HelpMenuRoot = observer(function HelpMenuRoot() {
  const { workspaceSlug } = useParams();
  // store hooks
  const { t } = useTranslation();
  const { toggleShortcutsListModal } = usePowerK();
  // states
  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);

  return (
    <CustomMenu
      customButton={
        <div
          className={cn(
            "group flex flex-col items-center justify-center gap-0.5 text-tertiary",
            isNeedHelpOpen && "text-secondary"
          )}
        >
          <AppSidebarItem.Icon icon={<HelpCircle className="size-5" />} highlight={isNeedHelpOpen} />
        </div>
      }
      menuButtonOnClick={() => !isNeedHelpOpen && setIsNeedHelpOpen(true)}
      onMenuClose={() => setIsNeedHelpOpen(false)}
      placement="bottom-end"
      maxHeight="lg"
      closeOnSelect
    >
      <CustomMenu.MenuItem>
        <Link
          href={`/${workspaceSlug?.toString()}/manual`}
          className="flex w-full items-center gap-x-2 rounded-sm text-11"
        >
          <BookOpen className="size-3.5 text-secondary" />
          <span className="text-11">{t("operoz_manual.title")}</span>
        </Link>
      </CustomMenu.MenuItem>
      <div className="my-1 border-t border-subtle" />
      <CustomMenu.MenuItem>
        <button
          type="button"
          onClick={() => toggleShortcutsListModal(true)}
          className="justify-sbg-layer-211 flex w-full items-center hover:bg-layer-1"
        >
          <span className="text-11">{t("keyboard_shortcuts")}</span>
        </button>
      </CustomMenu.MenuItem>
      <div className="mt-1 border-t border-subtle px-1 pt-2 text-11 text-secondary">
        <PlaneVersionNumber />
      </div>
    </CustomMenu>
  );
});
