import { useCallback, useState } from "react";
import type { RefObject } from "react";
import { observer } from "mobx-react";
import { Sparkles } from "lucide-react";
import type { EditorRefApi } from "@operoz/editor";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { cn, isEditorEmpty } from "@operoz/utils";
import { GptAssistantPanel } from "@/components/core/modals/gpt-assistant-popover";
import { useInstance } from "@/hooks/store/use-instance";
import { AIService } from "@/services/ai.service";

const aiService = new AIService();

type AiPresetId = "correct" | "rephrase" | "review" | "improve" | "draft";

const PRESET_TASKS: Record<AiPresetId, string> = {
  correct:
    "Corrija gramática, ortografia e pontuação do texto em português do Brasil. Mantenha o sentido original e a formatação HTML simples (negrito, listas). Devolva apenas o HTML corrigido, sem explicações.",
  rephrase:
    "Reformule o texto em português do Brasil de forma mais clara e profissional para um status report semanal. Mantenha os fatos; HTML simples permitido. Devolva apenas o HTML reformulado.",
  review:
    "Revise o texto como revisor de status report: melhore clareza, tom executivo e objetividade em português do Brasil. Corrija problemas encontrados. Devolva apenas a versão revisada em HTML simples.",
  improve:
    "Melhore a redação do item de status report: mais direto, profissional e legível em português do Brasil. Preserve os fatos. Devolva apenas o HTML melhorado.",
  draft:
    "Redija um item conciso (1 a 3 frases) para status report semanal em português do Brasil, com tom profissional. Use o rascunho como base; se estiver vazio, escreva um placeholder genérico coerente com o contexto. HTML simples (<strong> se fizer sentido). Não invente números ou datas.",
};

type Props = {
  editorRef: RefObject<EditorRefApi | null>;
  descriptionHtml: string;
  onDescriptionChange: (html: string) => void;
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
};

export const StatusReportObservationAiAssistant = observer(function StatusReportObservationAiAssistant(props: Props) {
  const { editorRef, descriptionHtml, onDescriptionChange, workspaceSlug, workspaceId, projectId } = props;
  const { t } = useTranslation();
  const { config } = useInstance();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<AiPresetId | null>(null);

  const getEditorPrompt = useCallback(() => {
    const html = editorRef.current?.getDocument().html ?? descriptionHtml;
    return isEditorEmpty(html) ? "" : html;
  }, [descriptionHtml, editorRef]);

  const editorPrompt = getEditorPrompt();
  const hasContent = Boolean(editorPrompt);

  const applyAiResponse = useCallback(
    (html: string) => {
      editorRef.current?.setEditorValue(html, true);
      onDescriptionChange(html);
    },
    [editorRef, onDescriptionChange]
  );

  const handleServiceError = useCallback(
    (err: unknown) => {
      const error = (err as { data?: { error?: string }; status?: number })?.data?.error;
      const status = (err as { status?: number })?.status;
      const errorMessage =
        status === 429 ? error || t("issue_modal_ai_error_rate_limit") : error || t("issue_modal_ai_error_generic");
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: errorMessage });
    },
    [t]
  );

  const runPreset = useCallback(
    async (preset: AiPresetId) => {
      if (!workspaceSlug) return;
      const prompt = getEditorPrompt();
      setLoadingPreset(preset);
      try {
        const res = await aiService.createGptTask(workspaceSlug, {
          prompt,
          task: PRESET_TASKS[preset],
        });
        const html = res.response_html?.trim() ?? "";
        if (!html) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("error"),
            message: t("issue_modal_ai_invalid_response"),
          });
          return;
        }
        applyAiResponse(html);
      } catch (err) {
        handleServiceError(err);
      } finally {
        setLoadingPreset(null);
      }
    },
    [applyAiResponse, getEditorPrompt, handleServiceError, t, workspaceSlug]
  );

  if (!config?.has_llm_configured) return null;

  const presets: { id: AiPresetId; label: string; requiresContent?: boolean }[] = [
    { id: "correct", label: t("project.status_report.ai.correct"), requiresContent: true },
    { id: "rephrase", label: t("project.status_report.ai.rephrase"), requiresContent: true },
    { id: "review", label: t("project.status_report.ai.review"), requiresContent: true },
    { id: "improve", label: t("project.status_report.ai.improve"), requiresContent: true },
    { id: "draft", label: t("project.status_report.ai.draft") },
  ];

  return (
    <div className="border-b border-subtle bg-layer-2/20" data-prevent-outside-click>
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setIsPanelOpen((open) => !open)}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-11 font-medium transition-colors",
            isPanelOpen
              ? "bg-accent-primary/10 text-accent-primary"
              : "text-secondary hover:bg-layer-transparent-hover hover:text-primary"
          )}
        >
          <Sparkles className="size-3.5" strokeWidth={1.75} />
          {t("project.status_report.ai.assistant")}
        </button>

        <span className="bg-subtle hidden h-4 w-px sm:block" aria-hidden />

        {presets.map((preset) => {
          const disabled = Boolean(preset.requiresContent && !hasContent) || loadingPreset !== null;
          const isLoading = loadingPreset === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => void runPreset(preset.id)}
              className={cn(
                "rounded-sm px-2 py-1 text-11 transition-colors",
                disabled && !isLoading
                  ? "cursor-not-allowed text-placeholder opacity-50"
                  : "text-tertiary hover:bg-layer-transparent-hover hover:text-secondary",
                isLoading && "bg-layer-1 text-primary"
              )}
            >
              {isLoading ? t("issue_modal_ai_generating") : preset.label}
            </button>
          );
        })}
      </div>

      {isPanelOpen && (
        <GptAssistantPanel
          isOpen
          variant="inline"
          prompt={editorPrompt}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          onClose={() => setIsPanelOpen(false)}
          onResponse={applyAiResponse}
          onError={handleServiceError}
        />
      )}
    </div>
  );
});
