/**
 * MobX reaction scheduling for React 18 + mobx-react (useSyncExternalStore).
 * See apps/web/core/lib/configure-mobx.ts for rationale.
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
