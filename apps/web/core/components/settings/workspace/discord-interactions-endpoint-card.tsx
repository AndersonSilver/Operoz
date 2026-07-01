import { Copy, Webhook } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { setToast, TOAST_TYPE } from "@operoz/propel/toast";
import { copyTextToClipboard } from "@operoz/utils";

const INTERACTIONS_PATH = "/api/discord/interactions/";

export function DiscordInteractionsEndpointCard() {
  const { t } = useTranslation();

  const endpointUrl = useMemo(() => {
    if (typeof window === "undefined") return INTERACTIONS_PATH;
    return `${window.location.origin}${INTERACTIONS_PATH}`;
  }, []);

  const handleCopy = () => {
    void copyTextToClipboard(endpointUrl).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.discord.setup_copied"),
      });
    });
  };

  return (
    <article className="overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div className="flex items-start gap-3 border-b border-subtle px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-subtle bg-surface-1 text-accent-primary">
          <Webhook className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="text-14 font-semibold text-primary">{t("workspace_settings.settings.discord.setup_title")}</h2>
          <p className="mt-1 text-12 leading-relaxed text-secondary">
            {t("workspace_settings.settings.discord.setup_description")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 rounded-lg border border-subtle bg-surface-1 px-3 py-2.5">
          <p className="text-10 font-semibold tracking-wide text-tertiary uppercase">
            {t("workspace_settings.settings.discord.setup_method")}
          </p>
          <code className="font-mono mt-1 block truncate text-12 text-primary">{endpointUrl}</code>
        </div>
        <Button variant="secondary" size="sm" className="shrink-0" onClick={handleCopy}>
          <Copy className="size-3.5" strokeWidth={1.75} />
          {t("workspace_settings.settings.discord.setup_copy")}
        </Button>
      </div>
    </article>
  );
}
