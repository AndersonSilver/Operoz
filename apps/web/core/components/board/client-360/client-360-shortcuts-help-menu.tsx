import { CircleHelp } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { CustomMenu } from "@operis/ui";

const SHORTCUT_KEYS = ["search", "grid", "list", "table", "export"] as const;

type Props = {
  className?: string;
};

export function Client360ShortcutsHelpMenu({ className }: Props) {
  const { t } = useTranslation();
  const label = t("boards.client_360.shortcuts_label");

  return (
    <CustomMenu
      className={className}
      placement="bottom-end"
      customButton={
        <Tooltip tooltipContent={label}>
          <span className="inline-flex">
            <IconButton
              variant="secondary"
              size="xl"
              icon={CircleHelp}
              aria-label={label}
              className="shrink-0 rounded-sm"
            />
          </span>
        </Tooltip>
      }
    >
      <div className="border-b border-subtle px-3 py-2 text-11 font-medium tracking-wide text-tertiary uppercase">
        {label}
      </div>
      <div className="w-64 px-3 py-2">
        {SHORTCUT_KEYS.map((key) => (
          <div key={key} className="flex items-center justify-between gap-3 py-1.5 text-12">
            <span className="text-secondary">{t(`boards.client_360.shortcuts_${key}`)}</span>
            <kbd className="font-mono rounded-sm border border-subtle bg-layer-2 px-1.5 py-0.5 text-11 text-tertiary">
              {t(`boards.client_360.shortcuts_${key}_key`)}
            </kbd>
          </div>
        ))}
      </div>
    </CustomMenu>
  );
}
