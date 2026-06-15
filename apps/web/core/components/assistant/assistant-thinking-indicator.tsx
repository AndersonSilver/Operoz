import { useEffect, useState } from "react";
import { Bot, FileSearch, Sparkles, Wrench } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import { assistantToolLabelKey } from "@/lib/assistant-tool-label";

const STEP_MS = 2200;

type Props = {
  activeTool?: string | null;
  startedAt?: number | null;
};

export function AssistantThinkingIndicator({ activeTool = null, startedAt = null }: Props) {
  const { t } = useTranslation();
  const steps = [
    { icon: Sparkles, text: t("operoz_assistant.thinking") },
    { icon: FileSearch, text: t("operoz_assistant.thinking_search") },
    { icon: Bot, text: t("operoz_assistant.thinking_compose") },
  ];
  const [step, setStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (activeTool || startedAt == null) {
      setElapsedSeconds(0);
      return undefined;
    }
    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [activeTool, startedAt]);

  useEffect(() => {
    if (activeTool) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % steps.length);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [activeTool, steps.length]);

  const CurrentIcon = activeTool ? Wrench : steps[step].icon;
  const toolLabelKey = activeTool ? assistantToolLabelKey(activeTool) : null;
  const label = activeTool
    ? toolLabelKey
      ? t(toolLabelKey as "operoz_assistant.thinking")
      : t("operoz_assistant.tool_running", { tool: activeTool })
    : steps[step].text;
  const showElapsed = !activeTool && elapsedSeconds >= 3;

  return (
    <div className="flex justify-start" aria-live="polite" aria-busy="true">
      <div className="shadow-sm flex max-w-[90%] gap-2.5 rounded-xl border border-subtle bg-layer-1 px-3 py-3">
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-primary/15">
          <CurrentIcon className="size-4 text-accent-primary transition-opacity duration-300" />
          <span className="absolute inset-0 animate-ping rounded-full bg-accent-primary/20" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-13 font-medium text-primary">
            {label}
            {showElapsed && (
              <span className="font-normal ml-1.5 text-tertiary">
                {t("operoz_assistant.thinking_elapsed", { seconds: elapsedSeconds })}
              </span>
            )}
          </p>
          {!activeTool && (
            <div className="mt-2 flex items-center gap-1" role="presentation">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    index === step ? "w-4 bg-accent-primary" : "w-1 bg-layer-3"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
