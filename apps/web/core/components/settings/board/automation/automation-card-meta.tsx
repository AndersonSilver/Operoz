import { useTranslation } from "@operoz/i18n";
import { formatAutomationCardTimestamp, shouldShowAutomationUpdatedMeta } from "./automation-meta-utils";

type Props = {
  createdAt?: string;
  updatedAt?: string;
  createdById?: string | null;
  updatedById?: string | null;
  resolveUser: (userId: string | null | undefined) => string | null;
};

function buildLine(
  t: ReturnType<typeof useTranslation>["t"],
  kind: "created" | "updated",
  userId: string | null | undefined,
  at: string | undefined,
  resolveUser: Props["resolveUser"]
): string | null {
  const when = formatAutomationCardTimestamp(at);
  if (!when) return null;

  const who = resolveUser(userId);
  const unknown = t("boards.settings.automation.card_meta.unknown_user");

  if (kind === "created") {
    return who
      ? t("boards.settings.automation.card_meta.created_by_at", { name: who, date: when })
      : t("boards.settings.automation.card_meta.created_at", { date: when });
  }

  return who
    ? t("boards.settings.automation.card_meta.updated_by_at", { name: who || unknown, date: when })
    : t("boards.settings.automation.card_meta.updated_at", { date: when });
}

export function AutomationCardMeta(props: Props) {
  const { createdAt, updatedAt, createdById, updatedById, resolveUser } = props;
  const { t } = useTranslation();

  const createdLine = buildLine(t, "created", createdById, createdAt, resolveUser);
  const showUpdated = shouldShowAutomationUpdatedMeta(createdAt, updatedAt, createdById, updatedById);
  const updatedLine = showUpdated ? buildLine(t, "updated", updatedById, updatedAt, resolveUser) : null;

  if (!createdLine && !updatedLine) return null;

  return (
    <div className="space-y-0.5 border-t border-subtle/70 pt-3 text-11 leading-relaxed text-placeholder">
      {createdLine && <p>{createdLine}</p>}
      {updatedLine && <p>{updatedLine}</p>}
    </div>
  );
}
