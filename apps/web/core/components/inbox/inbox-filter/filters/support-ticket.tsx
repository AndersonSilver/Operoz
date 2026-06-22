import { useState } from "react";
import { observer } from "mobx-react";
import { EInboxIssueSource } from "@operis/types";
import { useTranslation } from "@operis/i18n";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { getInboxSourceLabelKey } from "@/utils/support-ticket";

const SOURCE_OPTIONS: EInboxIssueSource[] = [
  EInboxIssueSource.IN_APP,
  EInboxIssueSource.PUBLIC_FORM,
  EInboxIssueSource.FORMS,
  EInboxIssueSource.EMAIL,
];

type Props = {
  searchQuery: string;
};

export const FilterSupportTicket = observer(function FilterSupportTicket({ searchQuery }: Props) {
  const { t } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const sourceValues = inboxFilters?.source ?? [];
  const slaActive = inboxFilters?.sla_breached?.includes("true") ?? false;
  const attachmentActive = inboxFilters?.has_attachment?.includes("true") ?? false;
  const appliedCount = sourceValues.length + (slaActive ? 1 : 0) + (attachmentActive ? 1 : 0);

  const toggleSource = (value: string) => {
    const next = sourceValues.includes(value)
      ? sourceValues.filter((item) => item !== value)
      : [...sourceValues, value];
    handleInboxIssueFilters("source", next);
  };

  const toggleBoolean = (key: "sla_breached" | "has_attachment", active: boolean) => {
    handleInboxIssueFilters(key, active ? [] : ["true"]);
  };

  const showSection =
    t("inbox_issue.filters.source").toLowerCase().includes(searchQuery.toLowerCase()) ||
    t("inbox_issue.filters.sla_breached").toLowerCase().includes(searchQuery.toLowerCase()) ||
    t("inbox_issue.filters.has_attachment").toLowerCase().includes(searchQuery.toLowerCase()) ||
    searchQuery === "";

  if (!showSection) return null;

  return (
    <>
      <FilterHeader
        title={`${t("inbox_issue.label")}${appliedCount > 0 ? ` (${appliedCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {SOURCE_OPTIONS.filter((source) =>
            t(getInboxSourceLabelKey(source)).toLowerCase().includes(searchQuery.toLowerCase())
          ).map((source) => (
            <FilterOption
              key={source}
              isChecked={sourceValues.includes(source)}
              title={t(getInboxSourceLabelKey(source))}
              onClick={() => toggleSource(source)}
            />
          ))}
          {(searchQuery === "" ||
            t("inbox_issue.filters.sla_breached").toLowerCase().includes(searchQuery.toLowerCase())) && (
            <FilterOption
              isChecked={slaActive}
              title={t("inbox_issue.filters.sla_breached")}
              onClick={() => toggleBoolean("sla_breached", slaActive)}
            />
          )}
          {(searchQuery === "" ||
            t("inbox_issue.filters.has_attachment").toLowerCase().includes(searchQuery.toLowerCase())) && (
            <FilterOption
              isChecked={attachmentActive}
              title={t("inbox_issue.filters.has_attachment")}
              onClick={() => toggleBoolean("has_attachment", attachmentActive)}
            />
          )}
        </div>
      )}
    </>
  );
});
