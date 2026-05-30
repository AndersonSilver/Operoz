import { useTranslation } from "@operis/i18n";
import { EmptyStateCompact } from "@operis/propel/empty-state";
import { SettingsHeading } from "@/components/settings/heading";

type Props = {
  titleKey: string;
  descriptionKey?: string;
};

export function BoardSettingsComingSoon(props: Props) {
  const { titleKey, descriptionKey = "boards.settings.coming_soon_description" } = props;
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <SettingsHeading title={t(titleKey)} description={t(descriptionKey)} />
      <div className="mt-8 flex justify-center">
        <EmptyStateCompact assetKey="project" title={t("boards.settings.coming_soon_title")} description={t(descriptionKey)} />
      </div>
    </div>
  );
}
