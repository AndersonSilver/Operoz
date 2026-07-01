import { Cloud, KeyRound, Upload } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/ui";
import "@/components/exporter/workspace-exports-settings.css";

const STEP_ICONS = [KeyRound, Cloud, Upload] as const;

export function WorkspaceJiraSettingsHero() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: STEP_ICONS[0],
      label: t("workspace_settings.settings.jira.hero.highlights.oauth"),
      tone: "accent" as const,
    },
    {
      icon: STEP_ICONS[1],
      label: t("workspace_settings.settings.jira.hero.highlights.connect"),
      tone: "success" as const,
    },
    {
      icon: STEP_ICONS[2],
      label: t("workspace_settings.settings.jira.hero.highlights.import"),
      tone: "warning" as const,
    },
  ];

  const toneClass = {
    accent: "border-accent-subtle/50 bg-accent-subtle/20 text-accent-primary",
    success: "border-success-subtle/50 bg-success-subtle/20 text-success-primary",
    warning: "border-warning-subtle/50 bg-warning-subtle/20 text-warning-primary",
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div
        className="workspace-exports-hero-dot-grid pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-subtle/30 via-transparent to-transparent opacity-60"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 p-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8 lg:p-6 xl:p-8">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="shadow-sm grid size-12 shrink-0 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary">
            <Cloud className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">Operoz</p>
            <h1 className="mt-0.5 text-18 font-semibold tracking-tight text-primary xl:text-20">
              {t("workspace_settings.settings.jira.heading")}
            </h1>
            <p className="mt-2 text-13 leading-relaxed text-secondary xl:max-w-3xl">
              {t("workspace_settings.settings.jira.description")}
            </p>
            <p className="mt-2 text-12 leading-relaxed text-tertiary xl:max-w-3xl">
              {t("workspace_settings.settings.jira.flow_description")}
            </p>
          </div>
        </div>

        <ol className="grid shrink-0 gap-2 sm:grid-cols-3 lg:w-[min(100%,22rem)] xl:w-[min(100%,26rem)]">
          {steps.map((step, index) => (
            <li
              key={step.label}
              className={cn("flex flex-col gap-2 rounded-xl border px-3 py-3", toneClass[step.tone])}
            >
              <span className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full border border-current/20 bg-layer-1/40 text-11 font-bold">
                  {index + 1}
                </span>
                <step.icon className="size-3.5 shrink-0" strokeWidth={1.75} />
              </span>
              <span className="text-11 leading-snug font-medium">{step.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
