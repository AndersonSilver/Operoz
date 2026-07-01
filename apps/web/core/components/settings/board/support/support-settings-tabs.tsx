"use client";

import { cn } from "@operoz/utils";
import "../automation/automation-list.css";

export type SupportSettingsTab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: SupportSettingsTab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
};

export function SupportSettingsTabs<T extends string>(props: Props<T>) {
  const { tabs, activeTab, onChange } = props;

  return (
    <nav className="relative overflow-hidden rounded-xl border border-subtle bg-layer-1 p-1.5" aria-label="Sustentação">
      <div className="automation-hero-dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-13 font-medium transition-all",
                active
                  ? "shadow-xs bg-surface-1 text-primary ring-1 ring-subtle"
                  : "text-tertiary hover:bg-layer-2/80 hover:text-secondary"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
