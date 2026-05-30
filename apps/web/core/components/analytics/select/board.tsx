import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { getButtonStyling } from "@operis/propel/button";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@operis/propel/icons";
import { CustomSelect } from "@operis/ui";
import { cn } from "@operis/utils";
import { useBoard } from "@/hooks/store/use-board";

type Props = {
  value: string | null;
  onChange: (boardId: string | null) => void;
};

export const AnalyticsBoardSelect = observer(function AnalyticsBoardSelect(props: Props) {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const { currentWorkspaceBoardIds, getBoardById } = useBoard();

  const boards = currentWorkspaceBoardIds.map((id) => getBoardById(id)).filter((board) => board !== undefined);

  const selected = value ? getBoardById(value) : undefined;

  return (
    <CustomSelect
      value={value ?? ""}
      onChange={(val: string) => onChange(val || null)}
      label={
        <div className={cn(getButtonStyling("secondary", "lg"), "flex items-center gap-2")}>
          {selected ? (
            <>
              <span className="grid size-4 shrink-0 place-items-center">
                <Logo logo={selected.logo_props} size={16} />
              </span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span>{t("boards.analytics_all_boards")}</span>
          )}
          <ChevronDownIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
        </div>
      }
      buttonClassName={cn(getButtonStyling("secondary", "lg"), "gap-2")}
      className="w-auto"
      input
    >
      <CustomSelect.Option value="">{t("boards.analytics_all_boards")}</CustomSelect.Option>
      {boards.map((board) => (
        <CustomSelect.Option key={board.id} value={board.id}>
          <div className="flex items-center gap-2">
            <span className="grid size-4 shrink-0 place-items-center">
              <Logo logo={board.logo_props} size={16} />
            </span>
            <span>{board.name}</span>
          </div>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
