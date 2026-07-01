import type { ChangeEvent } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { InfoIcon } from "@operoz/propel/icons";
// plane imports
import { ETabIndices } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
// ui
import { Tooltip } from "@operoz/propel/tooltip";
import { Input, TextArea } from "@operoz/ui";
import { cn, projectIdentifierSanitizer, getTabIndex } from "@operoz/utils";
// plane utils
// helpers
// plane-web types
import type { TProject } from "@/plane-web/types/projects";
import {
  ProjectFormFieldError,
  projectFormTextAreaErrorBgClass,
} from "@/components/project/project-form-validation-ui";

type Props = {
  setValue: UseFormSetValue<TProject>;
  isMobile: boolean;
  shouldAutoSyncIdentifier: boolean;
  setShouldAutoSyncIdentifier: (value: boolean) => void;
  handleFormOnChange?: () => void;
  /** Com layout do board, a descrição vem do schema — evita duplicar no create. */
  hideDescription?: boolean;
  /** Rótulos com * nos campos fixos (nome/ID), alinhado ao schema do board. */
  showRequiredLabels?: boolean;
};

function ProjectCommonAttributes(props: Props) {
  const {
    setValue,
    isMobile,
    shouldAutoSyncIdentifier,
    setShouldAutoSyncIdentifier,
    handleFormOnChange,
    hideDescription = false,
    showRequiredLabels = false,
  } = props;
  const {
    formState: { errors },
    control,
  } = useFormContext<TProject>();

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);
  const { t } = useTranslation();

  const handleNameChange =
    (onChange: (event: ChangeEvent<HTMLInputElement>) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      if (!shouldAutoSyncIdentifier) {
        onChange(e);
        return;
      }
      if (e.target.value === "") setValue("identifier", "");
      else setValue("identifier", projectIdentifierSanitizer(e.target.value).substring(0, 10));
      onChange(e);
      handleFormOnChange?.();
    };

  const handleIdentifierChange = (onChange: (value: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const alphanumericValue = projectIdentifierSanitizer(value);
    setShouldAutoSyncIdentifier(false);
    onChange(alphanumericValue);
    handleFormOnChange?.();
  };
  const fieldLabelClass = "mb-1 block min-h-[18px] text-12 font-medium leading-[18px] text-secondary";

  return (
    <div className="grid grid-cols-1 gap-x-2 gap-y-3 md:grid-cols-4 md:items-start">
      <div className="flex flex-col md:col-span-3">
        {showRequiredLabels && (
          <label className={fieldLabelClass} htmlFor="name">
            {t("project_name")}
            <span className="font-normal ml-0.5 text-danger-primary">*</span>
          </label>
        )}
        <Controller
          control={control}
          name="name"
          rules={{
            required: t("field_is_required"),
            maxLength: {
              value: 255,
              message: t("title_should_be_less_than_255_characters"),
            },
          }}
          render={({ field: { value, onChange } }) => (
            <Input
              id="name"
              name="name"
              type="text"
              inputSize="sm"
              value={value}
              onChange={handleNameChange(onChange)}
              hasError={Boolean(errors.name)}
              placeholder={showRequiredLabels ? undefined : t("project_name")}
              className="w-full"
              tabIndex={getIndex("name")}
            />
          )}
        />
        <ProjectFormFieldError message={errors?.name?.message} />
      </div>
      <div className="flex flex-col">
        {showRequiredLabels && (
          <label className={fieldLabelClass} htmlFor="identifier">
            {t("project_id")}
            <span className="font-normal ml-0.5 text-danger-primary">*</span>
          </label>
        )}
        <div className="relative">
          <Controller
            control={control}
            name="identifier"
            rules={{
              required: t("field_is_required"),
              validate: (value) =>
                /^[ÇŞĞIİÖÜA-Z0-9]+$/.test(value.toUpperCase()) || t("only_alphanumeric_non_latin_characters_allowed"),
              minLength: {
                value: 1,
                message: t("project_id_min_char"),
              },
              maxLength: {
                value: 10,
                message: t("project_id_max_char"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="identifier"
                name="identifier"
                type="text"
                inputSize="sm"
                value={value}
                onChange={handleIdentifierChange(onChange)}
                hasError={Boolean(errors.identifier)}
                placeholder={showRequiredLabels ? undefined : t("project_id")}
                className={cn("w-full pr-7", {
                  uppercase: value,
                })}
                tabIndex={getIndex("identifier")}
              />
            )}
          />
          <Tooltip
            isMobile={isMobile}
            tooltipContent={t("project_id_tooltip_content")}
            className="text-13"
            position="right-start"
          >
            <InfoIcon className="absolute top-2.5 right-2 h-3 w-3 text-placeholder" />
          </Tooltip>
        </div>
        <ProjectFormFieldError message={errors?.identifier?.message} />
      </div>
      <div className="flex flex-col md:col-span-4">
        <label className={fieldLabelClass} htmlFor="responsible_stakeholder">
          {t("project.responsible_stakeholder")}
        </label>
        <Controller
          control={control}
          name="responsible_stakeholder"
          render={({ field: { value, onChange } }) => (
            <Input
              id="responsible_stakeholder"
              name="responsible_stakeholder"
              type="text"
              inputSize="sm"
              value={value ?? ""}
              onChange={(e) => {
                onChange(e);
                handleFormOnChange?.();
              }}
              placeholder={t("project.responsible_stakeholder_placeholder")}
              className="w-full"
              tabIndex={getIndex("responsible_stakeholder")}
            />
          )}
        />
      </div>
      {!hideDescription && (
        <div className="md:col-span-4">
          <Controller
            name="description"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TextArea
                id="description"
                name="description"
                value={value}
                placeholder={t("description")}
                onChange={(e) => {
                  onChange(e);
                  handleFormOnChange?.();
                }}
                className={cn("!h-24 w-full text-13", errors?.description && projectFormTextAreaErrorBgClass)}
                hasError={Boolean(errors?.description)}
                tabIndex={getIndex("description")}
              />
            )}
          />
          <ProjectFormFieldError message={errors?.description?.message} />
        </div>
      )}
    </div>
  );
}

export default ProjectCommonAttributes;
