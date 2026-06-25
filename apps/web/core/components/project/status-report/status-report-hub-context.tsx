import { createContext, useContext, type ReactNode } from "react";

export type OpenCreateModalOptions = {
  moduleId?: string;
  moduleIds?: string[];
  periodStart?: string;
  periodEnd?: string;
};

type StatusReportHubContextValue = {
  openCreateModal: (options?: OpenCreateModalOptions) => void;
};

const StatusReportHubContext = createContext<StatusReportHubContextValue | null>(null);

export function StatusReportHubProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: StatusReportHubContextValue;
}) {
  return <StatusReportHubContext.Provider value={value}>{children}</StatusReportHubContext.Provider>;
}

export function useStatusReportHub() {
  return useContext(StatusReportHubContext);
}
