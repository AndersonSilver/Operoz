import { STATE_GROUPS } from "@operoz/constants";
import type { TBoardMetaStateDistribution, TStateGroups } from "@operoz/types";

const STATE_GROUP_ORDER: TStateGroups[] = ["backlog", "unstarted", "started", "completed", "cancelled"];

export type AggregatedBoardStateGroup = {
  group: TStateGroups;
  count: number;
  color: string;
};

export function aggregateBoardStateDistributionByGroup(
  distribution: TBoardMetaStateDistribution[]
): AggregatedBoardStateGroup[] {
  const totals = new Map<TStateGroups, number>();

  for (const row of distribution) {
    const group = (row.state_group || "unstarted") as TStateGroups;
    if (!(group in STATE_GROUPS)) continue;
    totals.set(group, (totals.get(group) ?? 0) + row.count);
  }

  return STATE_GROUP_ORDER.filter((group) => (totals.get(group) ?? 0) > 0).map((group) => ({
    group,
    count: totals.get(group)!,
    color: STATE_GROUPS[group].color,
  }));
}
