"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Menu, X } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { OperozDocsSidebar } from "./operoz-docs-sidebar";

type Props = {
  children: React.ReactNode;
};

export const OperozDocsShell = observer(function OperozDocsShell({ children }: Props) {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas md:flex-row">
      <div className="flex items-center justify-between border-b border-subtle bg-surface-1 px-3 py-2 md:hidden">
        <p className="text-13 font-semibold text-primary">{t("operoz_manual.title")}</p>
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          className="rounded-md p-1.5 text-secondary hover:bg-layer-transparent-hover"
          aria-label={t("operoz_manual.mobile_nav_toggle")}
        >
          {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileNavOpen && (
        <div className="absolute inset-x-0 top-10 z-20 h-[calc(100%-2.5rem)] md:hidden">
          <OperozDocsSidebar />
        </div>
      )}

      <main className="relative min-w-0 flex-1 overflow-hidden bg-surface-1">{children}</main>

      <div className="hidden md:flex">
        <OperozDocsSidebar />
      </div>
    </div>
  );
});
