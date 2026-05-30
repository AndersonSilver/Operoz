import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import type { IFavorite, THomeWidgetProps } from "@operis/types";
import { useFavoriteItemDetails } from "@/hooks/use-favorite-item-details";
import { useFavorite } from "@/hooks/store/use-favorite";
import { WidgetSection } from "../shared/widget-section";

const HOME_FAVORITE_ENTITY_TYPES = new Set(["project", "module", "cycle", "view", "page"]);

const FavoriteHomeCard = observer(function FavoriteHomeCard({
  workspaceSlug,
  favorite,
}: {
  workspaceSlug: string;
  favorite: IFavorite;
}) {
  const { itemLink, itemIcon, itemTitle } = useFavoriteItemDetails(workspaceSlug, favorite);

  return (
    <Link
      href={itemLink}
      className="flex items-center gap-3 rounded-lg border border-subtle bg-layer-2 p-3 transition-colors hover:bg-layer-1"
    >
      <span className="grid size-8 place-items-center rounded-md bg-surface-2 [&_svg]:size-4">{itemIcon}</span>
      <span className="truncate text-13 font-medium text-primary">{itemTitle}</span>
    </Link>
  );
});

export const FavoriteProjectsWidget = observer(function FavoriteProjectsWidget(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { fetchFavorite, groupedFavorites } = useFavorite();

  useSWR(workspaceSlug ? `HOME_FAVORITES_${workspaceSlug}` : null, () => fetchFavorite(workspaceSlug), {
    revalidateOnFocus: false,
  });

  const favorites = Object.values(groupedFavorites)
    .filter(
      (fav) =>
        !fav.is_folder &&
        !fav.parent &&
        fav.entity_identifier &&
        HOME_FAVORITE_ENTITY_TYPES.has(fav.entity_type)
    )
    .slice(0, 6);

  return (
    <WidgetSection title={t("home.favorite_projects.title")}>
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {favorites.map((favorite) => (
            <FavoriteHomeCard key={favorite.id} workspaceSlug={workspaceSlug} favorite={favorite} />
          ))}
        </div>
      ) : (
        <p className="text-13 text-tertiary">{t("home.favorite_projects.empty")}</p>
      )}
    </WidgetSection>
  );
});
