import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Briefcase, Mail, Phone, Plus, Star, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IProject, IProjectContact, TProjectContactCategory } from "@operoz/types";
import { Avatar, Input } from "@operoz/ui";
// constants
import { PROJECT_CONTACTS } from "@/constants/fetch-keys";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import { ProjectContactService } from "@/services/project";
// local imports
import { MemberSelect } from "./member-select";

const projectContactService = new ProjectContactService();

type TProjectContactsSectionProps = {
  workspaceSlug: string;
  project: IProject;
  isAdmin: boolean;
};

const rowShellClass =
  "group flex items-start gap-2.5 rounded-lg border border-subtle bg-layer-1 px-3 py-2.5 transition-colors focus-within:border-accent-subtle";
const primaryInputClass = "!p-0 text-13 font-medium";
const secondaryInputClass = "!p-0 text-11 text-tertiary";

function LeadRow({
  workspaceSlug,
  project,
  isAdmin,
}: {
  workspaceSlug: string;
  project: IProject;
  isAdmin: boolean;
}) {
  const { t } = useTranslation();
  const { updateProject } = useProject();

  const handleChange = async (value: string) => {
    try {
      await updateProject(workspaceSlug, project.id, { project_lead: value === "none" ? null : value });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const leadValue =
    project.project_lead && typeof project.project_lead === "object"
      ? project.project_lead.id
      : project.project_lead;

  return (
    <div className={rowShellClass}>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-11 font-medium text-secondary">{t("project.contacts.lead_row_label")}</span>
          <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-10 font-medium text-accent-primary">
            {t("project.contacts.lead_badge")}
          </span>
        </div>
        <MemberSelect value={leadValue} onChange={handleChange} isDisabled={!isAdmin} />
      </div>
    </div>
  );
}

type TContactRowProps = {
  contact: IProjectContact;
  isAdmin: boolean;
  isPrincipal?: boolean;
  showPrincipalToggle?: boolean;
  onFieldSave: (id: string, field: keyof IProjectContact, value: string) => void;
  onTogglePrincipal?: (id: string) => void;
  onRemove: (id: string) => void;
};

function ContactRow(props: TContactRowProps) {
  const { contact, isAdmin, isPrincipal, showPrincipalToggle, onFieldSave, onTogglePrincipal, onRemove } = props;
  const { t } = useTranslation();

  return (
    <div className={rowShellClass}>
      <Avatar name={contact.full_name || "?"} size="sm" showTooltip={false} className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Input
            mode="true-transparent"
            defaultValue={contact.full_name}
            placeholder={t("project.contacts.full_name_placeholder")}
            className={`min-w-0 flex-1 ${primaryInputClass}`}
            disabled={!isAdmin}
            onBlur={(e) => onFieldSave(contact.id, "full_name", e.target.value)}
          />
          {isPrincipal && (
            <span className="shrink-0 rounded bg-accent-subtle px-1.5 py-0.5 text-10 font-medium text-accent-primary">
              {t("project.contacts.principal_badge")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Briefcase className="h-3 w-3 shrink-0 text-placeholder" />
          <Input
            mode="true-transparent"
            defaultValue={contact.role}
            placeholder={t("project.contacts.role_placeholder")}
            className={`min-w-0 flex-1 ${secondaryInputClass}`}
            disabled={!isAdmin}
            onBlur={(e) => onFieldSave(contact.id, "role", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3 shrink-0 text-placeholder" />
          <Input
            mode="true-transparent"
            type="email"
            defaultValue={contact.email}
            placeholder={t("project.contacts.email_placeholder")}
            className={`min-w-0 flex-1 ${secondaryInputClass}`}
            disabled={!isAdmin}
            onBlur={(e) => onFieldSave(contact.id, "email", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 shrink-0 text-placeholder" />
          <Input
            mode="true-transparent"
            defaultValue={contact.whatsapp}
            placeholder={t("project.contacts.whatsapp_placeholder")}
            className={`min-w-0 flex-1 ${secondaryInputClass}`}
            disabled={!isAdmin}
            onBlur={(e) => onFieldSave(contact.id, "whatsapp", e.target.value)}
          />
        </div>
      </div>
      {isAdmin && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {showPrincipalToggle && !isPrincipal && (
            <button
              type="button"
              title={t("project.contacts.mark_as_principal")}
              className="flex h-7 w-7 items-center justify-center rounded-md text-tertiary hover:bg-layer-2 hover:text-accent-primary"
              onClick={() => onTogglePrincipal?.(contact.id)}
            >
              <Star className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            title={t("project.contacts.remove_person")}
            className="flex h-7 w-7 items-center justify-center rounded-md text-tertiary hover:bg-layer-2 hover:text-danger-primary"
            onClick={() => onRemove(contact.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

type TContactListProps = {
  workspaceSlug: string;
  projectId: string;
  category: TProjectContactCategory;
  title: string;
  hint: string;
  isAdmin: boolean;
  contacts: IProjectContact[];
  showPrincipalToggle?: boolean;
  onChange: (contacts: IProjectContact[]) => void;
  /** Chamado só quando a lista desta categoria muda por ação do usuário (não no load inicial). */
  onListChanged?: (contacts: IProjectContact[]) => void;
  leadSlot?: ReactNode;
};

function ContactList(props: TContactListProps) {
  const {
    workspaceSlug,
    projectId,
    category,
    title,
    hint,
    isAdmin,
    contacts,
    showPrincipalToggle,
    onChange,
    onListChanged,
    leadSlot,
  } = props;
  const { t } = useTranslation();

  const items = contacts.filter((contact) => contact.category === category);
  const principalId = items.find((c) => c.is_lead)?.id ?? items[0]?.id;

  const commit = (next: IProjectContact[]) => {
    onChange(next);
    onListChanged?.(next);
  };

  const handleAdd = async () => {
    try {
      const created = await projectContactService.createProjectContact(workspaceSlug, projectId, {
        category,
        full_name: t("project.contacts.full_name_placeholder"),
      });
      commit([...contacts, created]);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleFieldSave = async (id: string, field: keyof IProjectContact, value: string) => {
    if (field === "full_name" && !value.trim()) return;
    const next = contacts.map((contact) => (contact.id === id ? { ...contact, [field]: value } : contact));
    commit(next);
    try {
      await projectContactService.updateProjectContact(workspaceSlug, projectId, id, { [field]: value });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleTogglePrincipal = async (id: string) => {
    const previous = contacts;
    commit(contacts.map((c) => (c.category === category ? { ...c, is_lead: c.id === id } : c)));
    try {
      await Promise.all(
        items
          .filter((c) => c.is_lead && c.id !== id)
          .map((c) => projectContactService.updateProjectContact(workspaceSlug, projectId, c.id, { is_lead: false }))
      );
      await projectContactService.updateProjectContact(workspaceSlug, projectId, id, { is_lead: true });
    } catch {
      commit(previous);
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleRemove = async (id: string) => {
    const previous = contacts;
    commit(contacts.filter((contact) => contact.id !== id));
    try {
      await projectContactService.deleteProjectContact(workspaceSlug, projectId, id);
    } catch {
      commit(previous);
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-13 font-medium">{title}</h4>
        <p className="text-11 text-tertiary">{hint}</p>
      </div>

      <div className="flex flex-col gap-2">
        {leadSlot}
        {items.length === 0 && !leadSlot && (
          <p className="text-11 text-placeholder italic">{t("project.contacts.empty")}</p>
        )}
        {items.map((contact) => (
          <ContactRow
            key={contact.id}
            contact={contact}
            isAdmin={isAdmin}
            isPrincipal={showPrincipalToggle && contact.id === principalId}
            showPrincipalToggle={showPrincipalToggle}
            onFieldSave={handleFieldSave}
            onTogglePrincipal={handleTogglePrincipal}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {isAdmin && (
        <button
          type="button"
          className="flex w-fit items-center gap-1.5 bg-transparent py-1 text-13 font-medium text-accent-primary"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
          {t("project.contacts.add_person")}
        </button>
      )}
    </div>
  );
}

export function ProjectContactsSection(props: TProjectContactsSectionProps) {
  const { workspaceSlug, project, isAdmin } = props;
  const { t } = useTranslation();
  const { updateProject } = useProject();
  const [contacts, setContacts] = useState<IProjectContact[]>([]);

  const { data, isLoading } = useSWR(
    workspaceSlug && project.id ? PROJECT_CONTACTS(workspaceSlug, project.id) : null,
    workspaceSlug && project.id ? () => projectContactService.fetchProjectContacts(workspaceSlug, project.id) : null
  );

  // Mantém o campo legado `responsible_stakeholder` (usado em exports/relatórios) sincronizado
  // com o stakeholder principal da lista, sem exigir preenchimento duplicado. Só roda quando a
  // lista de stakeholders muda por ação do usuário — nunca no load inicial, pra não apagar um
  // valor legado só porque a lista ainda não foi migrada.
  const syncPrimaryStakeholder = (nextContacts: IProjectContact[]) => {
    const stakeholders = nextContacts.filter((c) => c.category === "stakeholder");
    const primary = stakeholders.find((c) => c.is_lead) ?? stakeholders[0];
    const nextName = primary?.full_name ?? "";
    if (nextName !== (project.responsible_stakeholder ?? "")) {
      updateProject(workspaceSlug, project.id, { responsible_stakeholder: nextName }).catch(() => undefined);
    }
  };

  useEffect(() => {
    if (!data) return;
    setContacts(data);
    // Migração única: se já existia um "Stakeholder responsável" (texto legado) e a lista
    // ainda está vazia, converte esse valor no primeiro contato em vez de perdê-lo.
    const hasStakeholder = data.some((c) => c.category === "stakeholder");
    const legacyName = (project.responsible_stakeholder ?? "").trim();
    if (!hasStakeholder && legacyName) {
      projectContactService
        .createProjectContact(workspaceSlug, project.id, {
          category: "stakeholder",
          full_name: legacyName,
          is_lead: true,
        })
        .then((created) => setContacts((prev) => [...prev, created]))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <ContactList
        workspaceSlug={workspaceSlug}
        projectId={project.id}
        category="responsible"
        title={t("project.contacts.responsible_title")}
        hint={t("project.contacts.responsible_hint")}
        isAdmin={isAdmin}
        contacts={contacts}
        onChange={setContacts}
        leadSlot={<LeadRow workspaceSlug={workspaceSlug} project={project} isAdmin={isAdmin} />}
      />
      <ContactList
        workspaceSlug={workspaceSlug}
        projectId={project.id}
        category="stakeholder"
        title={t("project.contacts.stakeholder_title")}
        hint={t("project.contacts.stakeholder_hint")}
        isAdmin={isAdmin}
        contacts={contacts}
        showPrincipalToggle
        onChange={setContacts}
        onListChanged={syncPrimaryStakeholder}
      />
    </div>
  );
}
