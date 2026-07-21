import { Pencil, Trash2, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { IBoardCircle } from "@operoz/types";
import { cn } from "@operoz/ui";

type Props = {
  circle: IBoardCircle;
  onManageMembers: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function BoardCircleCard(props: Props) {
  const { circle, onManageMembers, onEdit, onDelete } = props;
  const { t } = useTranslation();
  const accentColor = circle.color || undefined;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150 hover:border-strong hover:shadow-raised-100">
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", !accentColor && "bg-accent-primary")}
        style={accentColor ? { backgroundColor: accentColor } : undefined}
        aria-hidden
      />

      <button type="button" className="flex flex-1 flex-col p-4 pb-3 text-left" onClick={onManageMembers}>
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "shadow-sm grid size-10 place-items-center rounded-lg border border-subtle text-accent-primary",
              !accentColor && "bg-accent-subtle"
            )}
            style={accentColor ? { backgroundColor: `${accentColor}26`, color: accentColor } : undefined}
          >
            <Users className="size-4" strokeWidth={1.75} />
          </span>
          {circle.role_name ? (
            <span className="shrink-0 rounded-full bg-accent-subtle px-2 py-0.5 text-10 font-semibold tracking-wide text-accent-primary uppercase">
              {circle.role_name}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold tracking-wide text-tertiary uppercase">
              {t("boards.settings.circles.no_role_option")}
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-1 text-14 leading-snug font-semibold text-primary">{circle.name}</h3>

        {circle.description && (
          <p className="mt-1 line-clamp-2 text-13 leading-relaxed text-tertiary">{circle.description}</p>
        )}

        <p className="mt-3 flex items-center gap-1.5 text-11 text-placeholder">
          <Users className="size-3" strokeWidth={1.75} />
          {t("boards.settings.circles.member_count", { count: circle.member_count })}
        </p>
      </button>

      <div
        className="flex items-center gap-1.5 border-t border-subtle bg-surface-1/70 px-3 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="secondary" size="sm" onClick={onManageMembers} prependIcon={<Users />} className="mr-auto">
          {t("boards.settings.circles.manage_members")}
        </Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="error-outline" size="sm" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}
