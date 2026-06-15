import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane web components
import { PageReviewShareButton } from "@/components/pages/review/page-review-share-modal";
import { PageLockControl } from "@/plane-web/components/pages/header/lock-control";
import { PageMoveControl } from "@/plane-web/components/pages/header/move-control";
import { PageShareControl } from "@/plane-web/components/pages/header/share-control";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageOptionsDropdown } from "../editor/toolbar";
import { PageArchivedBadge } from "./archived-badge";
import { PageCopyLinkControl } from "./copy-link-control";
import { PageFavoriteControl } from "./favorite-control";
import { PageOfflineBadge } from "./offline-badge";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageHeaderActions = observer(function PageHeaderActions(props: Props) {
  const { page, storeType } = props;
  const { workspaceSlug, projectId } = useParams();
  const slug = workspaceSlug?.toString();
  const pid = projectId?.toString();
  const pageId = page.id;

  return (
    <div className="flex items-center gap-1">
      <PageArchivedBadge page={page} />
      <PageOfflineBadge page={page} />
      {slug && pid && pageId ? <PageReviewShareButton workspaceSlug={slug} projectId={pid} pageId={pageId} /> : null}
      <PageLockControl page={page} />
      <PageMoveControl page={page} />
      <PageCopyLinkControl page={page} />
      <PageFavoriteControl page={page} />
      <PageShareControl page={page} storeType={storeType} />
      <PageOptionsDropdown page={page} storeType={storeType} />
    </div>
  );
});
