import { useTranslation } from "@operis/i18n";
import type { IBoard } from "@operis/types";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { cn } from "@operis/ui";

type Props = {
  board: IBoard;
  className?: string;
};

export function BoardInformationsHeading(props: Props) {
  const { board, className } = props;
  const { t } = useTranslation();

  return (
    <header className={cn("mb-8 max-w-2xl", className)}>
      <p className="text-11 font-semibold uppercase tracking-widest text-tertiary">
        {t("boards.settings.informations_eyebrow")}
      </p>
      <div className="mt-3 flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-subtle bg-layer-2 shadow-sm">
          <Logo logo={board.logo_props} size={24} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-h3-semibold text-primary sm:text-h2-semibold">
            {t("boards.settings.informations_title")}
          </h1>
          <p className="mt-2 text-14 leading-relaxed text-secondary">
            {t("boards.settings.informations_lead", { boardName: board.name })}
          </p>
        </div>
      </div>
    </header>
  );
}
