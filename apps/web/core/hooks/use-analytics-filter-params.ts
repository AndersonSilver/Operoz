import { useMemo } from "react";
import type { TAnalyticsFilterParams } from "@operis/types";
import { useAnalytics } from "@/hooks/store/use-analytics";

export function useAnalyticsFilterParams(extra?: Record<string, unknown>) {
  const { selectedProjects, selectedBoardId, selectedCycle, selectedModule, isEpic } = useAnalytics();

  const params = useMemo((): TAnalyticsFilterParams & Record<string, unknown> => {
    const result: TAnalyticsFilterParams & Record<string, unknown> = { ...extra };

    if (selectedBoardId) {
      result.board_id = selectedBoardId;
    } else if (selectedProjects.length > 0) {
      result.project_ids = selectedProjects.join(",");
    }

    if (selectedCycle) result.cycle_id = selectedCycle;
    if (selectedModule) result.module_id = selectedModule;
    if (isEpic) result.epic = true;

    return result;
  }, [extra, selectedBoardId, selectedProjects, selectedCycle, selectedModule, isEpic]);

  const cacheKey = useMemo(
    () =>
      [
        selectedBoardId ?? "",
        selectedProjects.join(","),
        selectedCycle,
        selectedModule,
        isEpic ? "epic" : "",
        JSON.stringify(extra ?? {}),
      ].join("-"),
    [selectedBoardId, selectedProjects, selectedCycle, selectedModule, isEpic, extra]
  );

  return { params, cacheKey };
}
