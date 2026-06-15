import { Check, ChevronsDownUp, ChevronsUpDown, Group, List } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { CustomMenu } from "@operis/ui";
import { cn } from "@operis/utils";

type Props = {
  groupByBoard: boolean;
  onGroupByBoardChange: (enabled: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  className?: string;
};

export function Client360BoardGroupToggle({
  groupByBoard,
  onGroupByBoardChange,
  onExpandAll,
  onCollapseAll,
  className,
}: Props) {
  const { t } = useTranslation();
  const label = t("boards.client_360.group_toggle_label");

  return (
    <CustomMenu
      className={className}
      placement="bottom-end"
      closeOnSelect
      customButton={
        <Tooltip tooltipContent={label}>
          <span className="inline-flex">
            <IconButton
              variant="secondary"
              size="xl"
              icon={groupByBoard ? Group : List}
              aria-label={label}
              className={cn("shrink-0 rounded-sm", groupByBoard && "text-accent-primary")}
            />
          </span>
        </Tooltip>
      }
    >
      <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => onGroupByBoardChange(false)}>
        <List className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
        <span className={cn("min-w-0 flex-1 truncate", !groupByBoard && "font-medium text-primary")}>
          {t("boards.client_360.group_flat")}
        </span>
        {!groupByBoard ? <Check className="size-3.5 shrink-0 text-accent-primary" strokeWidth={2.5} /> : null}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => onGroupByBoardChange(true)}>
        <Group className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
        <span className={cn("min-w-0 flex-1 truncate", groupByBoard && "font-medium text-primary")}>
          {t("boards.client_360.group_by_board")}
        </span>
        {groupByBoard ? <Check className="size-3.5 shrink-0 text-accent-primary" strokeWidth={2.5} /> : null}
      </CustomMenu.MenuItem>
      {groupByBoard ? (
        <>
          <CustomMenu.MenuItem className="flex items-center gap-2" onClick={onExpandAll}>
            <ChevronsUpDown className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 truncate">{t("boards.client_360.group_expand_all")}</span>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem className="flex items-center gap-2" onClick={onCollapseAll}>
            <ChevronsDownUp className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 truncate">{t("boards.client_360.group_collapse_all")}</span>
          </CustomMenu.MenuItem>
        </>
      ) : null}
    </CustomMenu>
  );
}
