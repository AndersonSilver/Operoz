import type { MouseEvent } from "react";
import { observer } from "mobx-react";
// ui
import { Checkbox } from "@operoz/ui";
// helpers
import { cn } from "@operoz/utils";
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  disabled?: boolean;
  groupId: string;
  id: string;
  selectionHelpers: TSelectionHelper;
};

export const MultipleSelectEntityAction = observer(function MultipleSelectEntityAction(props: Props) {
  const { className, disabled = false, groupId, id, selectionHelpers } = props;
  // derived values
  const isSelected = selectionHelpers.getIsEntitySelected(id);

  if (selectionHelpers.isSelectionDisabled) return null;

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
        "relative z-30 flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0",
        disabled && "cursor-not-allowed",
        className
      )}
      aria-label="Selecionar item"
      aria-pressed={isSelected}
      disabled={disabled}
      data-entity-group-id={groupId}
      data-entity-id={id}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={handleToggle}
    >
      <Checkbox
        className="size-3.5 !outline-none"
        iconClassName="size-3"
        checked={isSelected}
        disabled={disabled}
        readOnly
        tabIndex={-1}
        aria-hidden
      />
    </button>
  );
});
