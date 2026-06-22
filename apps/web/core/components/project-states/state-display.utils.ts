import { STATE_GROUPS } from "@operis/constants";
import type { IState, TStateGroups } from "@operis/types";

type TranslateFn = (key: string) => string;

export function getLocalizedStateGroupLabel(groupKey: TStateGroups, t: TranslateFn): string {
  return t(`workspace_projects.state.${groupKey}`);
}

export function getLocalizedStateName(state: Pick<IState, "name" | "group">, t: TranslateFn): string {
  const groupDef = STATE_GROUPS[state.group as TStateGroups];
  if (!groupDef) return state.name;

  if (state.name === groupDef.defaultStateName || state.name === groupDef.label) {
    return t(`project_settings.states.default_names.${state.group}`);
  }

  return state.name;
}
