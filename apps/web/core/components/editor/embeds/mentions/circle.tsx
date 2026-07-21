import { useParams } from "next/navigation";
import useSWR from "swr";
import { Users } from "lucide-react";
import { Link } from "react-router";
// plane imports
import { useTranslation } from "@operoz/i18n";
import { Popover } from "@operoz/propel/popover";
import { cn } from "@operoz/utils";
// services
import { BoardAccessService } from "@/services/board/board-access.service";

const boardAccessService = new BoardAccessService();

type Props = {
  id: string;
};

export function EditorCircleMention(props: Props) {
  const { id } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  const { data: circle } = useSWR(
    workspaceSlug ? `EDITOR_CIRCLE_MENTION_${workspaceSlug}_${id}` : null,
    workspaceSlug ? () => boardAccessService.getCircleLookup(workspaceSlug.toString(), id) : null,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  if (!circle) {
    return (
      <div className="not-prose inline rounded-sm bg-layer-1 px-1 py-0.5 text-tertiary no-underline">
        @<Users className="inline size-3" strokeWidth={1.75} /> …
      </div>
    );
  }

  const circleLink = `/${workspaceSlug}/settings/boards/${circle.board_slug}/circulos`;

  return (
    <div
      className={cn("not-prose inline rounded-sm bg-success-subtle px-1 py-0.5 text-success-primary no-underline")}
    >
      <Popover delay={100} openOnHover>
        <Popover.Button>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" strokeWidth={1.75} />@{circle.name}
          </span>
        </Popover.Button>
        <Popover.Panel side="bottom" align="start">
          <div className="w-60 rounded-lg border-[0.5px] border-strong bg-surface-1 p-3 shadow-raised-200">
            <div className="flex items-center gap-3">
              <span className="grid size-10 flex-shrink-0 place-items-center rounded-lg bg-success-subtle text-success-primary">
                <Users className="size-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="not-prose truncate text-13 font-medium text-primary">{circle.name}</p>
                <p className="text-11 text-secondary">
                  {t("editor.mentions.circle_member_count", { count: circle.member_count })}
                </p>
              </div>
            </div>
            <Link
              to={circleLink}
              className="not-prose mt-2 block text-11 font-medium text-accent-primary hover:underline"
            >
              {t("editor.mentions.view_circle")}
            </Link>
          </div>
        </Popover.Panel>
      </Popover>
    </div>
  );
}
