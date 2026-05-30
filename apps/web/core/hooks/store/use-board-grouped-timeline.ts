/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { GANTT_TIMELINE_TYPE } from "@plane/types";
import type { IBoardGroupedTimelineStore } from "@/store/timeline/board-grouped-timeline.store";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";

export const useBoardGroupedTimelineStore = (): IBoardGroupedTimelineStore =>
  useTimeLineChart(GANTT_TIMELINE_TYPE.GROUPED) as IBoardGroupedTimelineStore;
