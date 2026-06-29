export { EAuthModes, EAuthSteps } from "@operis/constants";

export interface ICsrfTokenData {
  csrf_token: string;
}

// email check types starts
export interface IEmailCheckData {
  email: string;
}

export interface IEmailCheckResponse {
  status: "MAGIC_CODE" | "CREDENTIAL";
  is_password_autoset: boolean;
  existing: boolean;
}
// email check types ends
