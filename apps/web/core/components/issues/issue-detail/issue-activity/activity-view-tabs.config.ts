export enum EActivityViewTab {
  ALL = "ALL",
  COMMENTS = "COMMENTS",
  HISTORY = "HISTORY",
}

export const DEFAULT_ACTIVITY_VIEW_TAB = EActivityViewTab.COMMENTS;

export const ACTIVITY_VIEW_TAB_OPTIONS: EActivityViewTab[] = [
  EActivityViewTab.ALL,
  EActivityViewTab.COMMENTS,
  EActivityViewTab.HISTORY,
];

export const ACTIVITY_VIEW_TAB_I18N: Record<EActivityViewTab, string> = {
  [EActivityViewTab.ALL]: "issue.activity.tabs.all",
  [EActivityViewTab.COMMENTS]: "issue.activity.tabs.comments",
  [EActivityViewTab.HISTORY]: "issue.activity.tabs.history",
};
