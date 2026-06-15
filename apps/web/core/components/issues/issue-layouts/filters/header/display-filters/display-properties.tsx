import React from "react";
import { observer } from "mobx-react";
// plane constants
import { ISSUE_DISPLAY_PROPERTIES } from "@operis/constants";
// plane i18n
import { useTranslation } from "@operis/i18n";
// types
import type { IIssueDisplayProperties } from "@operis/types";
// components
import { isCustomFieldVisible, useBoardLayoutCustomFields } from "@/hooks/use-board-layout-custom-fields";
import { FilterHeader } from "../helpers/filter-header";

type Props = {
  displayProperties: IIssueDisplayProperties;
  displayPropertiesToRender: (keyof IIssueDisplayProperties)[];
  handleUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  cycleViewDisabled?: boolean;
  moduleViewDisabled?: boolean;
  isEpic?: boolean;
  workspaceSlug?: string;
  boardSlug?: string;
};

export const FilterDisplayProperties = observer(function FilterDisplayProperties(props: Props) {
  const {
    displayProperties,
    displayPropertiesToRender,
    handleUpdate,
    cycleViewDisabled = false,
    moduleViewDisabled = false,
    isEpic = false,
    workspaceSlug = "",
    boardSlug,
  } = props;
  // hooks
  const { t } = useTranslation();
  const { fields: boardCustomFields } = useBoardLayoutCustomFields({
    workspaceSlug,
    boardSlug,
    displayProperties,
  });
  // states
  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  // Filter out "cycle" and "module" keys if cycleViewDisabled or moduleViewDisabled is true
  // Also filter out display properties that should not be rendered
  const filteredDisplayProperties = ISSUE_DISPLAY_PROPERTIES.filter((property) => {
    if (!displayPropertiesToRender.includes(property.key)) return false;
    switch (property.key) {
      case "cycle":
        return !cycleViewDisabled;
      case "modules":
        return !moduleViewDisabled;
      default:
        return true;
    }
  }).map((property) => {
    if (isEpic && property.key === "sub_issue_count") {
      return { ...property, titleTranslationKey: "issue.display.properties.work_item_count" };
    }
    return property;
  });

  return (
    <>
      <FilterHeader
        title={t("issue.display.properties.label")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {filteredDisplayProperties.map((displayProperty) => (
            <>
              <button
                key={displayProperty.key}
                type="button"
                className={`rounded-sm border px-2 py-0.5 text-11 transition-all ${
                  displayProperties?.[displayProperty.key]
                    ? "border-accent-strong bg-accent-primary text-on-color"
                    : "border-subtle hover:bg-layer-1"
                }`}
                onClick={() =>
                  handleUpdate({
                    [displayProperty.key]: !displayProperties?.[displayProperty.key],
                  })
                }
              >
                {t(displayProperty.titleTranslationKey)}
              </button>
            </>
          ))}
          {boardCustomFields.map((field) => {
            const isVisible = isCustomFieldVisible(field.id, displayProperties);

            return (
              <button
                key={field.id}
                type="button"
                className={`rounded-sm border px-2 py-0.5 text-11 transition-all ${
                  isVisible ? "border-accent-strong bg-accent-primary text-on-color" : "border-subtle hover:bg-layer-1"
                }`}
                onClick={() =>
                  handleUpdate({
                    custom_fields: {
                      ...(displayProperties.custom_fields ?? {}),
                      [field.id]: !isVisible,
                    },
                  })
                }
              >
                {field.name}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
});
