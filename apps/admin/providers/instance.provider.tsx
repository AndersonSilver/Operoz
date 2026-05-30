import { useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// hooks
import { useInstance } from "@/hooks/store";

export const InstanceProvider = observer(function InstanceProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const { fetchInstanceInfo } = useInstance();
  // Stable fetcher: inline arrows change every render; observer re-renders on store updates → SWR refetch storm.
  const fetchInstanceDetails = useCallback(() => fetchInstanceInfo(), [fetchInstanceInfo]);

  useSWR("INSTANCE_DETAILS", fetchInstanceDetails, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    errorRetryCount: 0,
    shouldRetryOnError: false,
    dedupingInterval: 5000,
  });

  return <>{children}</>;
});
