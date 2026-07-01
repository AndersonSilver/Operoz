import { STATE_GROUPS } from "@operoz/constants";
import type { IState, TStateGroups } from "@operoz/types";

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

/** Localizes workflow transition labels that embed default state names (e.g. "→ Done"). */
export function getLocalizedTransitionName(
  transitionName: string,
  toStateName: string,
  toStateGroup: TStateGroups,
  t: TranslateFn
): string {
  const arrowMatch = transitionName.match(/^→\s*(.+)$/);
  if (arrowMatch) {
    const embeddedName = arrowMatch[1];
    const localizedEmbedded = getLocalizedStateName({ name: embeddedName, group: toStateGroup }, t);
    return `→ ${localizedEmbedded}`;
  }

  if (transitionName === toStateName) {
    return getLocalizedStateName({ name: toStateName, group: toStateGroup }, t);
  }

  return getLocalizedStateName({ name: transitionName, group: toStateGroup }, t);
}
