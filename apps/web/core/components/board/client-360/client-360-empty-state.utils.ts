export type Client360EmptyScenario = "forbidden" | "api_error" | "no_projects" | "guest_no_clients" | "filtered_empty";

type ResolveParams = {
  error: unknown;
  allClientsCount: number;
  filteredClientsCount: number;
  hasActiveFilters: boolean;
  isGuest: boolean;
};

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as { status?: number }).status;
  return typeof status === "number" ? status : undefined;
}

export function resolveClient360EmptyScenario({
  error,
  allClientsCount,
  filteredClientsCount,
  hasActiveFilters,
  isGuest,
}: ResolveParams): Client360EmptyScenario | null {
  if (filteredClientsCount > 0) return null;

  if (error) {
    const status = getErrorStatus(error);
    if (status === 403 || status === 401) return "forbidden";
    return "api_error";
  }

  if (allClientsCount === 0) {
    return isGuest ? "guest_no_clients" : "no_projects";
  }

  if (hasActiveFilters) return "filtered_empty";

  return null;
}

const ONBOARDING_STORAGE_KEY = "client360_onboarding_dismissed";

export function isClient360OnboardingDismissed(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${workspaceSlug}`) === "1";
  } catch {
    return true;
  }
}

export function dismissClient360Onboarding(workspaceSlug: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${workspaceSlug}`, "1");
  } catch {
    /* ignore */
  }
}
