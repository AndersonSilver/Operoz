import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IAssistantStore } from "@/store/assistant/assistant.store";

export const useAssistant = (): IAssistantStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAssistant must be used within StoreProvider");
  return context.assistantStore;
};
