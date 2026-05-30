/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// hooks
import { useInstance, useTheme, useUser } from "@/hooks/store";

export const UserProvider = observer(function UserProvider({ children }: React.PropsWithChildren) {
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  const { currentUser, fetchCurrentUser, isUserLoggedIn } = useUser();
  const { fetchInstanceAdmins } = useInstance();

  const loadCurrentUser = useCallback(() => fetchCurrentUser(), [fetchCurrentUser]);
  useSWR("CURRENT_USER", loadCurrentUser, {
    shouldRetryOnError: false,
    errorRetryCount: 0,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  });

  const loadInstanceAdmins = useCallback(() => fetchInstanceAdmins(), [fetchInstanceAdmins]);
  useSWR(isUserLoggedIn === true ? "INSTANCE_ADMINS" : null, loadInstanceAdmins, {
    shouldRetryOnError: false,
    errorRetryCount: 0,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  });

  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("god_mode_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (isSidebarCollapsed === undefined && localBoolValue != isSidebarCollapsed) toggleSidebar(localBoolValue);
  }, [isSidebarCollapsed, currentUser, toggleSidebar]);

  return <>{children}</>;
});
