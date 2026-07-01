import { LayoutGrid, Plus } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";

type Props = {
  canCreate: boolean;
  onCreate: () => void;
};

export function BoardsSidebarEmptyState(props: Props) {
  const { canCreate, onCreate } = props;
  const { t } = useTranslation();

  return (
    <div className="mx-1 mb-2 rounded-lg border border-dashed border-subtle bg-layer-1/40 px-3 py-4 text-center">
      <span className="mx-auto mb-3 grid size-10 place-items-center rounded-lg border border-subtle bg-accent-subtle/40 text-accent-primary">
        <LayoutGrid className="size-4" strokeWidth={1.75} />
      </span>
      <p className="text-13 font-medium text-secondary">{t("boards.empty_sidebar_title")}</p>
      <p className="mt-1 text-11 leading-relaxed text-tertiary">{t("boards.empty_sidebar_description")}</p>
      {canCreate && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={onCreate}
          prependIcon={<Plus className="size-3.5" />}
        >
          {t("boards.empty_sidebar_cta")}
        </Button>
      )}
    </div>
  );
}
