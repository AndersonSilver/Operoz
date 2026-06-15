import { Link } from "react-router";
import type { TAssistantCitation } from "@/services/assistant.service";

type Props = {
  citation: TAssistantCitation;
  workspaceSlug: string;
};

function buildCitationHref(citation: TAssistantCitation, workspaceSlug: string): string | null {
  if (citation.type === "issue") {
    const workItem = citation.work_item ?? citation.label.split(" ")[0];
    if (workItem) return `/${workspaceSlug}/browse/${workItem}`;
  }
  if (citation.type === "page" && citation.project_id) {
    return `/${workspaceSlug}/projects/${citation.project_id}/pages/${citation.id}`;
  }
  if (citation.type === "automation_run" && citation.run_id && citation.board_slug) {
    return `/${workspaceSlug}/boards/${citation.board_slug}/settings/automation?run=${citation.run_id}`;
  }
  return null;
}

export function AssistantCitationLink({ citation, workspaceSlug }: Props) {
  const href = buildCitationHref(citation, workspaceSlug);

  if (citation.type === "issue" && href) {
    const title = citation.work_item ?? citation.label.split(" ")[0];
    const name = citation.label.replace(/^\S+\s*/, "");

    return (
      <Link
        to={href}
        className="block max-w-full rounded-md border border-subtle bg-layer-2 px-2 py-1.5 transition-colors hover:bg-layer-3"
        title={citation.label}
      >
        <p className="truncate text-11 font-medium text-accent-primary">{title}</p>
        <p className="truncate text-11 text-primary">{name}</p>
        <div className="mt-1 flex flex-wrap gap-1 text-10 text-tertiary">
          {citation.state && <span className="rounded bg-layer-1 px-1">{citation.state}</span>}
          {citation.priority && <span className="rounded bg-layer-1 px-1">{citation.priority}</span>}
          {citation.assignee && <span className="truncate">{citation.assignee}</span>}
        </div>
      </Link>
    );
  }

  const className =
    "inline-flex max-w-full items-center rounded bg-layer-2 px-1.5 py-0.5 text-10 text-accent-primary hover:bg-layer-3 truncate";

  if (!href) {
    return <span className={className.replace("text-accent-primary", "text-tertiary")}>{citation.label}</span>;
  }

  return (
    <Link to={href} className={className} title={citation.label}>
      {citation.label}
    </Link>
  );
}
