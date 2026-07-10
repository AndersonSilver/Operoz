import { API_BASE_URL } from "@operoz/constants";
import type {
  TAlertLogFilters,
  TAlertLogPaginated,
  TAlertRule,
  TAlertRulesPayload,
  TConnectAccountPayload,
  TGoogleCalendarOAuthStart,
  TUserAlertPreferences,
  TUserExternalAccount,
  TDiscordOAuthStart,
} from "@operoz/types";
import { APIService } from "../api.service";

export class AlertService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async listRules(workspaceSlug: string): Promise<TAlertRule[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/alert-rules/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createRule(workspaceSlug: string, data: TAlertRulesPayload): Promise<TAlertRule> {
    return this.post(`/api/workspaces/${workspaceSlug}/alert-rules/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateRule(workspaceSlug: string, ruleId: string, data: TAlertRulesPayload): Promise<TAlertRule> {
    return this.patch(`/api/workspaces/${workspaceSlug}/alert-rules/${ruleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteRule(workspaceSlug: string, ruleId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/alert-rules/${ruleId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPreferences(workspaceSlug: string): Promise<TUserAlertPreferences> {
    return this.get(`/api/workspaces/${workspaceSlug}/me/alert-preferences/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePreferences(workspaceSlug: string, data: Partial<TUserAlertPreferences>): Promise<TUserAlertPreferences> {
    return this.patch(`/api/workspaces/${workspaceSlug}/me/alert-preferences/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listExternalAccounts(workspaceSlug: string): Promise<TUserExternalAccount[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/me/external-accounts/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async linkExternalAccount(workspaceSlug: string, data: TConnectAccountPayload): Promise<TUserExternalAccount> {
    return this.post(`/api/workspaces/${workspaceSlug}/me/external-accounts/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unlinkExternalAccount(workspaceSlug: string, provider: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/me/external-accounts/${provider}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listLogs(workspaceSlug: string, filters?: TAlertLogFilters): Promise<TAlertLogPaginated> {
    return this.get(`/api/workspaces/${workspaceSlug}/alert-logs/`, { params: filters })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async startGoogleCalendarOAuth(workspaceSlug: string): Promise<TGoogleCalendarOAuthStart> {
    return this.get(`/api/workspaces/${workspaceSlug}/integrations/google-calendar/auth/start/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async disconnectGoogleCalendar(workspaceSlug: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/integrations/google-calendar/disconnect/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async startDiscordOAuth(workspaceSlug: string): Promise<TDiscordOAuthStart> {
    return this.get(`/api/workspaces/${workspaceSlug}/integrations/discord/auth/start/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async disconnectDiscord(workspaceSlug: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/integrations/discord/disconnect/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
