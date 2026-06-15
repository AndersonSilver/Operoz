import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Bot, ChevronDown, Gauge, Sparkles } from "lucide-react";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceAIConfigurationKeys } from "@operis/types";
import { CustomSelect, Input, ToggleSwitch } from "@operis/ui";
// components
import { ControllerInput } from "@/components/common/controller-input";
// constants
import { CUSTOM_MODEL_VALUE, getLlmProvider, LLM_PROVIDERS, type TLlmProviderKey } from "@/constants/llm-providers";
// hooks
import { useInstance } from "@/hooks/store";

type IInstanceAIForm = {
  config: IFormattedInstanceConfiguration;
};

type AIFormValues = Record<TInstanceAIConfigurationKeys, string>;

type SettingsSectionProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
};

function SettingsSection(props: SettingsSectionProps) {
  const { icon, title, description, children } = props;

  return (
    <section className="overflow-hidden rounded-lg border border-subtle bg-layer-2">
      <div className="flex items-start gap-3 border-b border-subtle px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-layer-1">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-14 font-medium text-primary">{title}</h3>
          {description ? <p className="pt-0.5 text-11 text-tertiary">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-5 p-4">{children}</div>
    </section>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

function ToggleRow(props: ToggleRowProps) {
  const { label, description, value, onChange, disabled } = props;

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-subtle bg-layer-1 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-13 font-medium text-primary">{label}</div>
        <div className="text-11 text-tertiary">{description}</div>
      </div>
      <ToggleSwitch value={value} onChange={onChange} size="sm" disabled={disabled} />
    </div>
  );
}

export function InstanceAIForm(props: IInstanceAIForm) {
  const { config } = props;
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
  const provider = useMemo(() => getLlmProvider(providerKey), [providerKey]);

  const [useCustomModel, setUseCustomModel] = useState(() => {
    const initialProvider = getLlmProvider(config["LLM_PROVIDER"] || "openai");
    if (!initialProvider.models.length) return true;
    const model = config["LLM_MODEL"];
    return Boolean(model && !initialProvider.models.includes(model));
  });

  const modelSelectValue = useCustomModel || !provider.models.length ? CUSTOM_MODEL_VALUE : modelValue;

  const onSubmit = async (formData: AIFormValues) => {
    const payload: Partial<AIFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Configurações salvas",
          message: "As configurações de IA do Operoz foram atualizadas.",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <SettingsSection
        icon={<Sparkles className="size-4 text-accent-primary" />}
        title="Operoz Assistant"
        description="Controle a disponibilidade do assistente de IA nos workspaces."
      >
        <div className="space-y-3">
          <Controller
            control={control}
            name="ASSISTANT_ENABLED"
            render={({ field: { value, onChange } }) => (
              <ToggleRow
                label="Assistente no backend"
                description="Habilita a API do assistente Operoz para processar mensagens."
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
              <ToggleRow
                label="Assistente no frontend"
                description="Exibe o botão flutuante de chat nos workspaces."
                value={Boolean(parseInt(value || "0", 10))}
                onChange={(next) => onChange(next ? "1" : "0")}
                disabled={isSubmitting}
              />
            )}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Gauge className="size-4 text-accent-primary" />}
        title="Limites e proteção"
        description="Rate limits Redis para uso justo do assistente."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ControllerInput
            key="ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR"
            control={control}
            type="text"
            name="ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR"
            label="Mensagens / usuário / hora"
            description="Teto por usuário autenticado."
            placeholder="60"
            error={Boolean(errors.ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR)}
            required={false}
          />
          <ControllerInput
            key="ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR"
            control={control}
            type="text"
            name="ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR"
            label="Mensagens / workspace / hora"
            description="Teto global por workspace."
            placeholder="500"
            error={Boolean(errors.ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR)}
            required={false}
          />
          <ControllerInput
            key="ASSISTANT_MAX_TOOL_ROUNDS"
            control={control}
            type="text"
            name="ASSISTANT_MAX_TOOL_ROUNDS"
            label="Rodadas de tools / mensagem"
            description="Chamadas de ferramentas por turno."
            placeholder="5"
            error={Boolean(errors.ASSISTANT_MAX_TOOL_ROUNDS)}
            required={false}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Bot className="size-4 text-accent-primary" />}
        title="Modelo de linguagem"
        description="Escolha o provedor, o modelo e as credenciais. Qualquer modelo é suportado."
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-13 text-tertiary">Provedor</h4>
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
                  customButtonClassName="!w-full !justify-between !rounded-md !border !border-subtle !bg-layer-1 !px-3 !py-2"
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <h4 className="text-13 text-tertiary">Modelo</h4>
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
                    customButtonClassName="!w-full !justify-between !rounded-md !border !border-subtle !bg-layer-1 !px-3 !py-2"
                    customButton={
                      <>
                        <span className="truncate text-13 font-medium text-primary">
                          {modelSelectValue === CUSTOM_MODEL_VALUE ? "Modelo personalizado" : modelValue}
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
                    <CustomSelect.Option value={CUSTOM_MODEL_VALUE}>Outro modelo…</CustomSelect.Option>
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
                          placeholder="ex.: gpt-4.1-nano ou llama3.3:70b"
                          className="mt-2 w-full rounded-md font-medium"
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
                      placeholder="ex.: llama3.3:70b, mistral-large, gpt-4o"
                      className="w-full rounded-md font-medium"
                    />
                  )}
                />
              )}
              <p className="pt-0.5 text-11 text-tertiary">
                Use o identificador exato do provedor.{" "}
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  className="text-accent-primary hover:underline"
                  rel="noreferrer"
                >
                  Ver modelos
                </a>
              </p>
            </div>

            <ControllerInput
              key="LLM_API_KEY"
              control={control}
              type="password"
              name="LLM_API_KEY"
              label="Chave de API"
              description={
                <>
                  Obtenha sua chave{" "}
                  <a
                    href={provider.apiKeyUrl}
                    target="_blank"
                    className="text-accent-primary hover:underline"
                    rel="noreferrer"
                  >
                    no painel do provedor
                  </a>
                  .
                </>
              }
              placeholder="sk-…"
              error={Boolean(errors.LLM_API_KEY)}
              required={false}
            />
          </div>

          {provider.showBaseUrl ? (
            <ControllerInput
              key="LLM_BASE_URL"
              control={control}
              type="text"
              name="LLM_BASE_URL"
              label="URL base da API"
              description="Endpoint OpenAI-compatible (Ollama, Groq, OpenRouter, vLLM, etc.)."
              placeholder={provider.baseUrlPlaceholder}
              error={Boolean(errors.LLM_BASE_URL)}
              required={false}
            />
          ) : null}

          <div className="rounded-md border border-accent-subtle bg-accent-subtle px-3 py-2 text-11 text-accent-secondary">
            O Operoz suporta OpenAI, Anthropic, Gemini e qualquer API compatível com o formato OpenAI. Para Ollama
            local, use o provedor <span className="font-medium">OpenAI-compatible</span> com URL{" "}
            <code className="rounded bg-layer-1 px-1">http://host.docker.internal:11434/v1</code>.
          </div>
        </div>
      </SettingsSection>

      <div className="flex items-center gap-4">
        <Button variant="primary" size="lg" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
