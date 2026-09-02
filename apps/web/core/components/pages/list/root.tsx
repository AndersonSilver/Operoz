import { observer } from "mobx-react";
// types
import type { TPageNavigationTabs } from "@operoz/types";
// components
import { ListLayout } from "@/components/core/list";
// operoz web hooks
import type { EPageStoreType } from "@/operoz-web/hooks/store";
import { usePageStore } from "@/operoz-web/hooks/store";
// local imports
import { PageListBlock } from "./block";

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

export const PagesListRoot = observer(function PagesListRoot(props: TPagesListRoot) {
  const { pageType, storeType } = props;
  // store hooks
  const { getCurrentProjectFilteredPageIdsByTab } = usePageStore(storeType);
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIdsByTab(pageType);

  if (!filteredPageIds) return <></>;
  return (
    <ListLayout>
      {filteredPageIds.map((pageId) => (
        <PageListBlock key={pageId} pageId={pageId} storeType={storeType} />
      ))}
    </ListLayout>
  );
});
