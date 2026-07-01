// plane imports
import type { TOAuthConfigs } from "@operoz/types";

export const useExtendedOAuthConfig = (_oauthActionText: string): TOAuthConfigs => ({
  isOAuthEnabled: false,
  oAuthOptions: [],
});
