import { observer } from "mobx-react";
import { Calendar, CheckCircle2, Link2, MessageCircle, Unlink } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Button } from "@operoz/propel/button";
import { cn } from "@operoz/ui";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";
import "../alerts-settings.css";

function ExternalAccountCard({
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
  connectedLabel?: string;
  children: ReactNode;
  tone?: "accent" | "success";
}) {
  return (
    <article
      className={cn(
        "group relative flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150",
        "hover:border-strong hover:shadow-raised-100",
        connected && "alerts-settings-card-active"
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", connected ? "bg-success-primary" : "bg-subtle")}
        aria-hidden
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "shadow-sm grid size-11 shrink-0 place-items-center rounded-lg border border-subtle",
              tone === "accent" ? "bg-accent-subtle text-accent-primary" : "bg-success-subtle text-success-primary"
            )}
          >
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-14 font-semibold text-primary">{title}</h3>
              {connected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-success-subtle/50 bg-success-subtle/30 px-2 py-0.5 text-10 font-medium text-success-primary">
                  <CheckCircle2 className="size-3" strokeWidth={1.75} />
                  {connectedLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-12 leading-relaxed text-secondary">{hint}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col justify-end gap-3">{children}</div>
      </div>
    </article>
  );
}

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

  const isConnected = Boolean(account?.is_active);

  return (
    <ExternalAccountCard
      icon={Calendar}
      title={t("alert.accounts.gcal")}
      hint={t("alert.accounts.gcal_hint")}
      connected={isConnected}
      connectedLabel={t("alert.accounts.connected")}
      tone="accent"
    >
      {isConnected ? (
        <>
          <p className="font-mono truncate rounded-md border border-subtle bg-surface-1 px-3 py-2 text-11 text-secondary">
            {account?.external_id}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            prependIcon={<Unlink className="size-3.5" />}
            onClick={() => void alertStore.disconnectGoogleCalendar(workspaceSlug)}
          >
            {t("alert.accounts.disconnect")}
          </Button>
        </>
      ) : (
        <Button
          variant="primary"
          size="sm"
          className="self-start"
          loading={connecting}
          prependIcon={<Link2 className="size-3.5" />}
          onClick={() => void handleConnect()}
        >
          {t("alert.accounts.gcal_connect")}
        </Button>
      )}
    </ExternalAccountCard>
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

  const isConnected = Boolean(account?.is_active);

  return (
    <ExternalAccountCard
      icon={MessageCircle}
      title={t("alert.accounts.discord")}
      hint={t("alert.accounts.discord_hint")}
      connected={isConnected}
      connectedLabel={t("alert.accounts.connected")}
      tone="success"
    >
      {isConnected ? (
        <>
          <p className="font-mono truncate rounded-md border border-subtle bg-surface-1 px-3 py-2 text-11 text-secondary">
            {account?.external_id}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            prependIcon={<Unlink className="size-3.5" />}
            onClick={() => void alertStore.disconnectExternalAccount(workspaceSlug, "discord")}
          >
            {t("alert.accounts.disconnect")}
          </Button>
        </>
      ) : (
        <>
          <input
            className="focus:ring-accent-primary w-full rounded-md border border-subtle bg-surface-1 px-3 py-2 text-13 text-primary placeholder:text-tertiary focus:border-strong focus:ring-1 focus:outline-none"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            placeholder={t("alert.accounts.discord_id_placeholder")}
          />
          <Button
            variant="primary"
            size="sm"
            className="self-start"
            prependIcon={<Link2 className="size-3.5" />}
            onClick={() =>
              void alertStore.connectExternalAccount(workspaceSlug, {
                provider: "discord",
                external_id: discordId.trim(),
              })
            }
          >
            {t("alert.accounts.connect")}
          </Button>
        </>
      )}
    </ExternalAccountCard>
  );
});

export const ExternalAccountsList = observer(function ExternalAccountsList({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GoogleCalendarConnectPanel workspaceSlug={workspaceSlug} />
      <DiscordLinkPanel workspaceSlug={workspaceSlug} />
    </div>
  );
});
