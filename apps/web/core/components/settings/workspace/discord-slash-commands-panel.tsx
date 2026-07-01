import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import { Input } from "@operoz/propel/input";
import { setToast, TOAST_TYPE } from "@operoz/propel/toast";
import { TextArea, ToggleSwitch, Loader, cn } from "@operoz/ui";
import {
  DiscordSlashCommandService,
  type TDiscordSlashCommand,
  type TDiscordSlashCommandPayload,
} from "@/services/discord-slash-command.service";
import { DiscordInteractionsEndpointCard } from "./discord-interactions-endpoint-card";
import { DiscordSlashCommandCard } from "./discord-slash-command-card";
import {
  DEFAULT_DISCORD_COMMANDS_FILTERS,
  DiscordSlashCommandsToolbar,
  hasActiveDiscordCommandsFilters,
  type DiscordCommandsFilters,
} from "./discord-slash-commands-toolbar";
import "./discord-settings.css";

type FormState = {
  name: string;
  description: string;
  prompt_instructions: string;
  guild_id: string;
  board_slug: string;
  default_project: string;
  is_enabled: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  prompt_instructions: "",
  guild_id: "",
  board_slug: "",
  default_project: "",
  is_enabled: true,
};

function toFormState(command?: TDiscordSlashCommand | null): FormState {
  if (!command) return { ...EMPTY_FORM };
  return {
    name: command.name,
    description: command.description,
    prompt_instructions: command.prompt_instructions,
    guild_id: command.guild_id ?? "",
    board_slug: command.board_slug ?? "",
    default_project: command.default_project ?? "",
    is_enabled: command.is_enabled,
  };
}

function toPayload(form: FormState): TDiscordSlashCommandPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    prompt_instructions: form.prompt_instructions.trim(),
    guild_id: form.guild_id.trim() || null,
    board_slug: form.board_slug.trim(),
    default_project: form.default_project.trim() || null,
    is_enabled: form.is_enabled,
  };
}

function filterCommands(commands: TDiscordSlashCommand[], filters: DiscordCommandsFilters): TDiscordSlashCommand[] {
  const query = filters.query.trim().toLowerCase();

  return commands.filter((command) => {
    if (filters.status !== "all" && command.registration_status !== filters.status) return false;
    if (!query) return true;

    const haystack =
      `/${command.name} ${command.description} ${command.board_slug ?? ""} ${command.guild_id ?? ""}`.toLowerCase();
    return haystack.includes(query);
  });
}

function CommandForm(props: {
  form: FormState;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  editing: boolean;
}) {
  const { t } = useTranslation();
  const { form, onChange, onSubmit, onCancel, submitting, editing } = props;

  return (
    <article className="overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div className="border-b border-subtle px-5 py-4">
        <h3 className="text-14 font-semibold text-primary">
          {editing
            ? t("workspace_settings.settings.discord.form.edit_title")
            : t("workspace_settings.settings.discord.form.create_title")}
        </h3>
        <p className="mt-1 text-12 text-secondary">{t("workspace_settings.settings.discord.form.lead")}</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-11 font-medium text-tertiary">
              {t("workspace_settings.settings.discord.form.name")}
            </label>
            <Input
              value={form.name}
              onChange={(event) => onChange({ ...form, name: event.target.value.toLowerCase() })}
              placeholder="status-projeto"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-11 font-medium text-tertiary">
              {t("workspace_settings.settings.discord.form.guild_id")} *
            </label>
            <Input
              value={form.guild_id}
              onChange={(event) => onChange({ ...form, guild_id: event.target.value })}
              placeholder="123456789012345678"
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-11 font-medium text-tertiary">
            {t("workspace_settings.settings.discord.form.description")}
          </label>
          <Input
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            disabled={submitting}
          />
        </div>

        <div>
          <label className="mb-1 block text-11 font-medium text-tertiary">
            {t("workspace_settings.settings.discord.form.prompt_instructions")}
          </label>
          <TextArea
            value={form.prompt_instructions}
            onChange={(event) => onChange({ ...form, prompt_instructions: event.target.value })}
            rows={5}
            disabled={submitting}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-11 font-medium text-tertiary">
              {t("workspace_settings.settings.discord.form.board_slug")}
            </label>
            <Input
              value={form.board_slug}
              onChange={(event) => onChange({ ...form, board_slug: event.target.value })}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-11 font-medium text-tertiary">
              {t("workspace_settings.settings.discord.form.default_project")}
            </label>
            <Input
              value={form.default_project}
              onChange={(event) => onChange({ ...form, default_project: event.target.value })}
              placeholder="uuid do projeto"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface-1 px-3 py-2.5">
          <div>
            <p className="text-13 font-medium text-primary">{t("workspace_settings.settings.discord.form.enabled")}</p>
            <p className="text-12 text-tertiary">{t("workspace_settings.settings.discord.form.enabled_hint")}</p>
          </div>
          <ToggleSwitch
            value={form.is_enabled}
            onChange={(value) => onChange({ ...form, is_enabled: value })}
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-subtle pt-4">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={submitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={onSubmit} loading={submitting}>
            {editing
              ? t("workspace_settings.settings.discord.form.save")
              : t("workspace_settings.settings.discord.form.create")}
          </Button>
        </div>
      </div>
    </article>
  );
}

type PanelProps = {
  workspaceSlug: string;
  onCommandCountChange?: (count: number) => void;
};

export function WorkspaceDiscordSlashCommandsPanel(props: PanelProps) {
  const { workspaceSlug, onCommandCountChange } = props;
  const { t } = useTranslation();
  const service = useMemo(() => new DiscordSlashCommandService(), []);
  const swrKey = `DISCORD_SLASH_COMMANDS_${workspaceSlug}`;

  const { data: commands, isLoading, mutate } = useSWR(swrKey, () => service.list(workspaceSlug));

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TDiscordSlashCommand | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_DISCORD_COMMANDS_FILTERS);

  const list = commands ?? [];

  useEffect(() => {
    onCommandCountChange?.(list.length);
  }, [list.length, onCommandCountChange]);

  const filteredCommands = useMemo(() => filterCommands(list, filters), [list, filters]);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = toPayload(form);
      if (editing) {
        await service.update(workspaceSlug, editing.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.discord.toast.updated") });
      } else {
        await service.create(workspaceSlug, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.discord.toast.created") });
      }
      await mutate();
      resetForm();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("workspace_settings.settings.discord.toast.error") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (command: TDiscordSlashCommand) => {
    setSubmitting(true);
    try {
      await service.remove(workspaceSlug, command.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.discord.toast.deleted") });
      await mutate();
      if (editing?.id === command.id) resetForm();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("workspace_settings.settings.discord.toast.error") });
    } finally {
      setSubmitting(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (command: TDiscordSlashCommand) => {
    setEditing(command);
    setForm(toFormState(command));
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <DiscordInteractionsEndpointCard />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-15 font-semibold tracking-tight text-primary">
              {t("workspace_settings.settings.discord.commands_title")}
            </h2>
            <p className="mt-1 max-w-2xl text-13 leading-relaxed text-secondary">
              {t("workspace_settings.settings.discord.commands_description")}
            </p>
          </div>
          {!showForm ? (
            <Button variant="primary" size="base" onClick={startCreate}>
              {t("workspace_settings.settings.discord.add_command")}
            </Button>
          ) : null}
        </div>

        {showForm ? (
          <CommandForm
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            submitting={submitting}
            editing={Boolean(editing)}
          />
        ) : null}

        {isLoading && !commands ? (
          <Loader className="discord-settings-card-grid w-full">
            <Loader.Item height="200px" />
            <Loader.Item height="200px" />
          </Loader>
        ) : list.length === 0 && !showForm ? (
          <EmptyStateCompact
            assetKey="webhook"
            title={t("workspace_settings.settings.discord.empty_title")}
            description={t("workspace_settings.settings.discord.empty_description")}
            actions={[{ label: t("workspace_settings.settings.discord.add_command"), onClick: startCreate }]}
          />
        ) : (
          <>
            <DiscordSlashCommandsToolbar
              filters={filters}
              resultCount={filteredCommands.length}
              onChange={setFilters}
            />

            {filteredCommands.length === 0 ? (
              <EmptyStateCompact
                assetKey="search"
                title={t("workspace_settings.settings.discord.filters.empty_search")}
                description={t("workspace_settings.settings.discord.filters.empty_search_hint")}
                actions={
                  hasActiveDiscordCommandsFilters(filters)
                    ? [
                        {
                          label: t("workspace_settings.settings.discord.filters.clear"),
                          onClick: () => setFilters(DEFAULT_DISCORD_COMMANDS_FILTERS),
                        },
                      ]
                    : undefined
                }
              />
            ) : (
              <div className="discord-settings-card-grid">
                {!showForm && <CreateCommandCard onClick={startCreate} />}
                {filteredCommands.map((command) => (
                  <DiscordSlashCommandCard
                    key={command.id}
                    command={command}
                    onEdit={() => startEdit(command)}
                    onDelete={() => void handleDelete(command)}
                    disabled={submitting}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CreateCommandCard({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-subtle",
        "bg-transparent px-5 py-8 text-center transition-all duration-150",
        "hover:border-accent-subtle hover:bg-accent-subtle/10",
        "focus-visible:ring-accent-primary focus-visible:ring-offset-surface-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl border border-subtle bg-layer-1 text-accent-primary transition-colors group-hover:border-accent-subtle group-hover:bg-accent-subtle/30">
        <Plus className="size-5" strokeWidth={1.75} />
      </span>
      <span className="text-13 font-semibold text-primary">{t("workspace_settings.settings.discord.add_command")}</span>
      <span className="max-w-[12rem] text-11 leading-relaxed text-tertiary">
        {t("workspace_settings.settings.discord.create_hint")}
      </span>
    </button>
  );
}
