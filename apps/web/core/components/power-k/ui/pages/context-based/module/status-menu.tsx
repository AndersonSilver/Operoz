import { Command } from "cmdk";
import { observer } from "mobx-react";
// plane imports
import { MODULE_STATUS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { ModuleStatusIcon } from "@operoz/propel/icons";
import type { TModuleStatus } from "@operoz/types";
// local imports
import { PowerKModalCommandItem } from "../../../modal/command-item";

type Props = {
  handleSelect: (data: TModuleStatus) => void;
  value: TModuleStatus;
};

export const PowerKModuleStatusMenu = observer(function PowerKModuleStatusMenu(props: Props) {
  const { handleSelect, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <Command.Group>
      {MODULE_STATUS.map((status) => (
        <PowerKModalCommandItem
          key={status.value}
          iconNode={<ModuleStatusIcon status={status.value} className="size-3.5 shrink-0" />}
          label={t(status.i18n_label)}
          isSelected={status.value === value}
          onSelect={() => handleSelect(status.value)}
        />
      ))}
    </Command.Group>
  );
});
