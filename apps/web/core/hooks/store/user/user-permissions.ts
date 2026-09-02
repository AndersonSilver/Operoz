import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// operoz web imports
import type { IUserPermissionStore } from "@/operoz-web/store/user/permission.store";

export const useUserPermissions = (): IUserPermissionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useUserPermissions must be used within StoreProvider");

  return context.user.permission;
};
