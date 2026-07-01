import type { MouseEvent } from "react";
import { observer } from "mobx-react";
import { Checkbox } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { LIST_BULK_SELECT_CHECKBOX_CELL_CLASS } from "@/components/issues/issue-layouts/list/list-grid-columns-context";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  disabled?: boolean;
  disabledTitle?: string;
  groupId: string;
  id: string;
  selectionHelpers: TSelectionHelper;
};

export const BulkSelectCheckboxCell = observer(function BulkSelectCheckboxCell(props: Props) {
  const { className, disabled = false, disabledTitle, groupId, id, selectionHelpers } = props;

  if (selectionHelpers.isSelectionDisabled) {
    return <div className={cn(LIST_BULK_SELECT_CHECKBOX_CELL_CLASS, className)} aria-hidden />;
  }

  const isSelected = selectionHelpers.getIsEntitySelected(id);

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    if (disabled) return;
    selectionHelpers.handleEntityClick(event, id, groupId);
  };

  return (
    <button
      type="button"
      className={cn(
        LIST_BULK_SELECT_CHECKBOX_CELL_CLASS,
        "relative z-30 min-h-11 cursor-pointer border-0 bg-transparent p-0",
        disabled && "cursor-not-allowed",
        className
      )}
      title={disabled ? disabledTitle : undefined}
      aria-label="Selecionar item"
      aria-pressed={isSelected}
      disabled={disabled}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={handleToggle}
    >
      <Checkbox
        checked={isSelected}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none size-3.5 !outline-none"
        iconClassName="size-3"
      />
    </button>
  );
});
