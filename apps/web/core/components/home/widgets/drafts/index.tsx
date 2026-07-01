import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import type { THomeWidgetProps } from "@operoz/types";
import { WorkspaceDraftService } from "@/services/issue/workspace_draft.service";
import { WidgetSection } from "../shared/widget-section";

const workspaceDraftService = new WorkspaceDraftService();

export const DraftsWidget = observer(function DraftsWidget(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();

  const { data: drafts, isLoading } = useSWR(
    workspaceSlug ? `HOME_DRAFTS_${workspaceSlug}` : null,
    async () => {
      const response = await workspaceDraftService.getIssues(workspaceSlug, { per_page: 5 });
      return response?.results ?? [];
    },
    { revalidateOnFocus: false }
  );

  return (
    <WidgetSection
      title={t("home.drafts.title")}
      action={
        <Link
          href={`/${workspaceSlug}/drafts`}
          className="text-13 font-medium text-accent-primary hover:text-accent-secondary"
        >
          {t("home.drafts.view_all")}
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-layer-2" />
          ))}
        </div>
      ) : drafts && drafts.length > 0 ? (
        <div className="flex flex-col divide-y divide-subtle rounded-lg border border-subtle">
          {drafts.map((draft) => (
            <Link
              key={draft.id}
              href={`/${workspaceSlug}/drafts`}
              className="truncate px-3 py-3 text-13 font-medium text-primary transition-colors hover:bg-layer-1"
            >
              {draft.name || t("home.drafts.unnamed")}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-13 text-tertiary">{t("home.drafts.empty")}</p>
      )}
    </WidgetSection>
  );
});
