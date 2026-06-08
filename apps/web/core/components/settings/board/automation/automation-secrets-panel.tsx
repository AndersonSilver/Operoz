import { useMemo, useState } from "react";
import { Copy, KeyRound, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { IBoardAutomationSecret } from "@operis/types";
import { Input } from "@operis/ui";
import { renderFormattedDate } from "@operis/utils";
import { AutomationListHero } from "./automation-list-hero";
import { AutomationSecretFormModal, type SecretFormValues } from "./automation-secret-form-modal";
import { secretRefSyntax } from "./automation-ops-utils";
import "./automation-list.css";
import "./automation-ops.css";

type Props = {
  secrets: IBoardAutomationSecret[];
  saving: boolean;
  onCreate: (values: SecretFormValues) => Promise<void>;
  onUpdate: (secretId: string, values: SecretFormValues) => Promise<void>;
  onDelete: (secretId: string) => Promise<void>;
};

export function AutomationSecretsPanel(props: Props) {
  const { secrets, saving, onCreate, onUpdate, onDelete } = props;
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSecret, setEditingSecret] = useState<IBoardAutomationSecret | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return secrets;
    return secrets.filter(
      (item) =>
        item.key.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    );
  }, [secrets, search]);

  const openCreate = () => {
    setModalMode("create");
    setEditingSecret(null);
    setModalOpen(true);
  };

  const openEdit = (secret: IBoardAutomationSecret) => {
    setModalMode("edit");
    setEditingSecret(secret);
    setModalOpen(true);
  };

  const handleSubmit = async (values: SecretFormValues) => {
    if (modalMode === "create") {
      await onCreate(values);
    } else if (editingSecret) {
      await onUpdate(editingSecret.id, values);
    }
    setModalOpen(false);
  };

  const copyRef = async (key: string) => {
    try {
      await navigator.clipboard.writeText(secretRefSyntax(key));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <AutomationSecretFormModal
        isOpen={modalOpen}
        mode={modalMode}
        secret={editingSecret}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <div className="space-y-6">
        <AutomationListHero
          icon={KeyRound}
          title={t("boards.settings.automation.ops.secrets.hero_title")}
          description={t("boards.settings.automation.ops.secrets.hero_description")}
          createLabel={t("boards.settings.automation.ops.secrets.create")}
          creating={saving && modalMode === "create"}
          onCreate={openCreate}
          showIllustration={false}
          accentClass="text-accent-primary bg-accent-subtle"
          gradientClass="from-accent-subtle/40"
          highlights={[
            {
              label: t("boards.settings.automation.ops.secrets.count_badge", { count: secrets.length }),
              icon: KeyRound,
              tone: "accent",
            },
            {
              label: t("boards.settings.automation.ops.secrets.workspace_scope"),
              icon: KeyRound,
              tone: "purple",
            },
          ]}
        />

        <section className="automation-ops-glow-top overflow-hidden rounded-xl border border-subtle bg-layer-1 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-14 font-semibold text-primary">
                {t("boards.settings.automation.ops.secrets.list_title")}
              </h2>
              <p className="mt-1 text-12 text-tertiary">{t("boards.settings.automation.ops.secrets.list_lead")}</p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-placeholder" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("boards.settings.automation.ops.secrets.search_placeholder")}
                className="pl-8"
              />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-subtle bg-surface-1 px-4 py-3 text-12 leading-relaxed text-secondary">
            {t("boards.settings.automation.ops.secrets.usage_hint")}{" "}
            <code className="automation-ops-ref-chip">{secretRefSyntax("webhook_token")}</code>{" "}
            {t("boards.settings.automation.ops.secrets.usage_hint_suffix")}
          </div>
        </section>

        {filtered.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-1 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl border border-subtle bg-accent-subtle text-accent-primary">
              <KeyRound className="size-6" strokeWidth={1.5} />
            </span>
            <h3 className="mt-4 text-15 font-semibold text-primary">
              {search
                ? t("boards.settings.automation.ops.secrets.no_results")
                : t("boards.settings.automation.ops.secrets.empty_title")}
            </h3>
            <p className="mt-2 max-w-md text-13 leading-relaxed text-tertiary">
              {search
                ? t("boards.settings.automation.ops.secrets.no_results_hint")
                : t("boards.settings.automation.ops.secrets.empty_description")}
            </p>
            {!search && (
              <Button variant="primary" size="sm" className="mt-5" onClick={openCreate} prependIcon={<Plus />}>
                {t("boards.settings.automation.ops.secrets.create")}
              </Button>
            )}
          </section>
        ) : (
          <div className="automation-ops-secret-grid">
            {filtered.map((secret) => (
              <article key={secret.id} className="automation-ops-secret-card">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-lg border border-subtle bg-layer-2 text-accent-primary">
                    <KeyRound className="size-4" strokeWidth={1.75} />
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-tertiary hover:bg-layer-2 hover:text-primary"
                      onClick={() => copyRef(secret.key)}
                      aria-label={t("copy_link")}
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-tertiary hover:bg-layer-2 hover:text-primary"
                      onClick={() => openEdit(secret)}
                      aria-label={t("edit")}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-tertiary hover:bg-danger-subtle hover:text-danger-primary"
                      disabled={deletingId === secret.id}
                      onClick={async () => {
                        setDeletingId(secret.id);
                        try {
                          await onDelete(secret.id);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      aria-label={t("remove")}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="automation-ops-secret-key mt-3 font-semibold text-primary">{secret.key}</h3>
                {secret.description ? (
                  <p className="mt-2 text-12 leading-relaxed text-secondary">{secret.description}</p>
                ) : (
                  <p className="mt-2 text-12 italic text-placeholder">
                    {t("boards.settings.automation.ops.secrets.no_description")}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <code className="automation-ops-ref-chip">{secretRefSyntax(secret.key)}</code>
                  <span className="text-10 text-placeholder">
                    {t("boards.settings.automation.ops.secrets.updated_at", {
                      date: renderFormattedDate(secret.updated_at),
                    })}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
