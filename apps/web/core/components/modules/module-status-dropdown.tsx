import React from "react";
import { observer } from "mobx-react";
import { MODULE_STATUS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import type { TModuleStatus } from "@operoz/propel/icons";
import { ModuleStatusIcon } from "@operoz/propel/icons";
import type { IModule } from "@operoz/types";
import { CustomSelect } from "@operoz/ui";
import { cn } from "@operoz/utils";

type Props = {
  isDisabled: boolean;
  moduleDetails: IModule;
  handleModuleDetailsChange: (payload: Partial<IModule>) => Promise<void>;
};

export const ModuleStatusDropdown = observer(function ModuleStatusDropdown(props: Props) {
  const { isDisabled, moduleDetails, handleModuleDetailsChange } = props;
  const { t } = useTranslation();
  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  if (!moduleStatus) return <></>;

  return (
    <CustomSelect
      customButton={
        <span
          className={cn(
            "box-border flex h-7 min-h-7 w-full max-w-[9rem] items-center justify-center rounded-sm px-2.5 py-1 text-center text-11 leading-tight font-medium",
            isDisabled ? "cursor-not-allowed" : "cursor-pointer"
          )}
          style={{
            color: moduleStatus ? moduleStatus.color : "#a3a3a2",
            backgroundColor: moduleStatus ? `${moduleStatus.color}20` : "#a3a3a220",
          }}
        >
          <span className="truncate">
            {(moduleStatus && t(moduleStatus?.i18n_label)) ?? t("project_modules.status.backlog")}
          </span>
        </span>
      }
      className="w-full max-w-[9rem] shrink-0"
      customButtonClassName="h-7 w-full min-w-0 shrink-0 justify-center p-0 hover:bg-transparent"
      value={moduleStatus?.value}
      onChange={(val: TModuleStatus) => {
        handleModuleDetailsChange({ status: val });
      }}
      disabled={isDisabled}
    >
      {MODULE_STATUS.map((status) => (
        <CustomSelect.Option key={status.value} value={status.value}>
          <div className="flex items-center gap-2">
            <ModuleStatusIcon status={status.value} />
            {t(status.i18n_label)}
          </div>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
