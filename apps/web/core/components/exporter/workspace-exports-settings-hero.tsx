import { Clock, Download, FileSpreadsheet, FolderKanban } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/ui";
import "./workspace-exports-settings.css";

export function WorkspaceExportsSettingsHero() {
  const { t } = useTranslation();

  const highlights = [
    {
      icon: FolderKanban,
      label: t("workspace_settings.settings.exports.hero.highlights.projects"),
      tone: "accent" as const,
    },
    {
      icon: FileSpreadsheet,
      label: t("workspace_settings.settings.exports.hero.highlights.formats"),
      tone: "success" as const,
    },
    {
      icon: Clock,
      label: t("workspace_settings.settings.exports.hero.highlights.history"),
      tone: "warning" as const,
    },
  ];

  const toneClass = {
    accent: "border-accent-subtle/50 bg-accent-subtle/30 text-accent-primary",
    success: "border-success-subtle/50 bg-success-subtle/30 text-success-primary",
    warning: "border-warning-subtle/50 bg-warning-subtle/30 text-warning-primary",
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div
        className="workspace-exports-hero-dot-grid pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-subtle/30 via-transparent to-transparent opacity-60"
        aria-hidden
      />

      <div className="relative flex items-start gap-4 p-5 lg:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary shadow-sm">
          <Download className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-11 font-semibold uppercase tracking-widest text-tertiary">Operoz</p>
          <h1 className="mt-0.5 text-18 font-semibold tracking-tight text-primary">
            {t("workspace_settings.settings.exports.heading")}
          </h1>
          <p className="mt-2 max-w-2xl text-13 leading-relaxed text-secondary">
            {t("workspace_settings.settings.exports.description")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {highlights.map((item) => (
              <li
                key={item.label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-11 font-medium",
                  toneClass[item.tone]
                )}
              >
                <item.icon className="size-3" strokeWidth={1.75} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
