import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildClient360SavedViewPayload,
  client360SavedViewPayloadsEqual,
  createClient360SavedView,
  deleteClient360SavedView,
  loadClient360SavedViewsStore,
  renameClient360SavedView,
  saveClient360SavedViewsStore,
  setClient360DefaultSavedView,
  updateClient360SavedViewPayload,
  type Client360SavedView,
  type Client360SavedViewPayload,
  type Client360SavedViewsStore,
} from "@/components/board/client-360/client-360-saved-views";

type ApplyPayload = (payload: Client360SavedViewPayload) => void;

export function useClient360SavedViews(
  workspaceSlug: string,
  includeBoard: boolean,
  applyPayload: ApplyPayload,
  ready: boolean
) {
  const [store, setStoreState] = useState<Client360SavedViewsStore>(() =>
    loadClient360SavedViewsStore(workspaceSlug, includeBoard)
  );
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const defaultAppliedRef = useRef(false);

  const persist = useCallback(
    (next: Client360SavedViewsStore) => {
      setStoreState(next);
      saveClient360SavedViewsStore(workspaceSlug, next);
    },
    [workspaceSlug]
  );

  useEffect(() => {
    setStoreState(loadClient360SavedViewsStore(workspaceSlug, includeBoard));
    setActiveViewId(null);
    defaultAppliedRef.current = false;
  }, [workspaceSlug, includeBoard]);

  const applyView = useCallback(
    (view: Client360SavedView) => {
      applyPayload(view.payload);
      setActiveViewId(view.id);
    },
    [applyPayload]
  );

  useEffect(() => {
    if (!ready || defaultAppliedRef.current || !store.defaultViewId) return;

    const defaultView = store.views.find((view) => view.id === store.defaultViewId);
    defaultAppliedRef.current = true;
    if (!defaultView) return;

    applyPayload(defaultView.payload);
    setActiveViewId(defaultView.id);
  }, [applyPayload, ready, store.defaultViewId, store.views]);

  const saveCurrentView = useCallback(
    (name: string, payload: Client360SavedViewPayload) => {
      const result = createClient360SavedView(store, name, payload);
      if ("error" in result) return result;
      persist(result.store);
      setActiveViewId(result.view.id);
      return result;
    },
    [persist, store]
  );

  const renameView = useCallback(
    (viewId: string, name: string) => {
      const result = renameClient360SavedView(store, viewId, name);
      if ("error" in result) return result;
      persist(result.store);
      return result;
    },
    [persist, store]
  );

  const deleteView = useCallback(
    (viewId: string) => {
      const next = deleteClient360SavedView(store, viewId);
      persist(next);
      if (activeViewId === viewId) setActiveViewId(null);
    },
    [activeViewId, persist, store]
  );

  const setDefaultView = useCallback(
    (viewId: string | null) => {
      persist(setClient360DefaultSavedView(store, viewId));
    },
    [persist, store]
  );

  const overwriteView = useCallback(
    (viewId: string, payload: Client360SavedViewPayload) => {
      const result = updateClient360SavedViewPayload(store, viewId, payload);
      if ("error" in result) return result;
      persist(result.store);
      setActiveViewId(viewId);
      return result;
    },
    [persist, store]
  );

  const syncActiveView = useCallback(
    (payload: Client360SavedViewPayload) => {
      if (!activeViewId) return;
      const active = store.views.find((view) => view.id === activeViewId);
      if (active && !client360SavedViewPayloadsEqual(active.payload, payload)) {
        setActiveViewId(null);
      }
    },
    [activeViewId, store.views]
  );

  const activeView = useMemo(
    () => store.views.find((view) => view.id === activeViewId) ?? null,
    [activeViewId, store.views]
  );

  return {
    views: store.views,
    defaultViewId: store.defaultViewId,
    activeViewId,
    activeView,
    applyView,
    saveCurrentView,
    renameView,
    deleteView,
    setDefaultView,
    overwriteView,
    syncActiveView,
    buildPayload: (input: Omit<Parameters<typeof buildClient360SavedViewPayload>[0], "includeBoard">) =>
      buildClient360SavedViewPayload({ ...input, includeBoard }),
  };
}
