import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { ChevronDown, FolderKanban, LayoutGrid } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { CustomSelect } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { useAssistant } from "@/hooks/use-assistant";
import { useAssistantContextDefaults, useAssistantContextScope } from "@/hooks/use-assistant-context-scope";

const SELECT_TRIGGER_CLASS =
  "!h-8 !min-h-8 !w-full !items-center !justify-between !gap-2 !rounded-md !border !border-subtle/80 !bg-layer-2 !px-2.5 !py-0 !text-12 !font-medium !leading-none hover:!bg-layer-1";

type ContextFieldProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  required?: boolean;
};

function ContextField(props: ContextFieldProps) {
  const { icon, label, children, required } = props;

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <div className="flex min-h-4 w-full items-center gap-1.5 px-0.5">
        <span className="inline-flex size-3.5 shrink-0 items-center justify-center text-tertiary">{icon}</span>
        <span className="truncate text-[10px] leading-none font-medium text-tertiary">
          {label}
          {required ? " *" : null}
        </span>
      </div>
      <div className="w-full min-w-0">{children}</div>
    </div>
  );
}

type ContextSelectProps = {
  value: string | undefined;
  placeholder: string;
  displayValue: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
};

function ContextSelect(props: ContextSelectProps) {
  const { value, placeholder, displayValue, onChange, children, disabled = false } = props;

  if (disabled) {
    return (
      <div
        className={cn(
          "flex h-8 min-h-8 w-full items-center justify-center rounded-md border border-subtle/80 bg-layer-2 px-2.5",
          "text-12 leading-none font-medium text-tertiary"
        )}
      >
        <span className="min-w-0 truncate">{placeholder}</span>
      </div>
    );
  }

  return (
    <CustomSelect
      value={value}
      onChange={(nextValue) => onChange(String(nextValue))}
      placement="bottom-start"
      maxHeight="md"
      className="!relative !block !w-full !min-w-0 !flex-shrink"
      optionsClassName="!z-[60] min-w-[14rem]"
      customButtonClassName={SELECT_TRIGGER_CLASS}
      customButton={
        <>
          <span className="min-w-0 flex-1 truncate text-left text-12 leading-none font-medium text-primary">
            {displayValue || placeholder}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-tertiary" strokeWidth={2} />
        </>
      }
    >
      {children}
    </CustomSelect>
  );
}

export const AssistantContextChip = observer(function AssistantContextChip() {
  const { t } = useTranslation();
  const assistant = useAssistant();
  useAssistantContextDefaults();
  const {
    boards,
    projects,
    hasBoards,
    isReady,
    selectedBoardSlug,
    selectedProjectId,
    boardsEnabled,
    getProjectIdsForBoard,
  } = useAssistantContextScope();

  const selectedBoard = boards.find((board) => board.slug === selectedBoardSlug);
  const selectedBoardName = selectedBoard?.name ?? selectedBoardSlug;
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const selectedProjectName = selectedProject?.name ?? "";

  const handleBoardChange = (value: string) => {
    const board = boards.find((item) => item.slug === value);
    const firstProjectId = board ? getProjectIdsForBoard(board.id)[0] : undefined;
    void assistant.updateSessionContext({
      board_slug: value,
      project_id: firstProjectId,
    });
  };

  const handleProjectChange = (value: string) => {
    void assistant.updateSessionContext({
      board_slug: assistant.sessionContext.board_slug,
      project_id: value,
    });
  };

  const showBoardSelect = boardsEnabled && hasBoards;
  const showProjectSelect = projects.length > 0 || !boardsEnabled;
  const segmentCount = [showBoardSelect, showProjectSelect].filter(Boolean).length;

  if (!showBoardSelect && !showProjectSelect) {
    return (
      <div className="w-full rounded-xl border border-subtle/80 bg-layer-1/50 p-2 text-center">
        <p className="text-11 text-secondary">{t("operoz_assistant.context_loading")}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-layer-1/50 p-2",
        isReady ? "border-subtle/80" : "border-warning-subtle/80"
      )}
    >
      <p className="mb-2 px-0.5 text-[10px] font-medium tracking-wide text-tertiary uppercase">
        {t("operoz_assistant.context_scope_label")}
      </p>
      {!isReady ? (
        <p className="mb-2 px-0.5 text-11 leading-snug text-secondary">{t("operoz_assistant.context_required_hint")}</p>
      ) : null}
      <div className={cn("grid w-full items-start gap-2", segmentCount > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {showBoardSelect ? (
          <ContextField
            icon={<LayoutGrid className="size-3.5" strokeWidth={2} />}
            label={t("operoz_assistant.context_board")}
            required
          >
            <ContextSelect
              value={selectedBoardSlug || undefined}
              placeholder={t("operoz_assistant.context_select_board")}
              displayValue={selectedBoardName}
              onChange={handleBoardChange}
            >
              {boards.map((board) => (
                <CustomSelect.Option key={board.id} value={board.slug}>
                  {board.name}
                </CustomSelect.Option>
              ))}
            </ContextSelect>
          </ContextField>
        ) : null}

        {showProjectSelect ? (
          <ContextField
            icon={<FolderKanban className="size-3.5" strokeWidth={2} />}
            label={t("operoz_assistant.context_project_label")}
            required
          >
            <ContextSelect
              value={selectedProjectId || undefined}
              placeholder={t("operoz_assistant.context_select_project")}
              displayValue={selectedProjectName}
              onChange={handleProjectChange}
              disabled={projects.length === 0}
            >
              {projects.map((project) => (
                <CustomSelect.Option key={project.id} value={project.id}>
                  {project.name}
                </CustomSelect.Option>
              ))}
            </ContextSelect>
          </ContextField>
        ) : null}
      </div>
    </div>
  );
});
