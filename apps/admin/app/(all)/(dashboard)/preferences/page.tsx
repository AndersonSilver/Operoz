import { observer } from "mobx-react";
import { Languages, Palette } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { PageWrapper } from "@/components/common/page-wrapper";
import { AdminPreferencesForm } from "./form";
import type { Route } from "./+types/page";

function PreferencesPage() {
  const { t } = useTranslation();

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: Palette,
        title: t("god_mode.preferences.title"),
        description: t("god_mode.preferences.description"),
        highlights: [
          { label: t("theme"), icon: Palette, tone: "accent" },
          { label: t("language"), icon: Languages, tone: "purple" },
        ],
        gradientClass: "from-[var(--extended-color-purple-500)]/10",
        accentClass: "bg-[var(--extended-color-purple-500)]/10 text-[var(--extended-color-purple-500)]",
      }}
    >
      <AdminPreferencesForm />
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Preferences - God Mode" }];

export default observer(PreferencesPage);
