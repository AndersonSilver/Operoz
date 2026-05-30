import { observer } from "mobx-react";
// icons
// types
import { PROJECT_DISPLAY_FILTER_OPTIONS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { CloseIcon } from "@operis/propel/icons";
import type { TProjectAppliedDisplayFilterKeys } from "@operis/types";
// constants

type Props = {
  handleRemove: (key: TProjectAppliedDisplayFilterKeys) => void;
  values: TProjectAppliedDisplayFilterKeys[];
  editable: boolean | undefined;
};

export const AppliedProjectDisplayFilters = observer(function AppliedProjectDisplayFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  const { t } = useTranslation();

  return (
    <>
      {values.map((key) => {
        const filterLabel = PROJECT_DISPLAY_FILTER_OPTIONS.find((s) => s.key === key)?.i18n_label;
        return (
          <div key={key} className="flex items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 text-11">
            {filterLabel && t(filterLabel)}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(key)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
