import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IAlertStore } from "@/store/notifications/alert.store";

export function useAlertStore(): IAlertStore {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAlertStore must be used within StoreProvider");
  return context.alertStore;
}
