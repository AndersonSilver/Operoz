import type { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@operoz/types";

export type TEstimatePointDelete = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  estimatePointId: string;
  estimatePoints: TEstimatePointsObject[];
  callback: () => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  handleEstimatePointError?: (newValue: string, message: string | undefined, mode?: "add" | "delete") => void;
  estimateSystem: TEstimateSystemKeys;
};

export function EstimatePointDelete(_props: TEstimatePointDelete) {
  return <></>;
}
