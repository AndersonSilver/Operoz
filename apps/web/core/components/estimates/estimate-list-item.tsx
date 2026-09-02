import { observer } from "mobx-react";
// operoz imports
import { EEstimateSystem } from "@operoz/constants";
import { convertMinutesToHoursMinutesString } from "@operoz/utils";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
// operoz web imports
import { EstimateListItemButtons } from "@/operoz-web/components/estimates";

type TEstimateListItem = {
  estimateId: string;
  isAdmin: boolean;
  isEstimateEnabled: boolean;
  isEditable: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateListItem = observer(function EstimateListItem(props: TEstimateListItem) {
  const { estimateId } = props;
  // store hooks
  const { estimateById } = useProjectEstimates();
  const { estimatePointIds, estimatePointById } = useEstimate(estimateId);
  const currentEstimate = estimateById(estimateId);
  // derived values
  const estimatePointValues = estimatePointIds?.map((estimatePointId) => {
    const estimatePoint = estimatePointById(estimatePointId);
    if (estimatePoint) return estimatePoint.value;
  });

  if (!currentEstimate) return null;

  return (
    <SettingsBoxedControlItem
      title={currentEstimate.name}
      description={estimatePointValues
        ?.map((estimatePointValue) => {
          if (currentEstimate.type === EEstimateSystem.TIME) {
            return convertMinutesToHoursMinutesString(Number(estimatePointValue));
          }
          return estimatePointValue;
        })
        .join(", ")}
      control={<EstimateListItemButtons {...props} />}
    />
  );
});
