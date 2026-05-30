import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { CustomSelect } from "@operis/ui";
import { useBoard } from "@/hooks/store/use-board";

type Props = {
  name?: string;
  tabIndex?: number;
  required?: boolean;
};

export const BoardSelectField = observer(function BoardSelectField(props: Props) {
  const { name = "board_id", tabIndex, required = true } = props;
  const { t } = useTranslation();
  const { currentWorkspaceBoardIds, getBoardById } = useBoard();
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const boards = currentWorkspaceBoardIds.map((id) => getBoardById(id)).filter((b) => b !== undefined);

  return (
    <Controller
      name={name}
      control={control}
      rules={
        required
          ? {
              required: t("boards.board_required"),
            }
          : undefined
      }
      render={({ field: { value, onChange } }) => {
        const selected = boards.find((b) => b.id === value);

        return (
          <div className="space-y-1">
            <p className="text-11 font-medium text-secondary">{t("boards.select_board")}</p>
            <div className="h-8" tabIndex={tabIndex}>
              <CustomSelect
                value={value ?? ""}
                onChange={onChange}
                label={
                  <div className="flex h-full items-center gap-1.5">
                    {selected ? (
                      <>
                        <span className="grid size-4 shrink-0 place-items-center">
                          <Logo logo={selected.logo_props} size={16} />
                        </span>
                        <span className="truncate">{selected.name}</span>
                      </>
                    ) : (
                      <span className="text-placeholder">{t("boards.select_board_placeholder")}</span>
                    )}
                  </div>
                }
                placement="bottom-start"
                className="h-full w-full max-w-md"
                buttonClassName="h-full w-full justify-start"
                input
                tabIndex={tabIndex}
              >
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
            </div>
            {errors[name] && (
              <p className="text-11 text-danger-primary">{String(errors[name]?.message ?? "")}</p>
            )}
          </div>
        );
      }}
    />
  );
});
