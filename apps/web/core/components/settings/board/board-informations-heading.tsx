import { useTranslation } from "@operoz/i18n";
import type { IBoard } from "@operoz/types";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import { cn } from "@operoz/ui";

type Props = {
  board: IBoard;
  className?: string;
};

export function BoardInformationsHeading(props: Props) {
  const { board, className } = props;
  const { t } = useTranslation();

  return (
    <header className={cn("mb-8 max-w-2xl", className)}>
      <p className="tracking-widest text-11 font-semibold text-tertiary uppercase">
        {t("boards.settings.informations_eyebrow")}
      </p>
      <div className="mt-3 flex items-start gap-4">
        <span className="shadow-sm grid size-11 shrink-0 place-items-center rounded-lg border border-subtle bg-layer-2">
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
