import { BookOpen, GithubIcon, Rocket } from "lucide-react";
import { useParams } from "next/navigation";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";

/**
 * Help commands - Help related commands
 */
export const usePowerKHelpCommands = (): TPowerKCommandConfig[] => {
  const { workspaceSlug } = useParams();
  // store
  const { toggleShortcutsListModal } = usePowerK();

  return [
    {
      id: "open_operoz_manual",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_operoz_manual",
      icon: BookOpen,
      action: () => {
        if (workspaceSlug) {
          window.location.href = `/${workspaceSlug.toString()}/manual`;
        }
      },
      isEnabled: () => !!workspaceSlug,
      isVisible: () => !!workspaceSlug,
      closeOnSelect: true,
    },
    {
      id: "open_keyboard_shortcuts",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.open_keyboard_shortcuts",
      icon: Rocket,
      modifierShortcut: "cmd+/",
      action: () => toggleShortcutsListModal(true),
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "report_bug",
      type: "action",
      group: "help",
      i18n_title: "power_k.help_actions.report_bug",
      icon: GithubIcon,
      action: () => {
        window.open("https://github.com/makeplane/plane/issues/new/choose", "_blank", "noopener,noreferrer");
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
