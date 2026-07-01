import { useCallback, useEffect, useState, type ReactNode } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "react-router";
import useSWR from "swr";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Badge } from "@operoz/propel/badge";
import { Button } from "@operoz/propel/button";
import { setToast, TOAST_TYPE } from "@operoz/propel/toast";
import { CustomSelect, Input } from "@operoz/ui";
import { calculateTimeAgo, cn } from "@operoz/utils";
import type { IBoard } from "@operoz/types";
import type {
  TJiraOpsImportPreview,
  TJiraOpsSyncPhase,
  TJiraOpsSyncResult,
  TJiraOpsSyncState,
} from "@/services/workspace-jira-sync.service";
import { WorkspaceJiraSyncService } from "@/services/workspace-jira-sync.service";
import { BoardService } from "@/services/board/board.service";
import { useUserPermissions } from "@/hooks/store/user";
import { WorkspaceJiraSettingsHero } from "@/components/settings/workspace/workspace-jira-settings-hero";
import "@/components/exporter/workspace-exports-settings.css";

const syncService = new WorkspaceJiraSyncService();
const boardService = new BoardService();
const POLL_MS = 3000;
const ATLASSIAN_DEVELOPER_CONSOLE_URL = "https://developer.atlassian.com/console/myapps/";

const SELECT_CONTROL_CLASS =
  "w-full !rounded-lg !border-subtle !bg-layer-2 !px-3.5 !py-2.5 !text-13 !font-normal shadow-none hover:!bg-layer-1 focus-visible:ring-2 focus-visible:ring-accent-primary/30";

const INPUT_WITH_ICON_CLASS =
  "h-10 w-full rounded-lg border-subtle bg-layer-2 pl-10 pr-3 text-13 shadow-none hover:bg-layer-1 focus-visible:ring-2 focus-visible:ring-accent-primary/30";

const OAUTH_SECRET_MASK = "****************";

const JIRA_OAUTH_ERROR_KEYS: Record<string, string> = {
  invalid_state: "workspace_settings.settings.jira.oauth_error_invalid_state",
  missing_code: "workspace_settings.settings.jira.oauth_error_missing_code",
};

function resolveBoardSlug(savedSlug: string | undefined, boards: IBoard[]): string {
  const slug = (savedSlug ?? "").trim();
  if (!boards.length) return slug;
  if (slug && boards.some((b) => b.slug === slug)) return slug;
  const preferred = boards.find((b) => b.slug === "squad-as-a-service");
  if (preferred) return preferred.slug;
  return boards[0].slug;
}

type Props = {
  workspaceSlug: string;
};

type StepId = "app" | "connect" | "import";

const STEPS: StepId[] = ["app", "connect", "import"];

type StepMeta = {
  id: StepId;
  number: number;
  icon: typeof KeyRound;
  titleKey: string;
  shortKey: string;
};

const STEP_META: StepMeta[] = [
  {
    id: "app",
    number: 1,
    icon: KeyRound,
    titleKey: "workspace_settings.settings.jira.step_app_title",
    shortKey: "workspace_settings.settings.jira.step_progress_app",
  },
  {
    id: "connect",
    number: 2,
    icon: Cloud,
    titleKey: "workspace_settings.settings.jira.step_connect_title",
    shortKey: "workspace_settings.settings.jira.step_progress_connect",
  },
  {
    id: "import",
    number: 3,
    icon: Upload,
    titleKey: "workspace_settings.settings.jira.step_sync_title",
    shortKey: "workspace_settings.settings.jira.step_progress_sync",
  },
];

function phaseLabel(t: (key: string) => string, phase?: TJiraOpsSyncPhase | null): string {
  if (!phase) return "";
  const key = `workspace_settings.settings.jira.phase.${phase}`;
  const label = t(key);
  return label === key ? phase : label;
}

function FormField({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-13 font-medium text-primary" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-12 leading-relaxed text-tertiary">{hint}</p> : null}
    </div>
  );
}

function IconField({
  label,
  hint,
  htmlFor,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <FormField label={label} hint={hint} htmlFor={htmlFor}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-tertiary">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
        {children}
      </div>
    </FormField>
  );
}

function CopyField({
  label,
  value,
  onCopy,
  hint,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  hint?: string;
}) {
  return (
    <FormField label={label} hint={hint}>
      <div className="flex overflow-hidden rounded-lg border border-subtle bg-layer-2">
        <span className="flex shrink-0 items-center border-r border-subtle px-3 text-tertiary">
          <Link2 className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
        <code className="font-mono min-w-0 flex-1 truncate px-3 py-2.5 text-12 text-secondary">{value}</code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 border-l border-subtle px-3.5 text-tertiary transition-colors hover:bg-layer-1 hover:text-primary"
          aria-label="Copy"
        >
          <Copy className="size-4" />
        </button>
      </div>
    </FormField>
  );
}

function PreviewStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  if (!value) return null;
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        accent ? "border-accent-primary/30 bg-accent-primary/10" : "border-subtle bg-layer-2"
      )}
    >
      <p className="text-11 text-tertiary">{label}</p>
      <p className="mt-0.5 text-16 font-semibold text-primary tabular-nums">{value}</p>
    </div>
  );
}

function ImportPreviewPanel({
  preview,
  loading,
  onConfirm,
  onRefresh,
  confirmLoading,
  t,
}: {
  preview: TJiraOpsImportPreview | null;
  loading: boolean;
  onConfirm: () => void;
  onRefresh: () => void;
  confirmLoading: boolean;
  t: (key: string, opts?: Record<string, string | number>) => string;
}) {
  if (loading) {
    return (
      <section className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-subtle bg-layer-1 p-6 text-center">
        <Loader2 className="mb-3 size-8 animate-spin text-accent-primary" />
        <p className="text-13 font-medium text-primary">{t("workspace_settings.settings.jira.preview_loading")}</p>
        <p className="mt-1 text-12 text-tertiary">{t("workspace_settings.settings.jira.preview_hint")}</p>
      </section>
    );
  }

  if (!preview) return null;

  const createsTotal = preview.projects_new + preview.modules_new + preview.cards_new + preview.subtasks_new;
  const updatesTotal =
    preview.modules_renamed + preview.cards_updated + preview.subtasks_updated + preview.cards_link_only;
  const samples = [
    ...(preview.new_project_names ?? []),
    ...(preview.sample_new_modules ?? []),
    ...(preview.sample_new_cards ?? []),
  ];

  return (
    <section className="flex h-full flex-col rounded-xl border border-subtle bg-layer-1">
      <div className="border-b border-subtle px-5 py-4">
        <h3 className="text-14 font-semibold text-primary">{t("workspace_settings.settings.jira.preview_title")}</h3>
        <p className="mt-1 text-12 leading-relaxed text-tertiary">
          {t("workspace_settings.settings.jira.preview_hint")}
        </p>
        <p className="mt-2 text-11 text-secondary">
          {t("workspace_settings.settings.jira.preview_jira_totals", {
            epics: preview.epics_fetched,
            issues: preview.issues_fetched,
          })}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {createsTotal === 0 && updatesTotal === 0 ? (
          <p className="text-13 text-secondary">{t("workspace_settings.settings.jira.preview_empty")}</p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_projects_new")}
            value={preview.projects_new}
            accent
          />
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_modules_new")}
            value={preview.modules_new}
            accent
          />
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_cards_new")}
            value={preview.cards_new}
            accent
          />
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_subtasks_new")}
            value={preview.subtasks_new}
            accent
          />
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_modules_renamed")}
            value={preview.modules_renamed}
          />
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_cards_updated")}
            value={preview.cards_updated}
          />
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_subtasks_updated")}
            value={preview.subtasks_updated}
          />
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_cards_link_only")}
            value={preview.cards_link_only}
          />
          <PreviewStat
            label={t("workspace_settings.settings.jira.preview_skipped_epics")}
            value={preview.skipped_epics}
          />
        </div>

        {samples.length > 0 ? (
          <div>
            <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">
              {t("workspace_settings.settings.jira.preview_samples")}
            </p>
            <ul className="space-y-1.5 text-12 text-secondary">
              {samples.slice(0, 8).map((line) => (
                <li key={line} className="font-mono truncate rounded bg-layer-2 px-2 py-1">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-subtle px-5 py-4">
        <Button variant="primary" className="w-full" onClick={onConfirm} loading={confirmLoading}>
          <RefreshCw className={cn("size-4", confirmLoading && "animate-spin")} />
          {t("workspace_settings.settings.jira.preview_confirm")}
        </Button>
        <Button variant="ghost" size="sm" className="w-full" onClick={onRefresh} disabled={confirmLoading}>
          {t("workspace_settings.settings.jira.preview_refresh")}
        </Button>
      </div>
    </section>
  );
}

function ImportResultChips({ result, t }: { result: TJiraOpsSyncResult; t: (key: string) => string }) {
  const items = [
    ["clients", result.clients],
    ["modules", result.modules],
    ["created_cards", result.created_cards],
    ["created_subtasks", result.created_subtasks],
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([key, val]) => (
        <div key={key} className="rounded-md border border-subtle bg-layer-2 px-3 py-2">
          <p className="text-11 text-tertiary">{t(`workspace_settings.settings.jira.result.${key}`)}</p>
          <p className="mt-0.5 text-16 font-semibold text-primary tabular-nums">{val}</p>
        </div>
      ))}
    </div>
  );
}

function HorizontalStepTab({
  meta,
  isActive,
  isComplete,
  isLocked,
  statusLine,
  onSelect,
}: {
  meta: StepMeta;
  isActive: boolean;
  isComplete: boolean;
  isLocked: boolean;
  statusLine: string;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const Icon = meta.icon;
  const title = t(meta.titleKey);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isLocked}
      title={title}
      aria-label={title}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col gap-1 border-b-2 px-3 py-3 text-left transition-colors md:gap-1.5 md:px-5 md:py-4 lg:px-6",
        isActive ? "border-accent-primary bg-accent-primary/8" : "border-transparent hover:bg-layer-2",
        isLocked && "cursor-not-allowed opacity-50"
      )}
    >
      <span className="flex min-w-0 items-center justify-center gap-2 md:justify-start md:gap-2.5">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full border text-11 font-bold",
            isActive && "border-accent-primary bg-accent-primary text-on-color",
            isComplete && !isActive && "border-success bg-success/15 text-success",
            !isActive && !isComplete && "border-subtle bg-layer-2 text-secondary"
          )}
        >
          {isComplete && !isActive ? (
            <Check className="size-3.5" strokeWidth={2.5} />
          ) : isLocked ? (
            <Lock className="size-3" />
          ) : (
            meta.number
          )}
        </span>
        <Icon className={cn("hidden size-4 shrink-0 md:block", isActive ? "text-accent-primary" : "text-tertiary")} />
        <span
          className={cn("hidden truncate text-13 font-medium md:inline", isActive ? "text-primary" : "text-secondary")}
        >
          {title}
        </span>
        <span className={cn("truncate text-12 font-medium md:hidden", isActive ? "text-primary" : "text-secondary")}>
          {t(meta.shortKey)}
        </span>
      </span>
      <span className="hidden truncate text-center text-11 text-tertiary md:block md:pl-9 md:text-left lg:pl-10 lg:text-12">
        {statusLine}
      </span>
    </button>
  );
}

function VerticalStepTab({
  meta,
  isActive,
  isComplete,
  isLocked,
  statusLine,
  onSelect,
}: {
  meta: StepMeta;
  isActive: boolean;
  isComplete: boolean;
  isLocked: boolean;
  statusLine: string;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const Icon = meta.icon;
  const title = t(meta.titleKey);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isLocked}
      title={title}
      aria-label={title}
      aria-current={isActive ? "step" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
        isActive
          ? "border-accent-primary/45 shadow-sm bg-accent-primary/10"
          : "border-subtle bg-surface-1/40 hover:border-accent-subtle/35 hover:bg-layer-2",
        isLocked && "cursor-not-allowed opacity-55"
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full border text-11 font-bold",
          isActive && "border-accent-primary bg-accent-primary text-on-color",
          isComplete && !isActive && "border-success bg-success/15 text-success",
          !isActive && !isComplete && "border-subtle bg-layer-2 text-secondary"
        )}
      >
        {isComplete && !isActive ? (
          <Check className="size-3.5" strokeWidth={2.5} />
        ) : isLocked ? (
          <Lock className="size-3" />
        ) : (
          meta.number
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <Icon className={cn("size-3.5 shrink-0", isActive ? "text-accent-primary" : "text-tertiary")} />
          <span className={cn("truncate text-13 font-medium", isActive ? "text-primary" : "text-secondary")}>
            {title}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-11 text-tertiary">{statusLine}</span>
      </span>
      {isActive ? <ArrowRight className="mt-1 size-4 shrink-0 text-accent-primary" /> : null}
    </button>
  );
}

export const WorkspaceJiraSyncPanel = observer(function WorkspaceJiraSyncPanel({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const [oauthClientId, setOauthClientId] = useState("");
  const [oauthClientSecret, setOauthClientSecret] = useState("");
  const [oauthSecretEditing, setOauthSecretEditing] = useState(false);
  const [projectKey, setProjectKey] = useState("OPS");
  const [boardSlug, setBoardSlug] = useState("");
  const [savingApp, setSavingApp] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [pickCloudOpen, setPickCloudOpen] = useState(false);
  const [selectedCloudId, setSelectedCloudId] = useState("");
  const [activeStep, setActiveStep] = useState<StepId>("app");
  const [stepBootstrapped, setStepBootstrapped] = useState(false);
  const [importPreview, setImportPreview] = useState<TJiraOpsImportPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data, mutate, isLoading } = useSWR<TJiraOpsSyncState>(
    isAdmin ? `JIRA_OPS_SYNC_${workspaceSlug}` : null,
    () => syncService.getStatus(workspaceSlug),
    { refreshInterval: (latest) => (latest?.status === "running" ? POLL_MS : 0) }
  );

  const { data: boards = [] } = useSWR<IBoard[]>(isAdmin ? `JIRA_OPS_BOARDS_${workspaceSlug}` : null, () =>
    boardService.getBoards(workspaceSlug)
  );

  const { data: jiraProjects = [] } = useSWR(
    isAdmin && data?.oauth_connected ? `JIRA_OPS_PROJECTS_${workspaceSlug}` : null,
    () => syncService.getJiraProjects(workspaceSlug)
  );

  const { data: oauthSites } = useSWR(isAdmin && pickCloudOpen ? `JIRA_OPS_SITES_${workspaceSlug}` : null, () =>
    syncService.getOAuthSites(workspaceSlug)
  );

  useEffect(() => {
    if (!data) return;
    setOauthClientId(data.oauth_app_client_id ?? "");
    setProjectKey(data.project_key ?? "OPS");
    setBoardSlug(resolveBoardSlug(data.board_slug, boards));
  }, [data, boards]);

  useEffect(() => {
    setImportPreview(null);
  }, [projectKey, boardSlug]);

  useEffect(() => {
    const first = oauthSites?.sites?.[0]?.id;
    if (first && !selectedCloudId) setSelectedCloudId(first);
  }, [oauthSites?.sites, selectedCloudId]);

  useEffect(() => {
    if (!data || stepBootstrapped) return;
    if (!data.oauth_app_configured) setActiveStep("app");
    else if (!data.oauth_connected) setActiveStep("connect");
    else setActiveStep("import");
    setStepBootstrapped(true);
  }, [data, stepBootstrapped]);

  useEffect(() => {
    const connected = searchParams.get("jira_connected");
    const pickCloud = searchParams.get("jira_pick_cloud");
    const jiraError = searchParams.get("jira_error");

    if (jiraError) {
      const errorKey = JIRA_OAUTH_ERROR_KEYS[jiraError];
      const title = errorKey ? t(errorKey) : decodeURIComponent(jiraError);
      setToast({ type: TOAST_TYPE.ERROR, title });
      setSearchParams({}, { replace: true });
    }
    if (connected === "1") {
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.jira.connected_success") });
      void mutate();
      setSearchParams({}, { replace: true });
      setActiveStep("import");
    }
    if (pickCloud === "1") {
      setPickCloudOpen(true);
      setSearchParams({}, { replace: true });
      setActiveStep("connect");
    }
  }, [mutate, searchParams, setSearchParams, t]);

  const saveAppConfig = useCallback(async () => {
    setSavingApp(true);
    try {
      const payload: Record<string, string> = {
        oauth_app_client_id: oauthClientId.trim(),
        project_key: projectKey,
        board_slug: boardSlug,
      };
      const secret = oauthClientSecret.trim();
      if (secret && secret !== OAUTH_SECRET_MASK) payload.oauth_app_client_secret = secret;
      const next = await syncService.saveConfig(workspaceSlug, payload);
      await mutate(next, false);
      setOauthClientSecret("");
      setOauthSecretEditing(false);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.jira.oauth_app_saved") });
      return true;
    } catch (err: unknown) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: (err as { error?: string })?.error || t("workspace_settings.settings.jira.errors.save_failed"),
      });
      return false;
    } finally {
      setSavingApp(false);
    }
  }, [boardSlug, mutate, oauthClientId, oauthClientSecret, projectKey, t, workspaceSlug]);

  const handleConnectJira = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      if (!data?.oauth_app_configured || oauthClientSecret.trim()) {
        const ok = await saveAppConfig();
        if (!ok) {
          setConnecting(false);
          return;
        }
      }
      window.location.href = await syncService.getOAuthStartUrl(workspaceSlug);
    } catch (err: unknown) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: (err as { error?: string })?.error || t("workspace_settings.settings.jira.errors.connect_failed"),
      });
      setConnecting(false);
    }
  }, [connecting, data?.oauth_app_configured, oauthClientSecret, saveAppConfig, t, workspaceSlug]);

  const handleConfirmSite = useCallback(async () => {
    if (!selectedCloudId) return;
    try {
      const next = await syncService.completeOAuth(workspaceSlug, {
        cloud_id: selectedCloudId,
        project_key: projectKey,
        board_slug: boardSlug,
      });
      await mutate(next, false);
      setPickCloudOpen(false);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.jira.connected_success") });
      setActiveStep("import");
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("workspace_settings.settings.jira.errors.save_failed") });
    }
  }, [boardSlug, mutate, projectKey, selectedCloudId, t, workspaceSlug]);

  const handleSaveTargets = useCallback(async () => {
    try {
      await syncService.saveConfig(workspaceSlug, { project_key: projectKey, board_slug: boardSlug });
      await mutate();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.jira.config_saved") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("workspace_settings.settings.jira.errors.save_failed") });
    }
  }, [boardSlug, mutate, projectKey, t, workspaceSlug]);

  const handleSync = useCallback(async () => {
    if (starting || data?.status === "running") return;
    setStarting(true);
    try {
      await syncService.startSync(workspaceSlug, boardSlug);
      await mutate();
      setImportPreview(null);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.jira.status.running") });
    } catch (err: unknown) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: (err as { error?: string })?.error || t("workspace_settings.settings.jira.errors.start_failed"),
      });
    } finally {
      setStarting(false);
    }
  }, [boardSlug, data?.status, mutate, starting, t, workspaceSlug]);

  const handlePreviewImport = useCallback(async () => {
    if (previewLoading || starting || data?.status === "running") return;
    setPreviewLoading(true);
    try {
      const result = await syncService.previewSync(workspaceSlug, {
        board_slug: boardSlug,
        project_key: projectKey,
      });
      setImportPreview(result);
    } catch (err: unknown) {
      setImportPreview(null);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: (err as { error?: string })?.error || t("workspace_settings.settings.jira.preview_errors.failed"),
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [boardSlug, data?.status, previewLoading, projectKey, starting, t, workspaceSlug]);

  const copyCallbackUrl = useCallback(() => {
    const url = data?.oauth_redirect_uri;
    if (!url) return;
    void navigator.clipboard.writeText(url);
    setToast({ type: TOAST_TYPE.INFO, title: t("workspace_settings.settings.jira.callback_copied") });
  }, [data?.oauth_redirect_uri, t]);

  const goNextStep = useCallback(() => {
    const idx = STEPS.indexOf(activeStep);
    if (idx < STEPS.length - 1) setActiveStep(STEPS[idx + 1]);
  }, [activeStep]);

  if (!isAdmin) return null;

  const running = data?.status === "running" || starting;
  const oauthAppReady = data?.oauth_app_configured ?? false;
  const showOauthSecretMask = oauthAppReady && !oauthSecretEditing && !oauthClientSecret;
  const connected = data?.oauth_connected ?? false;
  const canSync = data?.configured ?? false;
  const canConnect = oauthAppReady && Boolean(oauthClientId.trim());

  const stepComplete: Record<StepId, boolean> = {
    app: oauthAppReady,
    connect: connected,
    import: data?.status === "completed",
  };

  const stepLocked: Record<StepId, boolean> = {
    app: false,
    connect: !oauthAppReady,
    import: !connected,
  };

  const stepStatusLine = (id: StepId): string => {
    if (id === "app") {
      return oauthAppReady
        ? t("workspace_settings.settings.jira.badge_app_configured")
        : t("workspace_settings.settings.jira.badge_app_pending");
    }
    if (id === "connect") {
      return connected
        ? data?.jira_site_name || data?.email || t("workspace_settings.settings.jira.badge_connected")
        : t("workspace_settings.settings.jira.badge_app_pending");
    }
    if (running) return t("workspace_settings.settings.jira.syncing");
    if (data?.status === "completed") return t("workspace_settings.settings.jira.status.completed");
    return "—";
  };

  const renderStepContextBar = () => {
    if (activeStep === "import" && running) {
      return (
        <div className="border-b border-subtle py-3">
          <Badge variant="neutral" size="sm">
            <Loader2 className="mr-1 inline size-3 animate-spin" />
            {t("workspace_settings.settings.jira.syncing")}
          </Badge>
        </div>
      );
    }
    return null;
  };

  const renderStepBody = () => {
    if (activeStep === "app") {
      return (
        <section className="workspace-exports-form-panel w-full overflow-hidden rounded-xl border border-subtle bg-layer-1">
          <div className="workspace-exports-hero-dot-grid relative border-b border-subtle bg-gradient-to-br from-accent-subtle/20 via-transparent to-transparent px-5 py-4 lg:px-6">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-primary/12 text-accent-primary">
                <KeyRound className="size-5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-14 font-semibold text-primary">
                  {t("workspace_settings.settings.jira.oauth_card_title")}
                </h3>
                <p className="mt-1 text-13 leading-relaxed text-tertiary">
                  {t("workspace_settings.settings.jira.step_app_hint")}
                </p>
                <a
                  href={ATLASSIAN_DEVELOPER_CONSOLE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-13 font-medium text-accent-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" strokeWidth={1.75} />
                  {t("workspace_settings.settings.jira.developer_console_link")}
                </a>
                {oauthAppReady && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="success" size="sm">
                      <ShieldCheck className="mr-1 inline size-3" />
                      {t("workspace_settings.settings.jira.badge_app_configured")}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      <Lock className="mr-1 inline size-3" />
                      {t("workspace_settings.settings.jira.badge_secret_saved")}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 lg:px-6 lg:py-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <IconField
                label={t("workspace_settings.settings.jira.oauth_client_id_label")}
                htmlFor="oauth-client-id"
                icon={KeyRound}
              >
                <Input
                  id="oauth-client-id"
                  className={INPUT_WITH_ICON_CLASS}
                  value={oauthClientId}
                  onChange={(e) => setOauthClientId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </IconField>

              <IconField
                label={t("workspace_settings.settings.jira.oauth_client_secret_label")}
                hint={
                  showOauthSecretMask
                    ? t("workspace_settings.settings.jira.oauth_secret_stored_hint")
                    : t("workspace_settings.settings.jira.oauth_secret_hint")
                }
                htmlFor="oauth-client-secret"
                icon={Lock}
              >
                <Input
                  id="oauth-client-secret"
                  type={showOauthSecretMask ? "text" : "password"}
                  readOnly={showOauthSecretMask}
                  className={cn(
                    INPUT_WITH_ICON_CLASS,
                    showOauthSecretMask && "font-mono cursor-text tracking-[0.2em] text-tertiary"
                  )}
                  value={showOauthSecretMask ? OAUTH_SECRET_MASK : oauthClientSecret}
                  onFocus={() => {
                    if (showOauthSecretMask) {
                      setOauthSecretEditing(true);
                      setOauthClientSecret("");
                    }
                  }}
                  onChange={(e) => {
                    setOauthSecretEditing(true);
                    setOauthClientSecret(e.target.value);
                  }}
                  onBlur={() => {
                    if (!oauthClientSecret.trim() && oauthAppReady) {
                      setOauthSecretEditing(false);
                    }
                  }}
                  placeholder={showOauthSecretMask ? undefined : "••••••••••••••••"}
                  autoComplete="off"
                />
              </IconField>
            </div>

            {data?.oauth_redirect_uri ? (
              <CopyField
                label={t("workspace_settings.settings.jira.callback_url_label")}
                hint={t("workspace_settings.settings.jira.callback_url_hint")}
                value={data.oauth_redirect_uri}
                onCopy={copyCallbackUrl}
              />
            ) : null}
          </div>

          <div className="workspace-exports-form-footer flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {oauthAppReady ? (
              <Button variant="ghost" size="base" onClick={goNextStep} className="w-full sm:w-auto">
                {t("workspace_settings.settings.jira.next_step")}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <span className="hidden text-12 text-tertiary sm:inline">
                {t("workspace_settings.settings.jira.oauth_save_hint")}
              </span>
            )}
            <Button
              variant="primary"
              size="base"
              onClick={saveAppConfig}
              loading={savingApp}
              className="w-full sm:w-auto"
            >
              <Save className="size-4" />
              {t("workspace_settings.settings.jira.save_app")}
            </Button>
          </div>
        </section>
      );
    }

    if (activeStep === "connect") {
      if (stepLocked.connect) {
        return (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-1/50 px-6 py-16 text-center">
            <Lock className="mb-4 size-10 text-tertiary" />
            <p className="text-14 font-medium text-primary">
              {t("workspace_settings.settings.jira.connect_locked_hint")}
            </p>
            <Button variant="secondary" className="mt-6" onClick={() => setActiveStep("app")}>
              {t("workspace_settings.settings.jira.go_to_app_step")}
            </Button>
          </div>
        );
      }

      return (
        <section className="workspace-exports-form-panel w-full overflow-hidden rounded-xl border border-subtle bg-layer-1">
          <div className="workspace-exports-hero-dot-grid relative border-b border-subtle bg-gradient-to-br from-accent-subtle/20 via-transparent to-transparent px-5 py-4 lg:px-6">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-primary/12 text-accent-primary">
                <Cloud className="size-5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-14 font-semibold text-primary">
                  {t("workspace_settings.settings.jira.step_connect_title")}
                </h3>
                <p className="mt-1 text-13 leading-relaxed text-tertiary">
                  {t("workspace_settings.settings.jira.step_connect_hint")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 lg:px-6 lg:py-6">
            {connected && data && (
              <div className="border-success/30 bg-success/10 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-success mt-0.5 size-6 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-success text-12 font-medium">
                      {t("workspace_settings.settings.jira.badge_connected")}
                    </p>
                    <p className="mt-1 text-14 font-medium text-primary">{data.jira_site_name || data.cloud_id}</p>
                    {data.email ? <p className="mt-0.5 text-13 text-tertiary">{data.email}</p> : null}
                  </div>
                </div>
              </div>
            )}

            {pickCloudOpen && oauthSites?.sites?.length ? (
              <div className="rounded-lg border border-subtle bg-layer-2/50 p-4">
                <h4 className="text-13 font-semibold text-primary">
                  {t("workspace_settings.settings.jira.pick_site_heading")}
                </h4>
                <p className="mt-1 text-12 text-tertiary">
                  {t("workspace_settings.settings.jira.pick_site_description")}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <CustomSelect
                      input
                      value={selectedCloudId}
                      onChange={(v: string) => setSelectedCloudId(v)}
                      label={oauthSites.sites.find((s) => s.id === selectedCloudId)?.name ?? ""}
                      buttonClassName={SELECT_CONTROL_CLASS}
                    >
                      {oauthSites.sites.map((site) => (
                        <CustomSelect.Option key={site.id} value={site.id}>
                          {site.name}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>
                  <Button onClick={handleConfirmSite} disabled={!selectedCloudId} className="w-full sm:w-auto">
                    {t("workspace_settings.settings.jira.pick_site_confirm")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="workspace-exports-form-footer flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {connected ? (
              <Button variant="ghost" size="base" onClick={() => setActiveStep("import")} className="w-full sm:w-auto">
                {t("workspace_settings.settings.jira.next_step")}
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <span className="hidden text-12 text-tertiary sm:inline" />
            )}
            <Button
              size="base"
              variant={connected ? "secondary" : "primary"}
              onClick={handleConnectJira}
              disabled={!canConnect || connecting || running}
              loading={connecting}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="size-4" />
              {connected
                ? t("workspace_settings.settings.jira.reconnect_jira")
                : t("workspace_settings.settings.jira.connect_jira_button")}
            </Button>
          </div>
        </section>
      );
    }

    if (stepLocked.import) {
      return (
        <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-2/20 px-6 py-16 text-center">
          <Lock className="mb-4 size-10 text-tertiary" />
          <p className="text-14 font-medium text-primary">{t("workspace_settings.settings.jira.import_locked_hint")}</p>
          <Button variant="secondary" className="mt-6" onClick={() => setActiveStep("connect")}>
            {t("workspace_settings.settings.jira.go_to_connect_step")}
          </Button>
        </div>
      );
    }

    const jiraProjectLabel = jiraProjects?.find((p) => p.key === projectKey)?.name ?? projectKey;
    const boardLabel = boards.find((b) => b.slug === boardSlug)?.name ?? boardSlug;

    const showPreviewPanel = previewLoading || importPreview !== null;

    return (
      <div className={cn("grid w-full gap-5", showPreviewPanel && "lg:grid-cols-2 lg:items-start")}>
        <div className="space-y-4">
          <section className="workspace-exports-form-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
            <div className="workspace-exports-hero-dot-grid relative border-b border-subtle bg-gradient-to-br from-accent-subtle/20 via-transparent to-transparent px-5 py-4 lg:px-6">
              <h3 className="text-14 font-semibold text-primary">
                {t("workspace_settings.settings.jira.import_card_title")}
              </h3>
              <p className="mt-1 text-13 leading-relaxed text-tertiary">
                {t("workspace_settings.settings.jira.sync_description")}
              </p>
              {data?.last_sync_at ? (
                <p className="mt-3 flex items-center gap-2 text-12 text-secondary">
                  <Clock className="size-3.5 shrink-0 text-tertiary" />
                  {t("workspace_settings.settings.jira.last_sync_label", {
                    time: calculateTimeAgo(data.last_sync_at),
                  })}
                </p>
              ) : (
                <p className="mt-3 text-12 text-tertiary">{t("workspace_settings.settings.jira.last_sync_never")}</p>
              )}
            </div>

            <div className="px-5 py-5 lg:px-6 lg:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-3">
                <div className="min-w-0 flex-1">
                  <FormField label={t("workspace_settings.settings.jira.pick_project_label")}>
                    <CustomSelect
                      input
                      value={projectKey}
                      onChange={(v: string) => setProjectKey(v)}
                      label={
                        <span className="flex min-w-0 items-center gap-2 truncate text-left">
                          <span className="font-mono shrink-0 rounded bg-layer-2 px-1.5 py-0.5 text-11 text-tertiary">
                            {projectKey}
                          </span>
                          <span className="truncate text-primary">{jiraProjectLabel}</span>
                        </span>
                      }
                      buttonClassName={SELECT_CONTROL_CLASS}
                    >
                      {(jiraProjects?.length
                        ? jiraProjects
                        : [{ key: projectKey, name: projectKey, id: projectKey }]
                      ).map((p) => (
                        <CustomSelect.Option key={p.key} value={p.key}>
                          <span className="font-mono text-12 text-tertiary">{p.key}</span>
                          <span className="mx-1.5 text-tertiary">·</span>
                          {p.name}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </FormField>
                </div>

                <div className="flex shrink-0 items-center justify-center text-tertiary lg:pb-2" aria-hidden>
                  <ArrowRight className="size-5 lg:rotate-0" />
                </div>

                <div className="min-w-0 flex-1">
                  <FormField label={t("workspace_settings.settings.jira.pick_board_label")}>
                    <CustomSelect
                      input
                      value={boardSlug}
                      onChange={(v: string) => setBoardSlug(v)}
                      label={<span className="truncate text-left text-primary">{boardLabel}</span>}
                      buttonClassName={SELECT_CONTROL_CLASS}
                    >
                      {boards.map((board) => (
                        <CustomSelect.Option key={board.id} value={board.slug}>
                          {board.name}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </FormField>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
              <Button variant="ghost" size="base" onClick={handleSaveTargets} className="w-full sm:w-auto">
                {t("workspace_settings.settings.jira.save_targets_short")}
              </Button>
              <Button
                variant="primary"
                size="base"
                onClick={handlePreviewImport}
                disabled={!canSync || running || previewLoading}
                loading={previewLoading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={cn("size-4", previewLoading && "animate-spin")} />
                {previewLoading
                  ? t("workspace_settings.settings.jira.preview_loading")
                  : t("workspace_settings.settings.jira.sync_button")}
              </Button>
            </div>
          </section>

          {data?.result && data.status !== "running" && (
            <div className="rounded-xl border border-subtle bg-layer-1 px-5 py-4 lg:px-6">
              <p className="mb-3 text-12 font-medium tracking-wide text-tertiary uppercase">
                {t("workspace_settings.settings.jira.last_import_summary")}
              </p>
              <ImportResultChips result={data.result} t={t} />
            </div>
          )}

          {data && (data.status === "running" || data.status === "failed") && (
            <div
              className={cn(
                "rounded-lg border p-5 text-13",
                data.status === "failed" ? "border-danger-subtle bg-danger-subtle/20" : "border-subtle bg-layer-1"
              )}
            >
              <p className="font-semibold text-primary">
                {t(`workspace_settings.settings.jira.status.${data.status}`)}
              </p>
              {running && data.phase && (
                <p className="mt-2 flex items-center gap-2 text-12 text-tertiary">
                  <Loader2 className="size-3.5 animate-spin" />
                  {phaseLabel(t, data.phase)}
                </p>
              )}
              {data.error && <p className="mt-2 text-12 text-danger-primary">{data.error}</p>}
            </div>
          )}
        </div>

        {showPreviewPanel ? (
          <ImportPreviewPanel
            preview={importPreview}
            loading={previewLoading}
            onConfirm={handleSync}
            onRefresh={handlePreviewImport}
            confirmLoading={starting || running}
            t={t}
          />
        ) : null}
      </div>
    );
  };

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[28rem] w-full animate-pulse flex-col gap-4">
        <div className="h-28 rounded-xl bg-layer-2" />
        <div className="grid gap-4 xl:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
          <div className="hidden h-64 rounded-xl bg-layer-2 xl:block" />
          <div className="min-h-64 rounded-xl bg-layer-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <WorkspaceJiraSettingsHero />

      <div className="grid w-full gap-6 xl:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
        <aside className="hidden xl:sticky xl:top-4 xl:block xl:self-start">
          <nav className="flex flex-col gap-2" aria-label={t("workspace_settings.settings.jira.nav_title")}>
            {STEP_META.map((meta) => (
              <VerticalStepTab
                key={meta.id}
                meta={meta}
                isActive={activeStep === meta.id}
                isComplete={stepComplete[meta.id]}
                isLocked={stepLocked[meta.id]}
                statusLine={stepStatusLine(meta.id)}
                onSelect={() => !stepLocked[meta.id] && setActiveStep(meta.id)}
              />
            ))}
          </nav>
          <div className="mt-4 rounded-xl border border-dashed border-subtle bg-layer-2/25 p-4">
            <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">
              {t("workspace_settings.settings.jira.flow_short_label")}
            </p>
            <p className="mt-2 text-12 leading-relaxed text-secondary">
              {t("workspace_settings.settings.jira.import_actions_hint")}
            </p>
          </div>
        </aside>

        <section className="workspace-exports-history-panel min-w-0 overflow-hidden rounded-xl border border-subtle bg-layer-1">
          <nav className="xl:hidden" aria-label={t("workspace_settings.settings.jira.nav_title")}>
            <div className="flex border-b border-subtle">
              {STEP_META.map((meta) => (
                <HorizontalStepTab
                  key={meta.id}
                  meta={meta}
                  isActive={activeStep === meta.id}
                  isComplete={stepComplete[meta.id]}
                  isLocked={stepLocked[meta.id]}
                  statusLine={stepStatusLine(meta.id)}
                  onSelect={() => !stepLocked[meta.id] && setActiveStep(meta.id)}
                />
              ))}
            </div>
          </nav>

          <div className="px-5 py-5 lg:px-8 lg:py-7">
            {renderStepContextBar()}
            <div className={cn(renderStepContextBar() ? "mt-4" : "")}>{renderStepBody()}</div>
          </div>
        </section>
      </div>
    </div>
  );
});
