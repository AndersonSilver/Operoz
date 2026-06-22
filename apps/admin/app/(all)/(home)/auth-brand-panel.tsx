import { Lock, Server, Settings2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { AdminBrandLogo } from "./admin-brand-logo";

const featureIcons = [Server, Settings2, Lock] as const;

export function AuthBrandPanel() {
  const { t } = useTranslation();

  const features = [
    {
      icon: featureIcons[0],
      title: t("god_mode.auth.brand_panel.feature_workspaces_title"),
      description: t("god_mode.auth.brand_panel.feature_workspaces_desc"),
    },
    {
      icon: featureIcons[1],
      title: t("god_mode.auth.brand_panel.feature_settings_title"),
      description: t("god_mode.auth.brand_panel.feature_settings_desc"),
    },
    {
      icon: featureIcons[2],
      title: t("god_mode.auth.brand_panel.feature_security_title"),
      description: t("god_mode.auth.brand_panel.feature_security_desc"),
    },
  ];

  return (
    <aside className="relative hidden min-h-screen w-full flex-col justify-between overflow-hidden border-r border-subtle/40 bg-layer-1/50 p-10 backdrop-blur-sm lg:flex lg:w-[44%] xl:w-[42%] xl:p-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--border-color-subtle) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent-primary/20 blur-[80px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-accent-primary/10 blur-[64px]"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <AdminBrandLogo height={44} />
      </div>

      <div className="relative z-10 flex flex-col gap-10">
        <div className="space-y-4">
          <p className="text-12 font-semibold tracking-[0.18em] text-accent-primary uppercase">
            {t("god_mode.auth.brand_panel.eyebrow")}
          </p>
          <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-primary xl:text-[2.35rem]">
            {t("god_mode.auth.brand_panel.title")}
          </h1>
          <p className="text-15 max-w-md leading-relaxed text-secondary">{t("god_mode.auth.brand_panel.subtitle")}</p>
        </div>

        <ul className="flex flex-col gap-5">
          {features.map((feature) => (
            <li key={feature.title} className="flex gap-4">
              <span className="shadow-sm flex size-10 shrink-0 items-center justify-center rounded-xl border border-subtle/80 bg-layer-2/80 text-accent-primary">
                <feature.icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <div className="space-y-0.5 pt-0.5">
                <p className="text-14 font-medium text-primary">{feature.title}</p>
                <p className="text-13 leading-relaxed text-tertiary">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-13 text-secondary">
        {t("god_mode.auth.brand_panel.footer", { year: new Date().getFullYear() })}
      </p>
    </aside>
  );
}
