import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Button } from "@operis/propel/button";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";

export const GoogleCalendarConnectPanel = observer(function GoogleCalendarConnectPanel({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const account = alertStore.externalAccounts.get("google_calendar");

  useEffect(() => {
    void alertStore.fetchExternalAccounts(workspaceSlug);
  }, [alertStore, workspaceSlug]);

  useEffect(() => {
    const gcal = searchParams.get("gcal");
    if (gcal === "connected") {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("alert.accounts.gcal_connected"),
      });
      void alertStore.fetchExternalAccounts(workspaceSlug);
      searchParams.delete("gcal");
      setSearchParams(searchParams, { replace: true });
    }
    if (gcal === "error") {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("alert.accounts.gcal_error"),
      });
      searchParams.delete("gcal");
      setSearchParams(searchParams, { replace: true });
    }
  }, [alertStore, searchParams, setSearchParams, t, workspaceSlug]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const redirectUrl = await alertStore.startGoogleCalendarOAuth(workspaceSlug);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("alert.accounts.gcal_error"),
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="rounded-md border border-subtle bg-layer-1 p-4">
      <h3 className="text-13 font-medium text-primary">{t("alert.accounts.gcal")}</h3>
      {account?.is_active ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-13 text-secondary">
            {t("alert.accounts.connected")}: {account.external_id}
          </p>
          <Button variant="secondary" size="sm" onClick={() => void alertStore.disconnectGoogleCalendar(workspaceSlug)}>
            {t("alert.accounts.disconnect")}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-11 text-tertiary">{t("alert.accounts.gcal_hint")}</p>
          <Button
            variant="primary"
            size="sm"
            className="self-start"
            loading={connecting}
            onClick={() => void handleConnect()}
          >
            {t("alert.accounts.gcal_connect")}
          </Button>
        </div>
      )}
    </div>
  );
});

export const DiscordLinkPanel = observer(function DiscordLinkPanel({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const [discordId, setDiscordId] = useState("");
  const account = alertStore.externalAccounts.get("discord");

  useEffect(() => {
    void alertStore.fetchExternalAccounts(workspaceSlug);
  }, [alertStore, workspaceSlug]);

  return (
    <div className="rounded-md border border-subtle bg-layer-1 p-4">
      <h3 className="text-13 font-medium text-primary">{t("alert.accounts.discord")}</h3>
      {account?.is_active ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-13 text-secondary">
            {t("alert.accounts.connected")}: {account.external_id}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void alertStore.disconnectExternalAccount(workspaceSlug, "discord")}
          >
            {t("alert.accounts.disconnect")}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-11 text-tertiary">{t("alert.accounts.discord_hint")}</p>
          <input
            className="w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary placeholder:text-tertiary"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            placeholder={t("alert.accounts.discord_id_placeholder")}
          />
          <Button
            variant="primary"
            size="sm"
            className="self-start"
            onClick={() =>
              void alertStore.connectExternalAccount(workspaceSlug, {
                provider: "discord",
                external_id: discordId.trim(),
              })
            }
          >
            {t("alert.accounts.connect")}
          </Button>
        </div>
      )}
    </div>
  );
});

export const ExternalAccountsList = observer(function ExternalAccountsList({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <GoogleCalendarConnectPanel workspaceSlug={workspaceSlug} />
      <DiscordLinkPanel workspaceSlug={workspaceSlug} />
    </div>
  );
});
