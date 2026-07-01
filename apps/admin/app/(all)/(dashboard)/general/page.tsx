import { observer } from "mobx-react";
import { Cog, Gauge, Telescope } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstance } from "@/hooks/store";
import { GeneralConfigurationForm } from "./form";
import type { Route } from "./+types/page";

function GeneralPage() {
  const { t } = useTranslation();
  const { instance, instanceAdmins } = useInstance();

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: Cog,
        title: t("god_mode.pages.general.title"),
        description: t("god_mode.pages.general.description"),
        highlights: [
          { label: t("god_mode.nav.general.name"), icon: Cog, tone: "accent" },
          { label: t("god_mode.pages.general.instance_details"), icon: Gauge, tone: "purple" },
          { label: t("god_mode.pages.general.telemetry_title"), icon: Telescope, tone: "success" },
        ],
      }}
    >
      {instance && instanceAdmins && <GeneralConfigurationForm instance={instance} instanceAdmins={instanceAdmins} />}
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "General Settings - God Mode" }];

export default observer(GeneralPage);
