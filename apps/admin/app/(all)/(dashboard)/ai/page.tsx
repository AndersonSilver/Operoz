import { observer } from "mobx-react";
import useSWR from "swr";
import { BrainCog, Sparkles, Zap } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Loader } from "@operis/ui";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstance } from "@/hooks/store";
import type { Route } from "./+types/page";
import { InstanceAIForm } from "./form";

const InstanceAIPage = observer(function InstanceAIPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { fetchInstanceConfigurations, formattedConfig } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: BrainCog,
        title: t("god_mode.pages.ai.title"),
        description: t("god_mode.pages.ai.description"),
        highlights: [
          { label: t("god_mode.ai.backend"), icon: Zap, tone: "accent" },
          { label: t("god_mode.ai.frontend"), icon: Sparkles, tone: "success" },
          { label: t("god_mode.ai.credentials_chip"), icon: BrainCog, tone: "purple" },
        ],
        gradientClass: "from-accent-subtle/50",
      }}
    >
      {formattedConfig ? (
        <InstanceAIForm config={formattedConfig} />
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="140px" width="100%" />
          <Loader.Item height="320px" width="100%" />
        </Loader>
      )}
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "AI Settings - God Mode" }];

export default InstanceAIPage;
