import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Bot, ChevronDown, KeyRound, Sparkles } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceAIConfigurationKeys } from "@operis/types";
import { CustomSelect, Input } from "@operis/ui";
import {
  AdminConfigCallout,
  AdminConfigSection,
  AdminFieldLabel,
  AdminFormFooter,
  AdminMetricField,
  AdminOpsMetric,
  AdminOpsStrip,
  AdminSettingsPanel,
  AdminToggleCard,
} from "@/components/settings/admin-settings-panel";
import { ControllerInput } from "@/components/common/controller-input";
import { CUSTOM_MODEL_VALUE, getLlmProvider, LLM_PROVIDERS, type TLlmProviderKey } from "@/constants/llm-providers";
import { useInstance } from "@/hooks/store";

type IInstanceAIForm = {
  config: IFormattedInstanceConfiguration;
};

type AIFormValues = Record<TInstanceAIConfigurationKeys, string>;

const SELECT_BUTTON =
  "!w-full !justify-between !rounded-xl !border !border-subtle !bg-layer-2/50 !px-3 !py-2.5 hover:!bg-layer-1-hover/50";

export const InstanceAIForm = observer(function InstanceAIForm(props: IInstanceAIForm) {
  const { config } = props;
  const { t } = useTranslation();
  const { updateInstanceConfigurations } = useInstance();

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AIFormValues>({
    defaultValues: {
      LLM_API_KEY: config["LLM_API_KEY"],
      LLM_MODEL: config["LLM_MODEL"] || "gpt-4o-mini",
      LLM_PROVIDER: config["LLM_PROVIDER"] || "openai",
      LLM_BASE_URL: config["LLM_BASE_URL"] ?? "",
      ASSISTANT_ENABLED: config["ASSISTANT_ENABLED"] ?? "1",
      ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR: config["ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR"] ?? "60",
      ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR: config["ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR"] ?? "500",
      ASSISTANT_MAX_TOOL_ROUNDS: config["ASSISTANT_MAX_TOOL_ROUNDS"] ?? "5",
      VITE_ENABLE_OPEROZ_ASSISTANT: config["VITE_ENABLE_OPEROZ_ASSISTANT"] ?? "1",
    },
  });

  const providerKey = useWatch({ control, name: "LLM_PROVIDER" }) as TLlmProviderKey;
  const modelValue = useWatch({ control, name: "LLM_MODEL" });
  const apiKeyValue = useWatch({ control, name: "LLM_API_KEY" });
  const assistantBackend = useWatch({ control, name: "ASSISTANT_ENABLED" });
  const assistantFrontend = useWatch({ control, name: "VITE_ENABLE_OPEROZ_ASSISTANT" });

  const provider = useMemo(() => getLlmProvider(providerKey), [providerKey]);

  const [useCustomModel, setUseCustomModel] = useState(() => {
    const initialProvider = getLlmProvider(config["LLM_PROVIDER"] || "openai");
    if (!initialProvider.models.length) return true;
    const model = config["LLM_MODEL"];
    return Boolean(model && !initialProvider.models.includes(model));
  });

  const modelSelectValue = useCustomModel || !provider.models.length ? CUSTOM_MODEL_VALUE : modelValue;
  const backendEnabled = Boolean(parseInt(assistantBackend || "0", 10));
  const frontendEnabled = Boolean(parseInt(assistantFrontend || "0", 10));
  const hasApiKey = Boolean(String(apiKeyValue ?? "").trim());

  const readiness = useMemo(() => {
    if (backendEnabled && frontendEnabled && hasApiKey) {
      return { label: t("god_mode.ai.readiness_ready"), tone: "success" as const };
    }
    if (backendEnabled || frontendEnabled) {
      return { label: t("god_mode.ai.readiness_partial"), tone: "warning" as const };
    }
    return { label: t("god_mode.ai.readiness_off"), tone: "neutral" as const };
  }, [backendEnabled, frontendEnabled, hasApiKey, t]);

  const onSubmit = async (formData: AIFormValues) => {
    await updateInstanceConfigurations({ ...formData })
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("god_mode.ai.saved_title"),
          message: t("god_mode.ai.saved_message"),
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <form className="space-y-5 pb-2" onSubmit={handleSubmit(onSubmit)}>
      <AdminOpsStrip status={readiness}>
        <AdminOpsMetric
          label={t("god_mode.ai.backend")}
          value={backendEnabled ? t("god_mode.common.active") : t("god_mode.common.inactive")}
          hint={t("god_mode.ai.backend_hint")}
          tone={backendEnabled ? "success" : "neutral"}
        />
        <AdminOpsMetric
          label={t("god_mode.ai.frontend")}
          value={frontendEnabled ? t("god_mode.common.active") : t("god_mode.common.inactive")}
          hint={t("god_mode.ai.frontend_hint")}
          tone={frontendEnabled ? "success" : "neutral"}
        />
        <AdminOpsMetric label={t("god_mode.ai.provider")} value={provider.name} hint={provider.key} tone="accent" />
        <AdminOpsMetric
          label={t("god_mode.ai.model")}
          value={modelValue || "—"}
          hint={t("god_mode.ai.model_hint")}
          tone="accent"
        />
      </AdminOpsStrip>

      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <AdminSettingsPanel
          chip={t("god_mode.ai.operational_chip")}
          title={t("god_mode.ai.operational_title")}
          description={t("god_mode.ai.operational_description")}
          icon={Sparkles}
          iconClassName="text-accent-primary"
          fillHeight
        >
          <div className="flex h-full flex-col gap-6">
            <AdminConfigSection title={t("god_mode.ai.availability")}>
              <div className="grid grid-cols-1 gap-3">
                <Controller
                  control={control}
                  name="ASSISTANT_ENABLED"
                  render={({ field: { value, onChange } }) => (
                    <AdminToggleCard
                      label={t("god_mode.ai.backend_toggle")}
                      description={t("god_mode.ai.backend_toggle_desc")}
                      value={Boolean(parseInt(value || "0", 10))}
                      onChange={(next) => onChange(next ? "1" : "0")}
                      disabled={isSubmitting}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="VITE_ENABLE_OPEROZ_ASSISTANT"
                  render={({ field: { value, onChange } }) => (
                    <AdminToggleCard
                      label={t("god_mode.ai.frontend_toggle")}
                      description={t("god_mode.ai.frontend_toggle_desc")}
                      value={Boolean(parseInt(value || "0", 10))}
                      onChange={(next) => onChange(next ? "1" : "0")}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>
            </AdminConfigSection>

            <div className="border-t border-subtle pt-6">
              <AdminConfigSection title={t("god_mode.ai.rate_limits")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <AdminMetricField
                    control={control}
                    name="ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR"
                    label={t("god_mode.ai.per_user")}
                    description={t("god_mode.ai.per_user_desc")}
                    placeholder="60"
                    maxReference={200}
                    tone="accent"
                    error={Boolean(errors.ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR)}
                    disabled={isSubmitting}
                  />
                  <AdminMetricField
                    control={control}
                    name="ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR"
                    label={t("god_mode.ai.per_workspace")}
                    description={t("god_mode.ai.per_workspace_desc")}
                    placeholder="500"
                    maxReference={2000}
                    tone="warning"
                    error={Boolean(errors.ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR)}
                    disabled={isSubmitting}
                  />
                  <AdminMetricField
                    control={control}
                    name="ASSISTANT_MAX_TOOL_ROUNDS"
                    label={t("god_mode.ai.tools_per_turn")}
                    description={t("god_mode.ai.tools_per_turn_desc")}
                    placeholder="5"
                    maxReference={15}
                    tone="purple"
                    error={Boolean(errors.ASSISTANT_MAX_TOOL_ROUNDS)}
                    disabled={isSubmitting}
                  />
                </div>
              </AdminConfigSection>
            </div>
          </div>
        </AdminSettingsPanel>

        <AdminSettingsPanel
          chip={t("god_mode.ai.credentials_chip")}
          title={t("god_mode.ai.credentials_title")}
          description={t("god_mode.ai.credentials_description")}
          icon={Bot}
          iconClassName="text-accent-primary"
          fillHeight
        >
          <div className="flex h-full flex-col gap-5">
            <div className="space-y-2">
              <AdminFieldLabel>{t("god_mode.ai.provider_label")}</AdminFieldLabel>
              <Controller
                control={control}
                name="LLM_PROVIDER"
                render={({ field: { value, onChange } }) => (
                  <CustomSelect
                    value={value}
                    onChange={(next: string | number) => {
                      const nextProvider = getLlmProvider(String(next));
                      onChange(String(next));
                      setUseCustomModel(!nextProvider.models.length);
                      if (nextProvider.defaultModel) {
                        setValue("LLM_MODEL", nextProvider.defaultModel);
                      }
                    }}
                    placement="bottom-start"
                    maxHeight="md"
                    className="w-full"
                    customButtonClassName={SELECT_BUTTON}
                    customButton={
                      <>
                        <div className="min-w-0 text-left">
                          <div className="text-13 font-medium text-primary">{provider.name}</div>
                          <div className="truncate text-11 text-tertiary">{provider.description}</div>
                        </div>
                        <ChevronDown className="size-4 shrink-0 text-tertiary" />
                      </>
                    }
                  >
                    {LLM_PROVIDERS.map((item) => (
                      <CustomSelect.Option key={item.key} value={item.key}>
                        <div>
                          <div className="text-13 font-medium">{item.name}</div>
                          <div className="text-11 text-tertiary">{item.description}</div>
                        </div>
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <AdminFieldLabel>{t("god_mode.ai.model_label")}</AdminFieldLabel>
                {provider.models.length > 0 ? (
                  <>
                    <CustomSelect
                      value={modelSelectValue}
                      onChange={(next: string | number) => {
                        if (String(next) === CUSTOM_MODEL_VALUE) {
                          setUseCustomModel(true);
                          return;
                        }
                        setUseCustomModel(false);
                        setValue("LLM_MODEL", String(next));
                      }}
                      placement="bottom-start"
                      maxHeight="md"
                      className="w-full"
                      customButtonClassName={SELECT_BUTTON}
                      customButton={
                        <>
                          <span className="truncate text-13 font-medium text-primary">
                            {modelSelectValue === CUSTOM_MODEL_VALUE ? t("god_mode.ai.custom_model") : modelValue}
                          </span>
                          <ChevronDown className="size-4 shrink-0 text-tertiary" />
                        </>
                      }
                    >
                      {provider.models.map((model) => (
                        <CustomSelect.Option key={model} value={model}>
                          {model}
                        </CustomSelect.Option>
                      ))}
                      <CustomSelect.Option value={CUSTOM_MODEL_VALUE}>
                        {t("god_mode.ai.other_model")}
                      </CustomSelect.Option>
                    </CustomSelect>
                    {useCustomModel && provider.models.length > 0 ? (
                      <Controller
                        control={control}
                        name="LLM_MODEL"
                        render={({ field: { value, onChange, ref } }) => (
                          <Input
                            id="LLM_MODEL"
                            name="LLM_MODEL"
                            type="text"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            placeholder="ex.: gpt-4.1-nano"
                            className="w-full rounded-xl font-medium"
                          />
                        )}
                      />
                    ) : null}
                  </>
                ) : (
                  <Controller
                    control={control}
                    name="LLM_MODEL"
                    render={({ field: { value, onChange, ref } }) => (
                      <Input
                        id="LLM_MODEL"
                        name="LLM_MODEL"
                        type="text"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        placeholder="ex.: llama3.3:70b"
                        className="w-full rounded-xl font-medium"
                      />
                    )}
                  />
                )}
                <p className="text-11 text-tertiary">
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    className="font-medium text-accent-primary hover:underline"
                    rel="noreferrer"
                  >
                    {t("god_mode.ai.view_models")}
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <AdminFieldLabel>{t("god_mode.ai.api_key")}</AdminFieldLabel>
                  <span
                    className={
                      hasApiKey
                        ? "rounded-full bg-success-subtle px-2 py-0.5 text-10 font-semibold tracking-wide text-success-primary uppercase"
                        : "rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold tracking-wide text-tertiary uppercase"
                    }
                  >
                    {hasApiKey ? t("god_mode.ai.configured") : t("god_mode.ai.pending")}
                  </span>
                </div>
                <ControllerInput
                  key="LLM_API_KEY"
                  control={control}
                  type="password"
                  name="LLM_API_KEY"
                  label=""
                  description={
                    <>
                      {t("god_mode.ai.api_key_hint")}{" "}
                      <a
                        href={provider.apiKeyUrl}
                        target="_blank"
                        className="font-medium text-accent-primary hover:underline"
                        rel="noreferrer"
                      >
                        {provider.name}
                      </a>
                    </>
                  }
                  placeholder="sk-…"
                  error={Boolean(errors.LLM_API_KEY)}
                  required={false}
                />
              </div>
            </div>

            {provider.showBaseUrl ? (
              <ControllerInput
                key="LLM_BASE_URL"
                control={control}
                type="text"
                name="LLM_BASE_URL"
                label={t("god_mode.ai.base_url")}
                description={t("god_mode.ai.base_url_desc")}
                placeholder={provider.baseUrlPlaceholder}
                error={Boolean(errors.LLM_BASE_URL)}
                required={false}
              />
            ) : null}

            <div className="mt-auto space-y-3">
              <AdminConfigCallout variant="accent">
                <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                  <KeyRound className="size-3.5" strokeWidth={1.75} />
                  {t("god_mode.ai.compatibility")}
                </span>
                <span className="mt-1 block">{t("god_mode.ai.compatibility_body")}</span>
              </AdminConfigCallout>
            </div>
          </div>
        </AdminSettingsPanel>
      </div>

      <AdminFormFooter>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-12 leading-relaxed text-secondary">{t("god_mode.ai.footer_note")}</p>
          <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="shrink-0">
            {isSubmitting ? t("god_mode.common.saving") : t("god_mode.common.save")}
          </Button>
        </div>
      </AdminFormFooter>
    </form>
  );
});
