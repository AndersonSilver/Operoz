import { observer } from "mobx-react";
import useSWR from "swr";
import { ImageIcon, KeyRound } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Loader } from "@operoz/ui";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstance } from "@/hooks/store";
import type { Route } from "./+types/page";
import { InstanceImageConfigForm } from "./form";

const InstanceImagePage = observer(function InstanceImagePage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { formattedConfig, fetchInstanceConfigurations } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: ImageIcon,
        title: t("god_mode.pages.image.title"),
        description: t("god_mode.pages.image.description"),
        highlights: [
          { label: t("god_mode.nav.image.name"), icon: ImageIcon, tone: "accent" },
          { label: "Unsplash", icon: KeyRound, tone: "warning" },
        ],
      }}
    >
      {formattedConfig ? (
        <InstanceImageConfigForm config={formattedConfig} />
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="140px" width="100%" />
          <Loader.Item height="200px" width="60%" />
        </Loader>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Images Settings - God Mode" }];

export default InstanceImagePage;
