import { Bot } from "lucide-react";
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
import { isOperozAssistantEnabled } from "@/constants/enable-assistant";
import { useInstance } from "@/hooks/store/use-instance";
import { useAssistant } from "@/hooks/use-assistant";

export const useOperozAssistantPowerKCommand = (): TPowerKCommandConfig[] => {
  const assistant = useAssistant();
  const { config: instanceConfig } = useInstance();

  return [
    {
      id: "ask_operoz_assistant",
      type: "action",
      group: "general",
      i18n_title: "power_k.general_actions.ask_operoz",
      i18n_description: "power_k.general_actions.ask_operoz_description",
      icon: Bot,
      keywords: ["operoz", "assistant", "assistente", "ia", "chat", "perguntar"],
      action: (ctx) => {
        assistant.openWithFocus();
        ctx.closePalette();
      },
      isEnabled: () => true,
      isVisible: (ctx) => Boolean(ctx.params.workspaceSlug) && isOperozAssistantEnabled(instanceConfig),
      closeOnSelect: true,
    },
  ];
};
