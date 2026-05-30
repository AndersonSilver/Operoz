import type { MouseEvent, RefObject } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { SquareUser } from "lucide-react";
import { MODULE_STATUS, EUserPermissions, EUserPermissionsLevel, IS_FAVORITE_MENU_OPEN } from "@operis/constants";
import { useLocalStorage } from "@operis/hooks";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setPromiseToast, setToast } from "@operis/propel/toast";
import { Tooltip } from "@operis/propel/tooltip";
import type { IModule } from "@operis/types";
import { FavoriteStar } from "@operis/ui";
import { cn, renderFormattedPayloadDate, getDate } from "@operis/utils";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { ModuleQuickActions } from "@/components/modules";
import { ModuleStatusDropdown } from "@/components/modules/module-status-dropdown";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  moduleId: string;
  moduleDetails: IModule;
  parentRef: RefObject<HTMLDivElement | null>;
};

const dateButtonClass = (isDisabled: boolean, hasDates: boolean) =>
  cn(
    "flex h-7 w-full min-w-0 max-w-[11rem] items-center gap-1.5 truncate rounded-sm border border-subtle bg-layer-2 px-2 text-11 transition-colors",
    isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-strong hover:bg-layer-1",
    hasDates ? "text-secondary" : "text-tertiary"
  );

export const ModuleListItemAction = observer(function ModuleListItemAction(props: Props) {
  const { moduleId, moduleDetails, parentRef } = props;
  const { workspaceSlug, projectId } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { addModuleToFavorites, removeModuleFromFavorites, updateModuleDetails } = useModule();
  const { getUserDetails } = useMember();
  const { t } = useTranslation();
  const { setValue: toggleFavoriteMenu, storedValue } = useLocalStorage<boolean>(IS_FAVORITE_MENU_OPEN, false);

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const isDisabled = !isEditingAllowed || !!moduleDetails?.archived_at;

  const startDate = getDate(moduleDetails.start_date);
  const endDate = getDate(moduleDetails.target_date);
  const hasDates = Boolean(startDate || endDate);

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
      loading: "Adding module to favorites...",
      success: { title: "Success!", message: () => "Module added to favorites." },
      error: { title: "Error!", message: () => "Couldn't add the module to favorites. Please try again." },
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
      loading: "Removing module from favorites...",
      success: { title: "Success!", message: () => "Module removed from favorites." },
      error: { title: "Error!", message: () => "Couldn't remove the module from favorites. Please try again." },
    });
  };

  const handleModuleDetailsChange = async (payload: Partial<IModule>) => {
    if (!workspaceSlug || !projectId) return;

    await updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId, payload)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Module updated successfully.",
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Module could not be updated. Please try again.",
        });
      });
  };

  const moduleLeadDetails = moduleDetails.lead_id ? getUserDetails(moduleDetails.lead_id) : undefined;

  const stopNav = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const dateDropdown = (
    <DateRangeDropdown
      mergeDates
      buttonContainerClassName={dateButtonClass(isDisabled, hasDates)}
      buttonVariant="transparent-with-text"
      className="h-7 w-full min-w-0"
      value={{ from: startDate, to: endDate }}
      onSelect={(val) => {
        handleModuleDetailsChange({
          start_date: val?.from ? renderFormattedPayloadDate(val.from) : null,
          target_date: val?.to ? renderFormattedPayloadDate(val.to) : null,
        });
      }}
      placeholder={{
        from: t("project_modules.list.add_dates"),
        to: "",
      }}
      disabled={isDisabled}
      hideIcon={{ from: true, to: true }}
    />
  );

  return (
    <>
      <div className="hidden min-w-0 lg:contents" onClick={stopNav}>
        <div className="min-w-0 lg:col-start-2">{dateDropdown}</div>

        <div className="flex shrink-0 lg:col-start-3">
          {moduleStatus ? (
            <ModuleStatusDropdown
              isDisabled={isDisabled}
              moduleDetails={moduleDetails}
              handleModuleDetailsChange={handleModuleDetailsChange}
            />
          ) : null}
        </div>

        <div className="flex shrink-0 justify-center lg:col-start-4">
          {moduleLeadDetails ? (
            <ButtonAvatars showTooltip userIds={moduleLeadDetails.id} />
          ) : (
            <Tooltip tooltipContent={t("project_modules.list.no_lead")}>
              <span className="grid size-7 place-items-center rounded-sm border border-dashed border-subtle text-tertiary">
                <SquareUser className="size-3.5" strokeWidth={1.75} />
              </span>
            </Tooltip>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 lg:col-start-5 lg:border-l lg:border-subtle lg:pl-2">
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
        {dateDropdown}
        {moduleStatus ? (
          <ModuleStatusDropdown
            isDisabled={isDisabled}
            moduleDetails={moduleDetails}
            handleModuleDetailsChange={handleModuleDetailsChange}
          />
        ) : null}
        {moduleLeadDetails ? <ButtonAvatars showTooltip={false} userIds={moduleLeadDetails.id} /> : null}
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
