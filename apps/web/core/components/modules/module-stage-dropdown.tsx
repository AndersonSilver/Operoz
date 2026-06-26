import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import type { IBoardIssueType, IModule } from "@operis/types";
import { CustomSelect } from "@operis/ui";
import { cn } from "@operis/utils";

type Props = {
  isDisabled: boolean;
  moduleDetails: IModule;
  stages: IBoardIssueType[];
  handleModuleDetailsChange: (payload: Partial<IModule>) => Promise<void>;
};

type StageOption = IBoardIssueType | NonNullable<IModule["stage_detail"]>;

function stageOptionColor(option: StageOption | null): string | undefined {
  if (!option) return undefined;
  if ("color" in option && typeof option.color === "string" && option.color.startsWith("#")) {
    return option.color;
  }
  if ("logo_props" in option) {
    const color = option.logo_props?.icon?.color;
    if (typeof color === "string" && color.startsWith("#")) return color;
  }
  return undefined;
}

function stageOptionActive(option: StageOption, selectedId: string | null): boolean {
  if ("is_enabled" in option) {
    return (option.is_enabled && option.is_active) || option.id === selectedId;
  }
  return option.is_active || option.id === selectedId;
}

function stagePillStyle(color: string | undefined) {
  const resolved = color && color.startsWith("#") ? color : "var(--text-color-tertiary)";
  return {
    color: resolved,
    backgroundColor: color && color.startsWith("#") ? `${color}20` : "var(--background-color-layer-2)",
  };
}

const STAGE_PILL_CLASS =
  "box-border flex h-7 min-h-7 w-full min-w-0 items-center justify-center rounded-sm px-2.5 py-1 text-center text-11 font-medium leading-tight";

const STAGE_SELECT_CLASS = "w-full max-w-[9rem] shrink-0";
const STAGE_SELECT_BUTTON_CLASS = "h-7 w-full min-w-0 shrink-0 justify-center p-0 hover:bg-transparent";

export const ModuleStageDropdown = observer(function ModuleStageDropdown(props: Props) {
  const { isDisabled, moduleDetails, stages, handleModuleDetailsChange } = props;
  const { t } = useTranslation();

  const stageFromId = moduleDetails.stage_id ? stages.find((stage) => stage.id === moduleDetails.stage_id) : null;

  const currentStage: StageOption | null =
    moduleDetails.stage_detail?.id === moduleDetails.stage_id
      ? moduleDetails.stage_detail
      : (stageFromId ?? (moduleDetails.stage_id ? null : moduleDetails.stage_detail) ?? null);

  const selectableStages = stages.filter((stage) => stageOptionActive(stage, moduleDetails.stage_id));

  if (selectableStages.length === 0) {
    return (
      <span className={cn(STAGE_PILL_CLASS, "text-tertiary")} style={stagePillStyle(undefined)}>
        {t("project_modules.stage.no_stage")}
      </span>
    );
  }

  return (
    <CustomSelect
      className={STAGE_SELECT_CLASS}
      customButtonClassName={STAGE_SELECT_BUTTON_CLASS}
      customButton={
        <span
          className={cn(STAGE_PILL_CLASS, isDisabled ? "cursor-not-allowed" : "cursor-pointer")}
          style={stagePillStyle(stageOptionColor(currentStage))}
          title={currentStage?.name ?? t("project_modules.stage.select_stage")}
        >
          <span className="truncate">{currentStage?.name ?? t("project_modules.stage.select_stage")}</span>
        </span>
      }
      value={currentStage?.id ?? ""}
      onChange={(val: string) => {
        handleModuleDetailsChange({ stage_id: val || null });
      }}
      disabled={isDisabled}
    >
      <CustomSelect.Option value="">
        <span className="text-tertiary">{t("project_modules.stage.no_stage")}</span>
      </CustomSelect.Option>
      {selectableStages.map((stage) => (
        <CustomSelect.Option key={stage.id} value={stage.id}>
          <div className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{
                backgroundColor: stageOptionColor(stage) ?? "var(--text-color-tertiary)",
              }}
            />
            <span className="truncate">{stage.name}</span>
            {!stageOptionActive(stage, moduleDetails.stage_id) ? (
              <span className="text-10 text-tertiary">({t("project_modules.stage.legacy")})</span>
            ) : null}
          </div>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
