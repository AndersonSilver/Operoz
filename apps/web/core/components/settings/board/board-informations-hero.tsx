import { LayoutGrid, Palette, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import type { IBoard } from "@operoz/types";
import { cn } from "@operoz/ui";
import "./board-informations-settings.css";

type Props = {
  board: IBoard;
};

export function BoardInformationsHero(props: Props) {
  const { board } = props;
  const { t } = useTranslation();

  const highlights = [
    {
      icon: Palette,
      label: t("boards.settings.hero.highlights.identity"),
      tone: "accent" as const,
    },
    {
      icon: Users,
      label: t("boards.settings.hero.highlights.team"),
      tone: "success" as const,
    },
    {
      icon: LayoutGrid,
      label: t("boards.settings.hero.highlights.defaults"),
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
        className="board-informations-hero-dot-grid pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-subtle/30 via-transparent to-transparent opacity-60"
        aria-hidden
      />

      <div className="relative flex items-start gap-4 p-5 lg:p-6">
        <span className="shadow-sm grid size-12 shrink-0 place-items-center rounded-xl border border-subtle bg-accent-subtle text-accent-primary">
          <Logo logo={board.logo_props} size={24} />
        </span>
        <div className="min-w-0">
          <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">
            {t("boards.settings.informations_eyebrow")}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h1 className="text-18 font-semibold tracking-tight text-primary">
              {t("boards.settings.informations_title")}
            </h1>
            <span className="rounded-full bg-layer-2 px-2 py-0.5 text-10 font-medium text-tertiary">{board.name}</span>
          </div>
          <p className="mt-2 max-w-2xl text-13 leading-relaxed text-secondary">
            {t("boards.settings.informations_lead", { boardName: board.name })}
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
