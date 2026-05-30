import { useRef, useState } from "react";
import type { EditorRefApi } from "@operis/editor";
import type { useTranslation } from "@operis/i18n";
import { EFileAssetType } from "@operis/types";
import { cn, isEditorEmpty } from "@operis/utils";
import { RichTextEditor } from "@/components/editor/rich-text";
import { IssueModalEditorToolbar } from "@/components/issues/issue-modal/components/issue-modal-editor-toolbar";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type ObservationComposerTheme = {
  composerBorder: string;
  submitBtn: string;
};

type Props = {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  reportId: string;
  theme: ObservationComposerTheme;
  onCommit: (html: string) => void;
  onCancel: () => void;
  t: ReturnType<typeof useTranslation>["t"];
};

export function StatusReportObservationComposer(props: Props) {
  const { workspaceSlug, workspaceId, projectId, reportId, theme, onCommit, onCancel, t } = props;
  const editorRef = useRef<EditorRefApi>(null);
  const [descriptionHtml, setDescriptionHtml] = useState("<p></p>");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();

  const handleCommit = () => {
    const html = editorRef.current?.getDocument().html ?? descriptionHtml;
    if (isEditorEmpty(html)) return;
    onCommit(html);
  };

  return (
    <div className={cn("mt-2 overflow-hidden rounded-lg border bg-layer-1", theme.composerBorder)}>
      <div className="border-b border-subtle bg-layer-2/30" data-prevent-outside-click>
        <IssueModalEditorToolbar editorRef={editorRef} editorReady={isEditorReady} />
      </div>
      <RichTextEditor
        editable
        id={`status-report-observation-${reportId}`}
        initialValue="<p></p>"
        value={descriptionHtml}
        bubbleMenuEnabled={false}
        disabledExtensions={["editorSideMenu", "calloutComponent"]}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        projectId={projectId}
        onChange={(_description, description_html) => setDescriptionHtml(description_html)}
        ref={editorRef}
        placeholder={t("project.status_report.detail_observation_editor_placeholder")}
        dragDropEnabled={false}
        handleEditorReady={setIsEditorReady}
        containerClassName={cn(
          "min-h-[72px] max-h-[200px] overflow-y-auto pl-3 pt-2 pb-1",
          "[&_.ProseMirror_ul]:!pl-6 [&_.ProseMirror_ol]:!pl-6",
          "[&_.ProseMirror_blockquote]:!border-l-0 [&_.ProseMirror_blockquote]:!pl-0"
        )}
        searchMentionCallback={async (payload) =>
          await workspaceService.searchEntity(workspaceSlug, {
            ...payload,
            project_id: projectId,
          })
        }
        uploadFile={async (blockId, file) => {
          const { asset_id } = await uploadEditorAsset({
            blockId,
            data: {
              entity_identifier: reportId,
              entity_type: EFileAssetType.PROJECT_DESCRIPTION,
            },
            file,
            projectId,
            workspaceSlug,
          });
          return asset_id;
        }}
        duplicateFile={async (assetId) => {
          const { asset_id } = await duplicateEditorAsset({
            assetId,
            entityId: reportId,
            entityType: EFileAssetType.PROJECT_DESCRIPTION,
            projectId,
            workspaceSlug,
          });
          return asset_id;
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle px-3 py-2">
        <span className="text-[10px] text-placeholder">{t("project.status_report.detail_item_composer_hint")}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1 text-caption-sm-medium text-tertiary transition-colors hover:bg-layer-3"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={isEditorEmpty(descriptionHtml)}
            className={cn(
              "rounded px-3 py-1 text-caption-sm-medium transition-colors disabled:opacity-40",
              theme.submitBtn
            )}
          >
            {t("project.status_report.detail_add_short")}
          </button>
        </div>
      </div>
    </div>
  );
}
