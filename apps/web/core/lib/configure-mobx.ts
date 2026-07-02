/**
 * MobX reaction scheduling for React 18 + mobx-react (useSyncExternalStore).
 *
 * `unstable_batchedUpdates` alone still runs reactions synchronously during
 * `observer` render (`track`), which triggers useSyncExternalStore updates and
 * React's "Cannot update a component while rendering" warning on navigation.
 *
 * Defer with a microtask, then batch React updates.
 */
import { configure } from "mobx";
import { unstable_batchedUpdates } from "react-dom";

configure({
  reactionScheduler: (run) => {
    queueMicrotask(() => {
      unstable_batchedUpdates(run);
    });
  },
});
