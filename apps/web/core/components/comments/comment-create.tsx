import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// plane imports
import { EIssueCommentAccessSpecifier } from "@operoz/constants";
import type { EditorRefApi } from "@operoz/editor";
import type { TIssueComment, TCommentsOperations } from "@operoz/types";
import { cn, isCommentEmpty } from "@operoz/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";
import { useTranslation } from "@operoz/i18n";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { FileService } from "@/services/file.service";

type TCommentCreate = {
  entityId: string;
  workspaceSlug: string;
  activityOperations: TCommentsOperations;
  showToolbarInitially?: boolean;
  projectId?: string;
  onSubmitCallback?: (elementId: string) => void;
  className?: string;
  parentClassName?: string;
  editorClassName?: string;
  containerClassName?: string;
  showQuickReplies?: boolean;
  editorVariant?: "full" | "lite" | "none";
  showSubmitButton?: boolean;
  /** Layout minimalista estilo Jira — sem toolbar, chips integrados */
  activityLayout?: boolean;
};

const QUICK_REPLY_KEYS = [
  "issue.activity.quick_replies.more_info",
  "issue.activity.quick_replies.status_update",
  "issue.activity.quick_replies.thanks",
] as const;

const fileService = new FileService();

export const CommentCreate = observer(function CommentCreate(props: TCommentCreate) {
  const {
    workspaceSlug,
    entityId,
    activityOperations,
    showToolbarInitially = false,
    projectId,
    onSubmitCallback,
    className,
    parentClassName = "p-2",
    editorClassName,
    containerClassName,
    showQuickReplies = false,
    editorVariant = "full",
    showSubmitButton = true,
    activityLayout = false,
  } = props;
  const { t } = useTranslation();
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  const editorRef = useRef<EditorRefApi>(null);
  const workspaceStore = useWorkspace();
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug)?.id as string;

  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<Partial<TIssueComment>>({
    defaultValues: {
      comment_html: "<p></p>",
    },
  });

  const onSubmit = async (formData: Partial<TIssueComment>) => {
    try {
      const comment = await activityOperations.createComment(formData);
      if (comment?.id) onSubmitCallback?.(comment.id);
      if (uploadedAssetIds.length > 0) {
        if (projectId) {
          await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId.toString(), entityId, {
            asset_ids: uploadedAssetIds,
          });
        } else {
          await fileService.updateBulkWorkspaceAssetsUploadStatus(workspaceSlug, entityId, {
            asset_ids: uploadedAssetIds,
          });
        }
        setUploadedAssetIds([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      reset({ comment_html: "<p></p>" });
      editorRef.current?.clearEditor();
    }
  };

  const commentHTML = watch("comment_html");
  const isEmpty = isCommentEmpty(commentHTML ?? undefined);

  const resolvedVariant = activityLayout ? "none" : editorVariant;
  const resolvedParentClassName = activityLayout
    ? "!border-0 !p-0 !rounded-none !shadow-none bg-transparent"
    : parentClassName;
  const resolvedContainerClassName = activityLayout
    ? cn("min-h-[64px] px-3 pt-3", containerClassName)
    : cn("min-h-min", containerClassName);

  return (
    <div
      className={cn(activityLayout ? "static" : "sticky bottom-0 z-[4] bg-surface-1 sm:static", className)}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          !e.ctrlKey &&
          !e.metaKey &&
          !isEmpty &&
          !isSubmitting &&
          editorRef.current?.isEditorReadyToDiscard()
        )
          handleSubmit(onSubmit)(e);
      }}
    >
      <Controller
        name="access"
        control={control}
        render={({ field: { onChange: onAccessChange, value: accessValue } }) => (
          <Controller
            name="comment_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <>
                <LiteTextEditor
                  editable
                  workspaceId={workspaceId}
                  id={"add_comment_" + entityId}
                  value={"<p></p>"}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  variant={resolvedVariant}
                  onEnterKeyPress={(e) => {
                    if (!isEmpty && !isSubmitting) {
                      handleSubmit(onSubmit)(e);
                    }
                  }}
                  ref={editorRef}
                  initialValue={value ?? "<p></p>"}
                  containerClassName={resolvedContainerClassName}
                  editorClassName={cn("text-13 text-primary", editorClassName)}
                  onChange={(comment_json, comment_html) => onChange(comment_html)}
                  accessSpecifier={accessValue ?? EIssueCommentAccessSpecifier.INTERNAL}
                  handleAccessChange={onAccessChange}
                  isSubmitting={isSubmitting}
                  showSubmitButton={activityLayout ? false : showSubmitButton}
                  uploadFile={async (blockId, file) => {
                    const { asset_id } = await activityOperations.uploadCommentAsset(blockId, file);
                    setUploadedAssetIds((prev) => [...prev, asset_id]);
                    return asset_id;
                  }}
                  duplicateFile={async (assetId: string) => {
                    const { asset_id } = await activityOperations.duplicateCommentAsset(assetId);
                    setUploadedAssetIds((prev) => [...prev, asset_id]);
                    return asset_id;
                  }}
                  showToolbarInitially={activityLayout ? false : showToolbarInitially}
                  parentClassName={resolvedParentClassName}
                  displayConfig={{ fontSize: "small-font" }}
                  placeholder={
                    showQuickReplies || activityLayout ? t("issue.activity.add_comment_placeholder") : undefined
                  }
                  showPlaceholderOnEmpty
                />
                {(showQuickReplies || activityLayout) && (
                  <div className="flex flex-wrap gap-2 px-3 pb-3">
                    {QUICK_REPLY_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        className={cn(
                          "max-w-full truncate rounded-md border border-subtle px-2.5 py-1 text-11 text-secondary transition-colors",
                          activityLayout
                            ? "bg-layer-3 hover:bg-layer-2-hover hover:text-primary"
                            : "bg-layer-2 hover:bg-layer-2-hover hover:text-primary"
                        )}
                        onClick={() => {
                          const html = `<p>${t(key)}</p>`;
                          editorRef.current?.setEditorValue(html);
                          onChange(html);
                        }}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          />
        )}
      />
    </div>
  );
});
