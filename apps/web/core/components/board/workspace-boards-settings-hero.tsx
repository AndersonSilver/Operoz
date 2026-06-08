import { Archive, FolderKanban, LayoutGrid, Users } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/ui";
import "./workspace-boards-settings.css";

type Props = {
  boardCount: number;
};

export function WorkspaceBoardsSettingsHero(props: Props) {
  const { boardCount } = props;
  const { t } = useTranslation();

  const highlights = [
    { icon: Users, label: t("workspace_settings.settings.boards.hero.highlights.teams"), tone: "accent" as const },
    { icon: FolderKanban, label: t("workspace_settings.settings.boards.hero.highlights.projects"), tone: "success" as const },
    { icon: Archive, label: t("workspace_settings.settings.boards.hero.highlights.archive"), tone: "warning" as const },
  ];

  const toneClass = {
    accent: "border-accent-subtle/50 bg-accent-subtle/30 text-accent-primary",
    success: "border-success-subtle/50 bg-success-subtle/30 text-success-primary",
    warning: "border-warning-subtle/50 bg-warning-subtle/30 text-warning-primary",
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div
        className="workspace-boards-hero-dot-grid pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-subtle/35 via-transparent to-transparent opacity-60"
        aria-hidden
      />

      <div className="relative flex items-start gap-4 p-5 lg:p-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary shadow-sm">
          <LayoutGrid className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-11 font-semibold uppercase tracking-widest text-tertiary">Operoz</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h1 className="text-18 font-semibold tracking-tight text-primary">
              {t("workspace_settings.settings.boards.title")}
            </h1>
            {boardCount > 0 && (
              <span className="rounded-full bg-layer-2 px-2 py-0.5 text-10 font-medium text-tertiary">
                {t("workspace_settings.settings.boards.filters.count", { count: boardCount })}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-13 leading-relaxed text-secondary">
            {t("workspace_settings.settings.boards.description")}
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
