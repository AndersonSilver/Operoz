import { STATE_GROUPS } from "@operoz/constants";
import type { IState } from "@operoz/types";

export const sortStates = (states: IState[]) => {
  if (!states || states.length === 0) return;

  return states.sort((stateA, stateB) => {
    if (stateA.group === stateB.group) {
      return stateA.sequence - stateB.sequence;
    }
    return Object.keys(STATE_GROUPS).indexOf(stateA.group) - Object.keys(STATE_GROUPS).indexOf(stateB.group);
  });
};
