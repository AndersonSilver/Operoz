import { observer } from "mobx-react";
import { MessagesSquare, Shield, Zap } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { PageWrapper } from "@/components/common/page-wrapper";
import { AdminSettingsPanel } from "@/components/settings/admin-settings-panel";
import type { Route } from "./+types/page";

const DiscordInstancePage = observer(function DiscordInstancePage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const interactionUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/discord/interactions/`
      : "/api/discord/interactions/";

  return (
    <PageWrapper
      size="lg"
      header={{
        icon: MessagesSquare,
        title: t("god_mode.pages.discord.title"),
        description: t("god_mode.pages.discord.description"),
        highlights: [
          { label: t("god_mode.pages.discord.highlight_bot"), icon: Zap, tone: "accent" },
          { label: t("god_mode.pages.discord.highlight_security"), icon: Shield, tone: "success" },
        ],
      }}
    >
      <AdminSettingsPanel
        title={t("god_mode.pages.discord.panel_title")}
        description={t("god_mode.pages.discord.panel_description")}
        icon={MessagesSquare}
        iconClassName="text-accent-primary"
        accentClassName="bg-accent-primary"
      >
        <div className="space-y-4 text-13 text-secondary">
          <p>{t("god_mode.pages.discord.env_hint")}</p>
          <ul className="list-disc space-y-1 pl-5 text-12">
            <li>
              <code className="rounded-sm bg-layer-2 px-1 py-0.5 text-primary">DISCORD_APPLICATION_ID</code>
            </li>
            <li>
              <code className="rounded-sm bg-layer-2 px-1 py-0.5 text-primary">DISCORD_BOT_TOKEN</code>
            </li>
            <li>
              <code className="rounded-sm bg-layer-2 px-1 py-0.5 text-primary">DISCORD_PUBLIC_KEY</code>
            </li>
          </ul>
          <div>
            <p className="mb-1 text-11 font-semibold tracking-wide text-tertiary uppercase">
              {t("god_mode.pages.discord.interaction_url_label")}
            </p>
            <code className="block rounded-md border border-subtle bg-layer-2 px-3 py-2 text-12 text-primary">
              {interactionUrl}
            </code>
          </div>
          <p className="text-12 text-tertiary">{t("god_mode.pages.discord.workspace_hint")}</p>
        </div>
      </AdminSettingsPanel>
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Discord - God Mode" }];

export default DiscordInstancePage;
