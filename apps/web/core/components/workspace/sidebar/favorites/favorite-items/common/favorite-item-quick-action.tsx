import React, { forwardRef } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal, Star } from "lucide-react";
// plane imports
import { useTranslation } from "@operoz/i18n";
import type { IFavorite } from "@operoz/types";
import { CustomMenu } from "@operoz/ui";
// helpers
import { cn } from "@operoz/utils";

type Props = {
  isMenuActive: boolean;
  favorite: IFavorite;
  onChange: (value: boolean) => void;
  handleRemoveFromFavorites: (favorite: IFavorite) => void;
};

export const FavoriteItemQuickAction = observer(
  forwardRef<HTMLSpanElement, Props>(function FavoriteItemQuickAction(
    { isMenuActive, onChange, handleRemoveFromFavorites, favorite },
    ref
  ) {
    // translation
    const { t } = useTranslation();

    return (
      <CustomMenu
        customButton={
          <span ref={ref} className="grid place-items-center rounded-sm p-0.5 text-placeholder hover:bg-layer-1">
            <MoreHorizontal className="size-4" />
          </span>
        }
        menuButtonOnClick={() => onChange(!isMenuActive)}
        className={cn(
          "pointer-events-none flex-shrink-0 opacity-0 group-hover/project-item:pointer-events-auto group-hover/project-item:opacity-100",
          {
            "pointer-events-auto opacity-100": isMenuActive,
          }
        )}
        customButtonClassName="grid place-items-center"
        placement="bottom-start"
        ariaLabel={t("aria_labels.projects_sidebar.toggle_quick_actions_menu")}
      >
        <CustomMenu.MenuItem onClick={() => handleRemoveFromFavorites(favorite)}>
          <span className="flex items-center justify-start gap-2">
            <Star className="fill-yellow-500 stroke-yellow-500 h-3.5 w-3.5 flex-shrink-0" />
            <span>Remove from favorites</span>
          </span>
        </CustomMenu.MenuItem>
      </CustomMenu>
    );
  })
);
