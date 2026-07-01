import { useTranslation } from "@operoz/i18n";
import { EmptyStateCompact } from "@operoz/propel/empty-state";

export function StickiesEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex w-full items-center justify-center rounded-lg bg-layer-1 py-10">
      <EmptyStateCompact assetKey="note" assetClassName="size-20" title={t("stickies.empty_state.simple")} />
    </div>
  );
}
