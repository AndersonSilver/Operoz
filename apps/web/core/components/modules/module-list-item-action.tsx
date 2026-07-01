import type { MouseEvent, RefObject } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { SquareUser } from "lucide-react";
import { MODULE_STATUS, EUserPermissions, EUserPermissionsLevel, IS_FAVORITE_MENU_OPEN } from "@operoz/constants";
import { useLocalStorage } from "@operoz/hooks";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setPromiseToast, setToast } from "@operoz/propel/toast";
import type { IModule } from "@operoz/types";
import { FavoriteStar } from "@operoz/ui";
import { cn, renderFormattedPayloadDate, getDate } from "@operoz/utils";
import { ModuleListDateField } from "@/components/modules/module-list-date-field";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleQuickActions } from "@/components/modules";
import { ModuleStatusDropdown } from "@/components/modules/module-status-dropdown";
import { ModuleStageDropdown } from "@/components/modules/module-stage-dropdown";
import { useProjectBoardModuleStages } from "@/hooks/use-project-board-module-stages";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  moduleId: string;
  moduleDetails: IModule;
  parentRef: RefObject<HTMLDivElement | null>;
};

export const ModuleListItemAction = observer(function ModuleListItemAction(props: Props) {
  const { moduleId, moduleDetails, parentRef } = props;
  const { workspaceSlug, projectId } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { addModuleToFavorites, removeModuleFromFavorites, updateModuleDetails } = useModule();
  const { getUserDetails } = useMember();
  const { t } = useTranslation();
  const { setValue: toggleFavoriteMenu, storedValue } = useLocalStorage<boolean>(IS_FAVORITE_MENU_OPEN, false);
  const { stages } = useProjectBoardModuleStages(workspaceSlug?.toString(), projectId?.toString());

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const isDisabled = !isEditingAllowed || !!moduleDetails?.archived_at;

  const startDate = getDate(moduleDetails.start_date);
  const endDate = getDate(moduleDetails.target_date);

  const handleAddToFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const addToFavoritePromise = addModuleToFavorites(workspaceSlug.toString(), projectId.toString(), moduleId).then(
      () => {
        if (!storedValue) toggleFavoriteMenu(true);
      }
    );

    setPromiseToast(addToFavoritePromise, {
      loading: t("project_modules.toast.favorite_add_loading"),
      success: {
        title: t("toast.success"),
        message: () => t("project_modules.toast.favorite_add_success"),
      },
      error: {
        title: t("toast.error"),
        message: () => t("project_modules.toast.favorite_add_error"),
      },
    });
  };

  const handleRemoveFromFavorites = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    const removeFromFavoritePromise = removeModuleFromFavorites(
      workspaceSlug.toString(),
      projectId.toString(),
      moduleId
    );

    setPromiseToast(removeFromFavoritePromise, {
      loading: t("project_modules.toast.favorite_remove_loading"),
      success: {
        title: t("toast.success"),
        message: () => t("project_modules.toast.favorite_remove_success"),
      },
      error: {
        title: t("toast.error"),
        message: () => t("project_modules.toast.favorite_remove_error"),
      },
    });
  };

  const handleModuleDetailsChange = async (payload: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    await updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId, payload)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("project_modules.toast.update_success"),
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: err?.detail ?? t("project_modules.toast.update_error"),
        });
      });
  };

  const moduleLeadDetails = moduleDetails.lead_id ? getUserDetails(moduleDetails.lead_id) : undefined;

  const stopNav = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const startDateDropdown = (
    <ModuleListDateField
      value={moduleDetails.start_date}
      maxDate={endDate ?? undefined}
      disabled={isDisabled}
      placeholder={t("project_modules.list.date_empty")}
      onChange={(val) => {
        handleModuleDetailsChange({
          start_date: val ? renderFormattedPayloadDate(val) : null,
        });
      }}
    />
  );

  const endDateDropdown = (
    <ModuleListDateField
      value={moduleDetails.target_date}
      minDate={startDate ?? undefined}
      disabled={isDisabled}
      placeholder={t("project_modules.list.date_empty")}
      onChange={(val) => {
        handleModuleDetailsChange({
          target_date: val ? renderFormattedPayloadDate(val) : null,
        });
      }}
    />
  );

  const leadDropdown = (
    <MemberDropdown
      value={moduleDetails.lead_id ?? null}
      onChange={(val) => handleModuleDetailsChange({ lead_id: val })}
      projectId={projectId?.toString()}
      multiple={false}
      disabled={isDisabled}
      placeholder={t("lead")}
      placement="bottom-end"
      optionsClassName="z-10"
      icon={SquareUser}
      buttonVariant={moduleDetails.lead_id ? "transparent-without-text" : "border-without-text"}
      buttonClassName={cn(
        "rounded-sm",
        moduleDetails.lead_id ? "px-0 hover:bg-transparent" : "size-7 min-w-7 justify-center border-dashed"
      )}
      buttonContainerClassName="flex justify-center"
      className="h-7"
      showTooltip
      tooltipContent={moduleLeadDetails?.display_name ?? t("project_modules.list.no_lead")}
    />
  );

  return (
    <>
      <div className="hidden min-w-0 lg:contents" onClick={stopNav}>
        <div className="flex w-full min-w-0 lg:col-start-2">{startDateDropdown}</div>
        <div className="flex w-full min-w-0 lg:col-start-3">{endDateDropdown}</div>

        <div className="flex shrink-0 justify-center lg:col-start-4">
          {moduleStatus ? (
            <ModuleStatusDropdown
              isDisabled={isDisabled}
              moduleDetails={moduleDetails}
              handleModuleDetailsChange={handleModuleDetailsChange}
            />
          ) : null}
        </div>

        <div className="flex shrink-0 justify-center lg:col-start-5">
          <ModuleStageDropdown
            isDisabled={isDisabled}
            moduleDetails={moduleDetails}
            stages={stages}
            handleModuleDetailsChange={handleModuleDetailsChange}
          />
        </div>

        <div className="flex shrink-0 justify-center lg:col-start-6">{leadDropdown}</div>

        <div className="flex shrink-0 items-center justify-center gap-1 lg:col-start-7 lg:border-l lg:border-subtle lg:pl-2">
          {isEditingAllowed && !moduleDetails.archived_at ? (
            <FavoriteStar
              onClick={(e) => {
                if (moduleDetails.is_favorite) handleRemoveFromFavorites(e);
                else handleAddToFavorites(e);
              }}
              selected={moduleDetails.is_favorite}
            />
          ) : null}
          {workspaceSlug && projectId ? (
            <ModuleQuickActions
              parentRef={parentRef}
              moduleId={moduleId}
              projectId={projectId.toString()}
              workspaceSlug={workspaceSlug.toString()}
            />
          ) : null}
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 lg:hidden" onClick={stopNav}>
        {startDateDropdown}
        {endDateDropdown}
        {moduleStatus ? (
          <ModuleStatusDropdown
            isDisabled={isDisabled}
            moduleDetails={moduleDetails}
            handleModuleDetailsChange={handleModuleDetailsChange}
          />
        ) : null}
        <ModuleStageDropdown
          isDisabled={isDisabled}
          moduleDetails={moduleDetails}
          stages={stages}
          handleModuleDetailsChange={handleModuleDetailsChange}
        />
        {leadDropdown}
        {isEditingAllowed && !moduleDetails.archived_at ? (
          <FavoriteStar
            onClick={(e) => {
              if (moduleDetails.is_favorite) handleRemoveFromFavorites(e);
              else handleAddToFavorites(e);
            }}
            selected={moduleDetails.is_favorite}
          />
        ) : null}
      </div>
    </>
  );
});
