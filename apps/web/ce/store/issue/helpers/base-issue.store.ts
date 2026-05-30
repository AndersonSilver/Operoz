import type { TIssue } from "@operis/types";
import { getIssueIds } from "@/store/issue/helpers/base-issues-utils";

export const workItemSortWithOrderByExtended = (array: TIssue[], _key?: string) => getIssueIds(array);
