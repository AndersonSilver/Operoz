import { observer } from "mobx-react";
import { Calendar, CheckCircle2, Link2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Button } from "@operoz/propel/button";
import { cn } from "@operoz/ui";
import { EModalPosition, EModalWidth, ModalCore } from "@operoz/ui";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  workspaceSlug: string;
};

export const IntegrationsSetupModal = observer(function IntegrationsSetupModal({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspace = getWorkspaceBySlug(workspaceSlug);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [connectingDiscord, setConnectingDiscord] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    alertStore.fetchExternalAccounts(workspaceSlug).then(() => setLoaded(true));
  }, [alertStore, workspaceSlug]);

  const calendarEnabled = Boolean(workspace?.is_google_calendar_enabled);
  const discordEnabled = Boolean(workspace?.is_discord_dm_enabled);
  const calendarConnected = Boolean(alertStore.externalAccounts.get("google_calendar")?.is_active);
  const discordConnected = Boolean(alertStore.externalAccounts.get("discord")?.is_active);

  const needsCalendar = calendarEnabled && !calendarConnected;
  const needsDiscord = discordEnabled && !discordConnected;
  const isOpen = loaded && (needsCalendar || needsDiscord);

  const handleConnectCalendar = async () => {
    setConnectingCalendar(true);
    try {
      const redirectUrl = await alertStore.startGoogleCalendarOAuth(workspaceSlug);
      if (redirectUrl) window.location.href = redirectUrl;
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("alert.accounts.gcal_error") });
    } finally {
      setConnectingCalendar(false);
    }
  };

  const handleConnectDiscord = async () => {
    setConnectingDiscord(true);
    try {
      const redirectUrl = await alertStore.startDiscordOAuth(workspaceSlug);
      if (redirectUrl) window.location.href = redirectUrl;
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("alert.accounts.discord_error") });
    } finally {
      setConnectingDiscord(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-18 font-semibold text-primary">{t("integrations_setup.title")}</h2>
          <p className="mt-1 text-14 text-secondary">{t("integrations_setup.subtitle")}</p>
        </div>

        <div className="flex flex-col gap-4">
          {needsCalendar && (
            <SetupCard
              icon={Calendar}
              title={t("alert.accounts.gcal")}
              hint={t("alert.accounts.gcal_hint")}
              connected={calendarConnected}
              connectedLabel={t("alert.accounts.connected")}
              tone="accent"
            >
              {calendarConnected ? null : (
                <Button
                  variant="primary"
                  size="sm"
                  className="self-start"
                  loading={connectingCalendar}
                  prependIcon={<Link2 className="size-3.5" />}
                  onClick={() => void handleConnectCalendar()}
                >
                  {t("alert.accounts.gcal_connect")}
                </Button>
              )}
            </SetupCard>
          )}

          {needsDiscord && (
            <SetupCard
              icon={MessageCircle}
              title={t("alert.accounts.discord")}
              hint={t("alert.accounts.discord_hint")}
              connected={discordConnected}
              connectedLabel={t("alert.accounts.connected")}
              tone="success"
            >
              {discordConnected ? null : (
                <Button
                  variant="primary"
                  size="sm"
                  className="self-start"
                  loading={connectingDiscord}
                  prependIcon={<Link2 className="size-3.5" />}
                  onClick={() => void handleConnectDiscord()}
                >
                  {t("alert.accounts.discord_connect")}
                </Button>
              )}
            </SetupCard>
          )}
        </div>

        <p className="mt-6 text-12 text-tertiary">{t("integrations_setup.required_note")}</p>
      </div>
    </ModalCore>
  );
});

function SetupCard({
  icon: Icon,
  title,
  hint,
  connected,
  connectedLabel,
  children,
  tone = "accent",
}: {
  icon: typeof Calendar;
  title: string;
  hint: string;
  connected: boolean;
  connectedLabel: string;
  children: React.ReactNode;
  tone?: "accent" | "success";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border border-subtle bg-layer-1 p-4 transition-colors",
        connected && "border-success-subtle/50 bg-success-subtle/10"
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg border border-subtle shadow-sm",
          tone === "accent" ? "bg-accent-subtle text-accent-primary" : "bg-success-subtle text-success-primary"
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-14 font-semibold text-primary">{title}</h3>
          {connected && (
            <span className="inline-flex items-center gap-1 rounded-full border border-success-subtle/50 bg-success-subtle/30 px-2 py-0.5 text-10 font-medium text-success-primary">
              <CheckCircle2 className="size-3" strokeWidth={1.75} />
              {connectedLabel}
            </span>
          )}
        </div>
        <p className="mt-1 text-12 text-secondary">{hint}</p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
