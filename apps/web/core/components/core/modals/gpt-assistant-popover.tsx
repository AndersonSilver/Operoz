import type { Ref } from "react";
import React, { useCallback, useEffect, useState, useRef, Fragment } from "react";
import type { Placement } from "@popperjs/core";
import { Controller, useForm } from "react-hook-form";
import { usePopper } from "react-popper";
import { AlertCircle } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import type { EditorRefApi } from "@operis/editor";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Input } from "@operis/ui";
import { cn, sanitizeHtmlForRender } from "@operis/utils";
import { RichTextEditor } from "@/components/editor/rich-text";
import { AIService } from "@/services/ai.service";

const aiService = new AIService();

type GptAssistantPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onResponse: (response: string) => void;
  onError?: (error: unknown) => void;
  prompt?: string;
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
  /** Inline: faixa abaixo da toolbar. Popover: painel flutuante compacto. */
  variant?: "inline" | "popover";
};

type FormData = {
  prompt: string;
  task: string;
};

export function GptAssistantPanel(props: GptAssistantPanelProps) {
  const {
    isOpen,
    onClose,
    onResponse,
    onError,
    prompt,
    workspaceId,
    workspaceSlug,
    projectId,
    variant = "popover",
  } = props;
  const { t } = useTranslation();
  const isInline = variant === "inline";

  const [response, setResponse] = useState("");
  const [invalidResponse, setInvalidResponse] = useState(false);
  const editorRef = useRef<EditorRefApi>(null);
  const responseRef = useRef<EditorRefApi>(null);

  const {
    handleSubmit,
    control,
    reset,
    setFocus,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      prompt: prompt || "",
      task: "",
    },
  });

  const handleClose = () => {
    onClose();
    setResponse("");
    setInvalidResponse(false);
    reset();
  };

  const handleServiceError = (err: unknown) => {
    const error = (err as { data?: { error?: string }; status?: number })?.data?.error;
    const status = (err as { status?: number })?.status;
    const errorMessage =
      status === 429 ? error || t("issue_modal_ai_error_rate_limit") : error || t("issue_modal_ai_error_generic");

    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("error"),
      message: errorMessage,
    });

    if (onError) onError(err);
  };

  const callAIService = async (formData: FormData) => {
    try {
      const res = await aiService.createGptTask(workspaceSlug.toString(), {
        prompt: prompt || "",
        task: formData.task,
      });

      setResponse(res.response_html);
      setFocus("task");
      setInvalidResponse(res.response === "");
    } catch (err) {
      handleServiceError(err);
    }
  };

  const handleAIResponse = async (formData: FormData) => {
    if (!workspaceSlug) return;

    if (formData.task === "") {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("issue_modal_ai_error_empty_task"),
      });
      return;
    }

    await callAIService(formData);
  };

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setFocus("task");
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, setFocus]);

  useEffect(() => {
    editorRef.current?.setEditorValue(prompt || "");
  }, [editorRef, prompt]);

  useEffect(() => {
    responseRef.current?.setEditorValue(`<p>${response}</p>`);
  }, [response, responseRef]);

  const handlePanelKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        handleSubmit(handleAIResponse)();
      }
    },
    [handleClose, handleSubmit, handleAIResponse]
  );

  if (!isOpen) return null;

  const generateLabel = isSubmitting
    ? t("issue_modal_ai_generating")
    : response === ""
      ? t("issue_modal_ai_generate")
      : t("issue_modal_ai_generate_again");

  const taskPlaceholder =
    prompt && prompt !== "" ? t("issue_modal_ai_task_placeholder_with_content") : t("issue_modal_ai_task_placeholder");

  return (
    <div
      className={cn("flex flex-col gap-2.5", {
        "border-t border-subtle bg-layer-2 px-3 py-2.5": isInline,
        "p-3": !isInline,
      })}
      data-prevent-outside-click
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={handlePanelKeyDown}
    >
      {!isInline && prompt && (
        <div className="max-h-32 overflow-y-auto text-13">
          <span className="mb-1 block font-medium text-tertiary">{t("issue_modal_ai_content_label")}</span>
          <RichTextEditor
            editable={false}
            id="ai-assistant-content"
            initialValue={prompt}
            containerClassName="-m-3"
            ref={editorRef}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
        </div>
      )}

      {response !== "" && (
        <div
          className={cn("overflow-y-auto rounded-xs border border-subtle bg-layer-2 text-13 text-secondary", {
            "max-h-28 px-2.5 py-2": isInline,
            "page-block-section max-h-[8rem]": !isInline,
          })}
        >
          {isInline ? (
            <div
              className="prose-invert max-w-none text-13 prose [&_p]:my-1"
              dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(response) }}
            />
          ) : (
            <>
              <span className="mb-1 block font-medium text-tertiary">{t("issue_modal_ai_response_label")}</span>
              <RichTextEditor
                editable={false}
                id="ai-assistant-response"
                initialValue={`<p>${response}</p>`}
                ref={responseRef}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
              />
            </>
          )}
        </div>
      )}

      {invalidResponse && <p className="text-13 text-danger-primary">{t("issue_modal_ai_invalid_response")}</p>}

      <Controller
        control={control}
        name="task"
        render={({ field: { value, onChange, ref } }) => (
          <Input
            id="issue-modal-ai-task"
            name="issue-modal-ai-task"
            type="text"
            value={value}
            onChange={onChange}
            ref={ref}
            placeholder={taskPlaceholder}
            className="w-full"
            autoFocus
            autoComplete="off"
          />
        )}
      />

      <div
        className={cn("flex gap-2", {
          "flex-col sm:flex-row sm:items-center sm:justify-between": isInline,
          "justify-between": !isInline,
        })}
      >
        {response !== "" ? (
          <Button
            variant="primary"
            className="shrink-0"
            onClick={() => {
              onResponse(response);
              handleClose();
            }}
          >
            {t("issue_modal_ai_use_response")}
          </Button>
        ) : (
          <div className="flex min-w-0 items-start gap-1.5 text-11 text-accent-primary">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <p className="min-w-0">{t("issue_modal_ai_consent")}</p>
          </div>
        )}
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            {t("close")}
          </Button>
          <Button variant="primary" onClick={handleSubmit(handleAIResponse)} loading={isSubmitting}>
            {generateLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

type PopoverProps = Omit<GptAssistantPanelProps, "onClose" | "variant"> & {
  handleClose: () => void;
  placement?: Placement;
  button: React.ReactNode;
  className?: string;
};

export function GptAssistantPopover(props: PopoverProps) {
  const { placement, button, className = "", isOpen, handleClose, ...panelProps } = props;
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-end",
    strategy: "fixed",
    modifiers: [
      { name: "flip", options: { fallbackPlacements: ["bottom-start", "top-end"] } },
      { name: "preventOverflow", options: { padding: 8 } },
    ],
  });

  return (
    <Popover as="div" className="relative w-min text-left">
      <Popover.Button as={Fragment}>
        <button ref={setReferenceElement} type="button" className="flex items-center" tabIndex={-1}>
          {button}
        </button>
      </Popover.Button>
      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Popover.Panel
          as="div"
          className={cn(
            "fixed z-40 flex w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden rounded-md border border-subtle bg-surface-1 shadow-raised-200",
            className
          )}
          ref={setPopperElement as Ref<HTMLDivElement>}
          style={styles.popper}
          {...attributes.popper}
        >
          <GptAssistantPanel {...panelProps} isOpen={isOpen} onClose={handleClose} variant="popover" />
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
