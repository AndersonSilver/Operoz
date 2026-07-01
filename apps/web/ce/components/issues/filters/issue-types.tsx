import { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useParams } from "react-router";
import { useTranslation } from "@operoz/i18n";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import { Loader } from "@operoz/ui";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
  projectId?: string;
};

export const FilterIssueTypes = observer(function FilterIssueTypes(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery, projectId } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { fetchProjectIssueTypes, getProjectIssueTypes } = useBoardIssueType();
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `FILTER_PROJECT_ISSUE_TYPES_${workspaceSlug}_${projectId}` : null,
    () => fetchProjectIssueTypes(workspaceSlug!.toString(), projectId!.toString()),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueTypes = projectId ? getProjectIssueTypes(projectId) : [];
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filtered = issueTypes.filter((type) => type.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return sortBy(filtered, [(type) => !(appliedFilters ?? []).includes(type.id), (type) => type.name.toLowerCase()]);
  }, [issueTypes, searchQuery, appliedFilters]);

  if (!projectId) return null;

  return (
    <>
      <FilterHeader
        title={`${t("issue.label")}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {isLoading ? (
            <Loader className="p-4">
              <Loader.Item height="24px" />
            </Loader>
          ) : sortedOptions.length > 0 ? (
            <>
              {sortedOptions.slice(0, itemsToRender).map((type) => (
                <FilterOption
                  key={type.id}
                  isChecked={appliedFilters?.includes(type.id) ?? false}
                  onClick={() => handleUpdate(type.id)}
                  icon={
                    <span className="grid size-4 place-items-center">
                      <Logo logo={type.logo_props} size={14} />
                    </span>
                  }
                  title={type.name}
                />
              ))}
              {sortedOptions.length > 5 && (
                <button
                  type="button"
                  className="ml-8 text-11 font-medium text-accent-primary"
                  onClick={() => setItemsToRender(itemsToRender === sortedOptions.length ? 5 : sortedOptions.length)}
                >
                  {itemsToRender === sortedOptions.length ? t("show_less") : "View all"}
                </button>
              )}
            </>
          ) : (
            <p className="px-4 py-2 text-11 text-tertiary italic">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
