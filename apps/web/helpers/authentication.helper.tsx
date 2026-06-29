import { EAuthErrorCodes } from "@operis/constants";

export {
  EAuthPageTypes as EPageTypes,
  EAuthModes,
  EAuthSteps,
  EErrorAlertType,
  EAuthErrorCodes as EAuthenticationErrorCodes,
} from "@operis/constants";
export type { TAuthErrorInfo } from "@operis/constants";
export { authErrorHandler } from "@operis/utils";

export const passwordErrors = [EAuthErrorCodes.PASSWORD_TOO_WEAK, EAuthErrorCodes.INVALID_NEW_PASSWORD];
