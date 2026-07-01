import { Bell, Calendar, Link2, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/ui";
import "./alerts-settings.css";

export function AlertsSettingsHero() {
  const { t } = useTranslation();

  const highlights = [
    {
      icon: Bell,
      label: t("workspace_settings.settings.notifications.hero.highlights.multi_channel"),
      tone: "accent" as const,
    },
    {
      icon: SlidersHorizontal,
      label: t("workspace_settings.settings.notifications.hero.highlights.personal"),
      tone: "success" as const,
    },
    {
      icon: Link2,
      label: t("workspace_settings.settings.notifications.hero.highlights.external"),
      tone: "warning" as const,
    },
    {
      icon: Calendar,
      label: t("workspace_settings.settings.notifications.hero.highlights.history"),
      tone: "accent" as const,
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
        className="alerts-settings-hero-dot-grid pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-subtle/35 via-transparent to-transparent opacity-60"
        aria-hidden
      />

      <div className="relative flex items-start gap-4 p-5 lg:p-6">
        <span className="shadow-sm grid size-12 shrink-0 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary">
          <Bell className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">Operoz</p>
          <h1 className="mt-0.5 text-18 font-semibold tracking-tight text-primary">
            {t("workspace_settings.settings.notifications.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-13 leading-relaxed text-secondary">
            {t("workspace_settings.settings.notifications.description")}
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
