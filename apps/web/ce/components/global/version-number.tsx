// assets
import { useTranslation } from "@operoz/i18n";
import packageJson from "package.json";

export function OperozVersionNumber() {
  const { t } = useTranslation();
  return (
    <span>
      {t("version")}: v{packageJson.version}
    </span>
  );
}
