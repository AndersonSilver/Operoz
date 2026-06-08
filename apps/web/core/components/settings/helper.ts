import { GROUPED_WORKSPACE_SETTINGS, PROJECT_SETTINGS_FLAT_MAP } from "@operis/constants";
import { BOARD_SETTINGS_FLAT } from "@/constants/board-settings";

const hrefToLabelMap = (options: Record<string, Array<{ href: string; i18n_label: string; [key: string]: any }>>) =>
  Object.values(options)
    .flat()
    .reduce(
      (acc, setting) => {
        acc[setting.href] = setting.i18n_label;
        return acc;
      },
      {} as Record<string, string>
    );

const workspaceHrefToLabelMap = hrefToLabelMap(GROUPED_WORKSPACE_SETTINGS);

const projectHrefToLabelMap = PROJECT_SETTINGS_FLAT_MAP.reduce(
  (acc, setting) => {
    acc[setting.href] = setting.i18n_label;
    return acc;
  },
  {} as Record<string, string>
);

export const pathnameToAccessKey = (pathname: string) => {
  const pathArray = pathname.replace(/^\/|\/$/g, "").split("/"); // Regex removes leading and trailing slashes
  const workspaceSlug = pathArray[0];
  const accessKey = pathArray.slice(1, 3).join("/");
  return { workspaceSlug, accessKey: `/${accessKey}` || "" };
};

export const getWorkspaceActivePath = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  const settingsIndex = parts.indexOf("settings");
  if (settingsIndex === -1) return null;
  const subPath = "/" + parts.slice(settingsIndex, settingsIndex + 2).join("/");
  return workspaceHrefToLabelMap[subPath];
};

export const getProjectActivePath = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  const settingsIndex = parts.indexOf("settings");
  if (settingsIndex === -1) return null;
  const subPath = parts.slice(settingsIndex + 3, settingsIndex + 4).join("/");
  return subPath ? projectHrefToLabelMap["/" + subPath] : projectHrefToLabelMap[subPath];
};

const boardSettingsHrefToLabelMap = BOARD_SETTINGS_FLAT.reduce(
  (acc, item) => {
    acc[item.href || "/"] = item.i18n_label;
    return acc;
  },
  {} as Record<string, string>
);

/** `/{ws}/settings/boards/{boardSlug}/…` — esconder sidebar do workspace. */
export const isBoardDetailSettingsPath = (pathname: string) => /\/settings\/boards\/[^/]+/.test(pathname);

export const isProjectDetailSettingsPath = (pathname: string) => /\/settings\/projects\/[^/]+/.test(pathname);

export const isWorkspaceSettingsNavPath = (pathname: string) =>
  /\/settings(\/|$)/.test(pathname) &&
  !isBoardDetailSettingsPath(pathname) &&
  !isProjectDetailSettingsPath(pathname);

export const isNotificationsPath = (pathname: string, workspaceSlug?: string) =>
  Boolean(workspaceSlug && pathname.includes(`/${workspaceSlug}/notifications`));

/** Chave de persistência da sidebar auxiliar (settings, inbox, etc.). */
export function getAuxiliarySidebarStorageKey(pathname: string, workspaceSlug?: string): string | null {
  if (isBoardDetailSettingsPath(pathname)) return "board_settings_sidebar_pinned";
  if (isProjectDetailSettingsPath(pathname)) {
    const match = pathname.match(/\/settings\/projects\/([^/]+)/);
    return match ? `project_settings_sidebar_pinned_${match[1]}` : null;
  }
  if (isWorkspaceSettingsNavPath(pathname)) return "workspace_settings_sidebar_pinned";
  if (isNotificationsPath(pathname, workspaceSlug)) return "inbox_sidebar_pinned";
  return null;
}

/** Active sidebar label for `/{ws}/settings/boards/{boardSlug}/…` */
export const getBoardActivePath = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  const boardsIndex = parts.indexOf("boards");
  if (boardsIndex === -1 || parts[boardsIndex - 1] !== "settings") return null;
  const tail = parts.slice(boardsIndex + 2).join("/");
  if (!tail) return boardSettingsHrefToLabelMap["/"];
  const segments = tail.split("/");
  for (let i = segments.length; i > 0; i--) {
    const candidate = "/" + segments.slice(0, i).join("/");
    if (boardSettingsHrefToLabelMap[candidate]) return boardSettingsHrefToLabelMap[candidate];
  }
  return null;
};
