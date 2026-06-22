import type { EInboxIssueSource } from "@operis/types";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import { getInboxSourceLabelKey, type TInboxSourcePill } from "@/utils/support-ticket";

export type { TInboxSourcePill };

export function InboxSourcePill(props: TInboxSourcePill) {
  const { source, formName } = props;
  const { t } = useTranslation();

  if (!source) return null;

  const label = formName ? `${t(getInboxSourceLabelKey(source))} · ${formName}` : t(getInboxSourceLabelKey(source));

  return (
    <span
      className={cn(
        "max-w-[180px] truncate rounded-full border border-subtle bg-layer-2 px-2 py-0.5 text-10 font-medium text-secondary"
      )}
      title={label}
    >
      {label}
    </span>
  );
}
