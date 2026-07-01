import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Triangle } from "lucide-react";
// plane types
import { useTranslation } from "@operoz/i18n";
import { EEstimateSystem } from "@operoz/types";
import type { TIssue } from "@operoz/types";
import { Spinner } from "@operoz/ui";
import { convertMinutesToHoursMinutesString } from "@operoz/utils";
// hooks
import { useEstimate, useProjectEstimates } from "@/hooks/store/estimates";
// local imports
import { PowerKModalCommandItem } from "../../../modal/command-item";

type Props = {
  handleSelect: (estimatePointId: string | null) => void;
  workItemDetails: TIssue;
};

export const PowerKWorkItemEstimatesMenu = observer(function PowerKWorkItemEstimatesMenu(props: Props) {
  const { handleSelect, workItemDetails } = props;
  // store hooks
  const { currentActiveEstimateIdByProjectId, getEstimateById } = useProjectEstimates();
  const currentActiveEstimateId = workItemDetails.project_id
    ? currentActiveEstimateIdByProjectId(workItemDetails.project_id)
    : undefined;
  const { estimatePointIds, estimatePointById } = useEstimate(currentActiveEstimateId);
  // derived values
  const currentActiveEstimate = currentActiveEstimateId ? getEstimateById(currentActiveEstimateId) : undefined;
  // translation
  const { t } = useTranslation();

  if (!estimatePointIds) return <Spinner />;

  return (
    <Command.Group>
      <PowerKModalCommandItem
        icon={Triangle}
        label={t("project_settings.estimates.no_estimate")}
        isSelected={workItemDetails.estimate_point === null}
        onSelect={() => handleSelect(null)}
      />
      {estimatePointIds.length > 0 ? (
        estimatePointIds.map((estimatePointId) => {
          const estimatePoint = estimatePointById(estimatePointId);
          if (!estimatePoint) return null;

          return (
            <PowerKModalCommandItem
              key={estimatePoint.id}
              icon={Triangle}
              label={
                currentActiveEstimate?.type === EEstimateSystem.TIME
                  ? convertMinutesToHoursMinutesString(Number(estimatePoint.value))
                  : estimatePoint.value
              }
              isSelected={workItemDetails.estimate_point === estimatePoint.id}
              onSelect={() => handleSelect(estimatePoint.id ?? null)}
            />
          );
        })
      ) : (
        <div className="text-center">No estimate found</div>
      )}
    </Command.Group>
  );
});
