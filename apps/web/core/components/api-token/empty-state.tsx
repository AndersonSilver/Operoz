import { KeyRound, Plus } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";

type Props = {
  onClick: () => void;
};

export function ApiTokenEmptyState({ onClick }: Props) {
  const { t } = useTranslation();

  return (
    <section className="flex w-full flex-col items-start rounded-md border border-dashed border-subtle bg-layer-1 px-5 py-8">
      <span className="grid size-10 place-items-center rounded-md border border-subtle bg-accent-subtle text-accent-primary">
        <KeyRound className="size-4" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-14 font-semibold text-primary">{t("settings_empty_state.tokens.title")}</h3>
      <p className="mt-1.5 max-w-md text-13 leading-5 text-tertiary">{t("settings_empty_state.tokens.description")}</p>
      <Button
        variant="primary"
        size="base"
        className="mt-5"
        onClick={onClick}
        prependIcon={<Plus className="size-3.5" />}
      >
        {t("settings_empty_state.tokens.cta_primary")}
      </Button>
    </section>
  );
}
