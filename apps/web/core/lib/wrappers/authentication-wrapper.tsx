import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useSearchParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { EPageTypes } from "@/helpers/authentication.helper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile, useUserSettings } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type TPageType = EPageTypes;

type TAuthenticationWrapper = {
  children: ReactNode;
  pageType?: TPageType;
};

type AuthResolveResult =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "redirect"; to: string; replace?: boolean };

const isValidURL = (url: string): boolean => {
  const disallowedSchemes = /^(https?|ftp):\/\//i;
  return !disallowedSchemes.test(url);
};

export const AuthenticationWrapper = observer(function AuthenticationWrapper(props: TAuthenticationWrapper) {
  const pathname = usePathname();
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next_path");
  const { children, pageType = EPageTypes.AUTHENTICATED } = props;

  const { isLoading: isUserLoading, data: currentUser, fetchCurrentUser } = useUser();
  const { data: currentUserProfile } = useUserProfile();
  const { data: currentUserSettings } = useUserSettings();
  const { loader: workspacesLoader, workspaces } = useWorkspace();

  const { isLoading: isUserSWRLoading } = useSWR("USER_INFORMATION", async () => await fetchCurrentUser(), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const isUserOnboard =
    currentUserProfile?.is_onboarded ||
    (currentUserProfile?.onboarding_step?.profile_complete &&
      currentUserProfile?.onboarding_step?.workspace_create &&
      currentUserProfile?.onboarding_step?.workspace_invite &&
      currentUserProfile?.onboarding_step?.workspace_join) ||
    false;

  const getWorkspaceRedirectionUrl = (): string => {
    let redirectionRoute = "/create-workspace";

    if (nextPath && isValidURL(nextPath.toString())) {
      return nextPath.toString();
    }

    const currentWorkspaceSlug =
      currentUserSettings?.workspace?.last_workspace_slug || currentUserSettings?.workspace?.fallback_workspace_slug;

    const isCurrentWorkspaceValid = Object.values(workspaces || {}).findIndex(
      (workspace) => workspace.slug === currentWorkspaceSlug
    );

    if (isCurrentWorkspaceValid >= 0) redirectionRoute = `/${currentWorkspaceSlug}`;

    return redirectionRoute;
  };

  const outcome = useMemo((): AuthResolveResult => {
    if ((isUserSWRLoading || isUserLoading || workspacesLoader) && !currentUser?.id) {
      return { status: "loading" };
    }

    if (pageType === EPageTypes.PUBLIC) {
      return { status: "ready" };
    }

    if (pageType === EPageTypes.NON_AUTHENTICATED) {
      if (!currentUser?.id) return { status: "ready" };
      if (currentUserProfile?.id && isUserOnboard) {
        return { status: "redirect", to: getWorkspaceRedirectionUrl() };
      }
      return { status: "redirect", to: "/onboarding" };
    }

    if (pageType === EPageTypes.ONBOARDING) {
      if (!currentUser?.id) {
        return { status: "redirect", to: `/${pathname ? `?next_path=${pathname}` : ``}` };
      }
      if (currentUser && currentUserProfile?.id && isUserOnboard) {
        return { status: "redirect", to: getWorkspaceRedirectionUrl(), replace: true };
      }
      return { status: "ready" };
    }

    if (pageType === EPageTypes.SET_PASSWORD) {
      if (!currentUser?.id) {
        return { status: "redirect", to: `/${pathname ? `?next_path=${pathname}` : ``}` };
      }
      if (currentUser && !currentUser?.is_password_autoset && currentUserProfile?.id && isUserOnboard) {
        return { status: "redirect", to: getWorkspaceRedirectionUrl() };
      }
      return { status: "ready" };
    }

    if (pageType === EPageTypes.AUTHENTICATED) {
      if (currentUser?.id) {
        if (currentUserProfile && currentUserProfile?.id && isUserOnboard) {
          return { status: "ready" };
        }
        return { status: "redirect", to: "/onboarding" };
      }
      return { status: "redirect", to: `/${pathname ? `?next_path=${pathname}` : ``}` };
    }

    return { status: "ready" };
  }, [
    isUserSWRLoading,
    isUserLoading,
    workspacesLoader,
    currentUser?.id,
    currentUser?.is_password_autoset,
    currentUserProfile?.id,
    isUserOnboard,
    pageType,
    pathname,
    nextPath,
    workspaces,
    currentUserSettings?.workspace?.last_workspace_slug,
    currentUserSettings?.workspace?.fallback_workspace_slug,
  ]);

  useEffect(() => {
    if (outcome.status !== "redirect") return;
    if (outcome.replace) {
      router.replace(outcome.to);
    } else {
      router.push(outcome.to);
    }
  }, [outcome, router]);

  if (outcome.status === "loading" || outcome.status === "redirect") {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  return <>{children}</>;
});
