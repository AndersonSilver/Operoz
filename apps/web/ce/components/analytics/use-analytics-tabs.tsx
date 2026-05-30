import { useMemo } from "react";
import { useTranslation } from "@operis/i18n";
import { getAnalyticsTabs } from "./tabs";

export const useAnalyticsTabs = (_workspaceSlug: string) => {
  const { t } = useTranslation();

  const analyticsTabs = useMemo(() => getAnalyticsTabs(t), [t]);

  return analyticsTabs;
};
