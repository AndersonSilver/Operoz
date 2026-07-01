import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "@operoz/i18n";
import type { IModule, TModuleGanttBarColorMode } from "@operoz/types";
import { InputColorPicker } from "@operoz/ui";
import { cn } from "@operoz/utils";
import {
  DEFAULT_MODULE_GANTT_BAR_COLOR_MODE,
  DEFAULT_MODULE_GANTT_BAR_CUSTOM_COLOR,
} from "@/components/gantt-chart/helpers/gantt-bar-color";

type Props = {
  control: Control<IModule>;
  tabIndex?: number;
};

const COLOR_MODES: TModuleGanttBarColorMode[] = ["state", "custom"];

export function ModuleGanttBarColorFields(props: Props) {
  const { control, tabIndex } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-2 rounded-md border border-subtle bg-layer-1 p-3">
      <div>
        <p className="text-12 font-medium text-primary">{t("project_module.gantt_bar_color.title")}</p>
        <p className="text-11 text-secondary">{t("project_module.gantt_bar_color.description")}</p>
      </div>

      <Controller
        control={control}
        name="gantt_bar_color_mode"
        defaultValue={DEFAULT_MODULE_GANTT_BAR_COLOR_MODE}
        render={({ field: { value, onChange } }) => (
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_MODES.map((mode) => (
              <label
                key={mode}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-12 transition-colors",
                  value === mode
                    ? "border-accent-strong bg-accent-subtle text-primary"
                    : "border-subtle bg-layer-2 text-secondary hover:bg-layer-2-hover"
                )}
              >
                <input
                  type="radio"
                  name="gantt_bar_color_mode"
                  value={mode}
                  checked={(value ?? DEFAULT_MODULE_GANTT_BAR_COLOR_MODE) === mode}
                  onChange={() => onChange(mode)}
                  className="cursor-pointer"
                  tabIndex={tabIndex}
                />
                {t(`project_module.gantt_bar_color.mode_${mode}`)}
              </label>
            ))}
          </div>
        )}
      />

      <Controller
        control={control}
        name="gantt_bar_color_mode"
        render={({ field: { value: mode } }) =>
          mode === "custom" ? (
            <Controller
              control={control}
              name="gantt_bar_custom_color"
              defaultValue={DEFAULT_MODULE_GANTT_BAR_CUSTOM_COLOR}
              render={({ field: { value, onChange } }) => (
                <div className="space-y-1">
                  <p className="text-11 font-medium text-secondary">
                    {t("project_module.gantt_bar_color.custom_color_label")}
                  </p>
                  <InputColorPicker
                    name="module-gantt-bar-color"
                    value={value || DEFAULT_MODULE_GANTT_BAR_CUSTOM_COLOR}
                    onChange={(val) =>
                      onChange(val?.startsWith("#") ? val : `#${val ?? DEFAULT_MODULE_GANTT_BAR_CUSTOM_COLOR}`)
                    }
                    placeholder={DEFAULT_MODULE_GANTT_BAR_CUSTOM_COLOR}
                    hasError={false}
                    className="w-full"
                  />
                </div>
              )}
            />
          ) : (
            <></>
          )
        }
      />
    </div>
  );
}
