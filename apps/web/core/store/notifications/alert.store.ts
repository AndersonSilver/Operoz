import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { AlertService } from "@operoz/services";
import type {
  TAlertLog,
  TAlertLogFilters,
  TAlertRule,
  TAlertRulesPayload,
  TConnectAccountPayload,
  TUserAlertPreferences,
  TUserExternalAccount,
} from "@operoz/types";
import type { CoreRootStore } from "../root.store";

export interface IAlertStore {
  alertRules: Map<string, TAlertRule>;
  userPreferences: TUserAlertPreferences | null;
  externalAccounts: Map<string, TUserExternalAccount>;
  alertLogs: TAlertLog[];
  isLoadingRules: boolean;
  isLoadingPreferences: boolean;
  isLoadingAccounts: boolean;
  isLoadingLogs: boolean;
  rulesArray: TAlertRule[];
  fetchAlertRules: (workspaceSlug: string) => Promise<TAlertRule[]>;
  createAlertRule: (workspaceSlug: string, data: TAlertRulesPayload) => Promise<TAlertRule>;
  updateAlertRule: (workspaceSlug: string, ruleId: string, data: TAlertRulesPayload) => Promise<TAlertRule>;
  deleteAlertRule: (workspaceSlug: string, ruleId: string) => Promise<void>;
  toggleAlertRule: (workspaceSlug: string, ruleId: string, enabled: boolean) => Promise<void>;
  fetchPreferences: (workspaceSlug: string) => Promise<TUserAlertPreferences>;
  updatePreferences: (workspaceSlug: string, data: Partial<TUserAlertPreferences>) => Promise<TUserAlertPreferences>;
  fetchExternalAccounts: (workspaceSlug: string) => Promise<TUserExternalAccount[]>;
  connectExternalAccount: (workspaceSlug: string, data: TConnectAccountPayload) => Promise<TUserExternalAccount>;
  disconnectExternalAccount: (workspaceSlug: string, provider: string) => Promise<void>;
  fetchAlertLogs: (workspaceSlug: string, filters?: TAlertLogFilters) => Promise<TAlertLog[]>;
  startGoogleCalendarOAuth: (workspaceSlug: string) => Promise<string>;
  disconnectGoogleCalendar: (workspaceSlug: string) => Promise<void>;
}

export class AlertStore implements IAlertStore {
  alertRules = new Map<string, TAlertRule>();
  userPreferences: TUserAlertPreferences | null = null;
  externalAccounts = new Map<string, TUserExternalAccount>();
  alertLogs: TAlertLog[] = [];
  isLoadingRules = false;
  isLoadingPreferences = false;
  isLoadingAccounts = false;
  isLoadingLogs = false;

  private alertService: AlertService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      alertRules: observable,
      userPreferences: observable,
      externalAccounts: observable,
      alertLogs: observable,
      isLoadingRules: observable,
      isLoadingPreferences: observable,
      isLoadingAccounts: observable,
      isLoadingLogs: observable,
      rulesArray: computed,
      fetchAlertRules: action,
      createAlertRule: action,
      updateAlertRule: action,
      deleteAlertRule: action,
      toggleAlertRule: action,
      fetchPreferences: action,
      updatePreferences: action,
      fetchExternalAccounts: action,
      connectExternalAccount: action,
      disconnectExternalAccount: action,
      fetchAlertLogs: action,
      startGoogleCalendarOAuth: action,
      disconnectGoogleCalendar: action,
    });
    this.alertService = new AlertService();
  }

  get rulesArray(): TAlertRule[] {
    return Array.from(this.alertRules.values()).sort((a, b) => a.alert_type.localeCompare(b.alert_type));
  }

  fetchAlertRules = async (workspaceSlug: string) => {
    this.isLoadingRules = true;
    try {
      const rules = await this.alertService.listRules(workspaceSlug);
      runInAction(() => {
        this.alertRules.clear();
        rules.forEach((rule) => this.alertRules.set(rule.id, rule));
      });
      return rules;
    } finally {
      runInAction(() => {
        this.isLoadingRules = false;
      });
    }
  };

  createAlertRule = async (workspaceSlug: string, data: TAlertRulesPayload) => {
    const rule = await this.alertService.createRule(workspaceSlug, data);
    runInAction(() => {
      this.alertRules.set(rule.id, rule);
    });
    return rule;
  };

  updateAlertRule = async (workspaceSlug: string, ruleId: string, data: TAlertRulesPayload) => {
    const rule = await this.alertService.updateRule(workspaceSlug, ruleId, data);
    runInAction(() => {
      this.alertRules.set(rule.id, rule);
    });
    return rule;
  };

  deleteAlertRule = async (workspaceSlug: string, ruleId: string) => {
    await this.alertService.deleteRule(workspaceSlug, ruleId);
    runInAction(() => {
      this.alertRules.delete(ruleId);
    });
  };

  toggleAlertRule = async (workspaceSlug: string, ruleId: string, enabled: boolean) => {
    await this.updateAlertRule(workspaceSlug, ruleId, { enabled });
  };

  fetchPreferences = async (workspaceSlug: string) => {
    this.isLoadingPreferences = true;
    try {
      const prefs = await this.alertService.getPreferences(workspaceSlug);
      runInAction(() => {
        this.userPreferences = prefs;
      });
      return prefs;
    } finally {
      runInAction(() => {
        this.isLoadingPreferences = false;
      });
    }
  };

  updatePreferences = async (workspaceSlug: string, data: Partial<TUserAlertPreferences>) => {
    const prefs = await this.alertService.updatePreferences(workspaceSlug, data);
    runInAction(() => {
      this.userPreferences = prefs;
    });
    return prefs;
  };

  fetchExternalAccounts = async (workspaceSlug: string) => {
    this.isLoadingAccounts = true;
    try {
      const accounts = await this.alertService.listExternalAccounts(workspaceSlug);
      runInAction(() => {
        this.externalAccounts.clear();
        accounts.forEach((account) => this.externalAccounts.set(account.provider, account));
      });
      return accounts;
    } finally {
      runInAction(() => {
        this.isLoadingAccounts = false;
      });
    }
  };

  connectExternalAccount = async (workspaceSlug: string, data: TConnectAccountPayload) => {
    const account = await this.alertService.linkExternalAccount(workspaceSlug, data);
    runInAction(() => {
      this.externalAccounts.set(account.provider, account);
    });
    return account;
  };

  disconnectExternalAccount = async (workspaceSlug: string, provider: string) => {
    await this.alertService.unlinkExternalAccount(workspaceSlug, provider);
    runInAction(() => {
      this.externalAccounts.delete(provider);
    });
  };

  fetchAlertLogs = async (workspaceSlug: string, filters?: TAlertLogFilters) => {
    this.isLoadingLogs = true;
    try {
      const page = await this.alertService.listLogs(workspaceSlug, filters);
      const logs = page?.results ?? [];
      runInAction(() => {
        this.alertLogs = logs;
      });
      return logs;
    } finally {
      runInAction(() => {
        this.isLoadingLogs = false;
      });
    }
  };

  startGoogleCalendarOAuth = async (workspaceSlug: string) => {
    const response = await this.alertService.startGoogleCalendarOAuth(workspaceSlug);
    return response.redirect_url;
  };

  disconnectGoogleCalendar = async (workspaceSlug: string) => {
    await this.alertService.disconnectGoogleCalendar(workspaceSlug);
    runInAction(() => {
      this.externalAccounts.delete("google_calendar");
    });
  };
}
