"use client";

import { observer } from "mobx-react";
import { Bot, MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { Client360Section } from "@/components/board/client-360/client-360-ui";
import { useAssistant } from "@/hooks/use-assistant";
import { isOperozAssistantEnabled } from "@/constants/enable-assistant";
import { useInstance } from "@/hooks/store/use-instance";

type Props = {
  workspaceSlug: string;
  projectId: string;
  projectName: string;
};

const SUGGESTED_PROMPTS = [
  "boards.client_360.intelligence_chat_prompt_health",
  "boards.client_360.intelligence_chat_prompt_risks",
  "boards.client_360.intelligence_chat_prompt_actions",
] as const;

export const Client360DetailAssistantBody = observer(function Client360DetailAssistantBody({
  workspaceSlug,
  projectId,
  projectName,
}: Props) {
  const { t } = useTranslation();
  const assistant = useAssistant();
  const { config: instanceConfig } = useInstance();
  const enabled = isOperozAssistantEnabled(instanceConfig);

  useEffect(() => {
    if (!enabled) return;
    void assistant.updateSessionContext({ project_id: projectId });
  }, [assistant, enabled, projectId]);

  if (!enabled) return null;

  const openChat = (prompt?: string) => {
    void assistant.updateSessionContext({ project_id: projectId });
    assistant.openWithFocus();
    if (prompt) {
      void assistant.sendMessage(prompt);
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="primary" size="sm" onClick={() => openChat()}>
        <MessageSquare className="mr-1.5 size-3.5" />
        {t("boards.client_360.intelligence_chat_open")}
      </Button>
      <p className="text-12 text-tertiary">
        {t("boards.client_360.intelligence_chat_subtitle", { name: projectName })}
      </p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((key) => (
          <Button key={key} variant="secondary" size="sm" onClick={() => openChat(t(key))}>
            {t(key)}
          </Button>
        ))}
      </div>
    </div>
  );
});

export const Client360DetailAssistant = observer(function Client360DetailAssistant(props: Props) {
  const { t } = useTranslation();
  const { config: instanceConfig } = useInstance();
  const enabled = isOperozAssistantEnabled(instanceConfig);

  if (!enabled) return null;

  return (
    <Client360Section
      sectionId="assistant"
      icon={Bot}
      iconTone="accent"
      title={t("boards.client_360.intelligence_chat_title")}
      description={t("boards.client_360.intelligence_chat_subtitle", { name: props.projectName })}
    >
      <Client360DetailAssistantBody {...props} />
    </Client360Section>
  );
});

export function useClient360DetailAssistantActions(projectId: string) {
  const assistant = useAssistant();
  const { config: instanceConfig } = useInstance();
  const enabled = isOperozAssistantEnabled(instanceConfig);

  const openChat = (prompt?: string) => {
    if (!enabled) return;
    void assistant.updateSessionContext({ project_id: projectId });
    assistant.openWithFocus();
    if (prompt) {
      void assistant.sendMessage(prompt);
    }
  };

  return { enabled, openChat };
}
