import type { IInstanceConfig } from "@operoz/types";

/** Build-time override; instance config takes precedence when loaded. */
const envFlag = import.meta.env.VITE_ENABLE_OPEROZ_ASSISTANT;

export const isOperozAssistantEnabled = (instanceConfig?: IInstanceConfig): boolean => {
  if (instanceConfig && typeof instanceConfig.operoz_assistant_enabled === "boolean") {
    return instanceConfig.operoz_assistant_enabled;
  }
  return envFlag === undefined || envFlag === "" || envFlag === "true" || envFlag === true;
};

/** @deprecated use isOperozAssistantEnabled(instanceConfig) */
export const ENABLE_OPEROZ_ASSISTANT = isOperozAssistantEnabled();
