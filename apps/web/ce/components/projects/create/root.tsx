import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { EFileAssetType } from "@operis/types";
import type { TCustomFieldValue } from "@operis/types";
// components
import { BoardSelectField } from "@/components/board/board-select-field";
import { BoardProjectDynamicFields } from "@/components/project/board-project-dynamic-fields";
import { validateProjectLayoutRequired } from "@/components/project/project-layout-validation";
import ProjectCommonAttributes from "@/components/project/create/common-attributes";
import ProjectCreateHeader from "@/components/project/create/header";
import ProjectCreateButtons from "@/components/project/create/project-create-buttons";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
// hooks
import { getCoverImageType, uploadCoverImage } from "@/helpers/cover-image.helper";
import { useBoard } from "@/hooks/store/use-board";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { BoardCustomFieldService } from "@/services/board/board-custom-field.service";
// plane web types
import type { TProject } from "@/plane-web/types/projects";
import { ProjectAttributes } from "./attributes";
import { getProjectFormValues } from "./utils";

export type TCreateProjectFormProps = {
  setToFavorite?: boolean;
  workspaceSlug: string;
  onClose: () => void;
  handleNextStep: (projectId: string) => void;
  data?: Partial<TProject>;
  templateId?: string;
  updateCoverImageStatus: (projectId: string, coverImage: string) => Promise<void>;
};

export const CreateProjectForm = observer(function CreateProjectForm(props: TCreateProjectFormProps) {
  const { setToFavorite, workspaceSlug, data, onClose, handleNextStep, updateCoverImageStatus } = props;
  // store
  const { t } = useTranslation();
  const { addProjectToFavorites, createProject, updateProject } = useProject();
  // states
  const [shouldAutoSyncIdentifier, setShouldAutoSyncIdentifier] = useState(true);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, TCustomFieldValue>>({});
  const { getBoardById } = useBoard();
  const { fetchBoardProjectFormLayout, getBoardCustomFields } = useBoardCustomField();
  const boardFieldService = useMemo(() => new BoardCustomFieldService(), []);
  // form info
  const methods = useForm<TProject>({
    defaultValues: {
      ...getProjectFormValues(),
      ...(ENABLE_WORKSPACE_BOARDS ? { board_id: "" } : {}),
      ...data,
    },
    reValidateMode: "onChange",
  });
  const { handleSubmit, reset, setValue, watch, setError, trigger } = methods;
  const { isMobile } = usePlatformOS();
  const boardId = watch("board_id");
  const board = boardId ? getBoardById(boardId) : undefined;
  const presetBoardId = data?.board_id;

  const { data: formLayoutData } = useSWR(
    workspaceSlug && board?.slug ? `BOARD_PROJECT_FORM_CREATE_${workspaceSlug}_${board.slug}` : null,
    () => fetchBoardProjectFormLayout(workspaceSlug, board!.slug),
    { revalidateIfStale: false, revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const useBoardLayout = Boolean(formLayoutData?.layout?.length);
  const boardCustomFieldsLite = useMemo(() => {
    if (!board?.slug) return [];
    return getBoardCustomFields(workspaceSlug, board.slug)
      .filter((f) => f.custom_field_id)
      .map((f) => ({
        id: f.custom_field_id!,
        name: f.name,
        key: f.key,
        description: f.description,
        field_type: f.field_type,
        settings: f.settings,
      }));
  }, [board?.slug, getBoardCustomFields, workspaceSlug, formLayoutData]);
  const handleAddToFavorites = (projectId: string) => {
    if (!workspaceSlug) return;

    addProjectToFavorites(workspaceSlug.toString(), projectId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("failed_to_remove_project_from_favorites"),
      });
    });
  };

  const onSubmit = async (formData: Partial<TProject>) => {
    if (useBoardLayout && formLayoutData?.layout) {
      const validation = validateProjectLayoutRequired({
        layout: formLayoutData.layout,
        formData,
        customFieldValues,
        skipSystemKeys: ["name", "identifier"],
        requiredMessage: t("field_is_required"),
      });
      if (!validation.ok) {
        validation.fieldErrors.forEach(({ name, message }) => setError(name, { type: "manual", message }));
        await trigger(validation.fieldErrors.map(({ name }) => name));
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: validation.missingCustom
            ? t("boards.settings.project_schema.required_custom_missing")
            : t("boards.settings.project_schema.required_fields_missing"),
        });
        return;
      }
    }

    // Upper case identifier
    formData.identifier = formData.identifier?.toUpperCase();
    const coverImage = formData.cover_image_url;
    let uploadedAssetUrl: string | null = null;

    if (coverImage) {
      const imageType = getCoverImageType(coverImage);

      if (imageType === "local_static") {
        try {
          uploadedAssetUrl = await uploadCoverImage(coverImage, {
            workspaceSlug: workspaceSlug.toString(),
            entityIdentifier: "",
            entityType: EFileAssetType.PROJECT_COVER,
            isUserAsset: false,
          });
        } catch (error) {
          console.error("Error uploading cover image:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: error instanceof Error ? error.message : "Failed to upload cover image",
          });
          return Promise.reject(error);
        }
      } else {
        formData.cover_image = coverImage;
        formData.cover_image_asset = null;
      }
    }

    return createProject(workspaceSlug.toString(), formData)
      .then(async (res) => {
        if (uploadedAssetUrl) {
          await updateCoverImageStatus(res.id, uploadedAssetUrl);
          await updateProject(workspaceSlug.toString(), res.id, { cover_image_url: uploadedAssetUrl });
        } else if (coverImage && coverImage.startsWith("http")) {
          await updateCoverImageStatus(res.id, coverImage);
          await updateProject(workspaceSlug.toString(), res.id, { cover_image_url: coverImage });
        }
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("project_created_successfully"),
        });

        if (useBoardLayout && Object.keys(customFieldValues).length > 0) {
          await boardFieldService.saveProjectCustomFieldValues(
            workspaceSlug,
            res.id,
            Object.entries(customFieldValues).map(([custom_field_id, value]) => ({
              custom_field_id,
              value,
            }))
          );
        }

        if (setToFavorite) {
          handleAddToFavorites(res.id);
        }
        handleNextStep(res.id);
      })
      .catch((err) => {
        try {
          // Handle the new error format where codes are nested in arrays under field names
          const errorData = err?.data ?? {};

          const nameError = errorData.name?.includes("PROJECT_NAME_ALREADY_EXIST");
          const identifierError = errorData?.identifier?.includes("PROJECT_IDENTIFIER_ALREADY_EXIST");
          const boardError = errorData.board_id?.includes("BOARD_ID_REQUIRED");

          if (nameError || identifierError || boardError) {
            if (nameError) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("toast.error"),
                message: t("project_name_already_taken"),
              });
            }

            if (identifierError) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("toast.error"),
                message: t("project_identifier_already_taken"),
              });
            }

            if (boardError) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("toast.error"),
                message: t("boards.board_required"),
              });
            }
          } else {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("toast.error"),
              message: t("something_went_wrong"),
            });
          }
        } catch (error) {
          // Fallback error handling if the error processing fails
          console.error("Error processing API error:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("something_went_wrong"),
          });
        }
      });
  };

  const handleClose = () => {
    onClose();
    setShouldAutoSyncIdentifier(true);
    setTimeout(() => {
      reset();
    }, 300);
  };

  return (
    <FormProvider {...methods}>
      <ProjectCreateHeader handleClose={handleClose} isMobile={isMobile} />

      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          void trigger(Object.keys(errors) as (keyof TProject)[]);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("boards.settings.project_schema.required_fields_missing"),
          });
        })}
        className="px-3"
      >
        <div className="mt-9 space-y-6 pb-5">
          <ProjectCommonAttributes
            setValue={setValue}
            isMobile={isMobile}
            shouldAutoSyncIdentifier={shouldAutoSyncIdentifier}
            setShouldAutoSyncIdentifier={setShouldAutoSyncIdentifier}
            hideDescription={useBoardLayout}
            showRequiredLabels={useBoardLayout}
          />
          {ENABLE_WORKSPACE_BOARDS && !presetBoardId && <BoardSelectField />}
          {useBoardLayout && formLayoutData?.layout ? (
            <BoardProjectDynamicFields
              layout={formLayoutData.layout}
              workspaceSlug={workspaceSlug}
              mode="create"
              omitPinnedOnCreate
              customFieldValues={customFieldValues}
              onCustomFieldChange={(id, val) =>
                setCustomFieldValues((prev) => ({ ...prev, [id]: val }))
              }
              projectCustomFields={boardCustomFieldsLite}
            />
          ) : (
            <ProjectAttributes isMobile={isMobile} />
          )}
        </div>
        <ProjectCreateButtons handleClose={handleClose} />
      </form>
    </FormProvider>
  );
});
