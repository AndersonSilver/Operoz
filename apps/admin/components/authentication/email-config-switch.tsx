import React from "react";
import { observer } from "mobx-react";
// hooks
import type { TInstanceAuthenticationMethodKeys } from "@operoz/types";
import { ToggleSwitch } from "@operoz/ui";
import { useInstance } from "@/hooks/store";
// ui
// types

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const EmailCodesConfiguration = observer(function EmailCodesConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableMagicLogin = formattedConfig?.ENABLE_MAGIC_LINK_LOGIN ?? "";

  return (
    <ToggleSwitch
      value={Boolean(parseInt(enableMagicLogin))}
      onChange={() => {
        const newEnableMagicLogin = Boolean(parseInt(enableMagicLogin)) === true ? "0" : "1";
        updateConfig("ENABLE_MAGIC_LINK_LOGIN", newEnableMagicLogin);
      }}
      size="sm"
      disabled={disabled}
    />
  );
});
