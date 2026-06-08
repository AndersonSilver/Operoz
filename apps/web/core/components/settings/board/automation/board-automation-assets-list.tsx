import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Input, Loader, cn } from "@operis/ui";
import { ASSET_THEME, type AutomationAssetTheme } from "./automation-asset-theme";
import { AutomationCardMeta } from "./automation-card-meta";
import { AutomationCreateCard } from "./automation-create-card";
import { AutomationGridCard } from "./automation-grid-card";
import { AutomationListHero } from "./automation-list-hero";
import "./automation-list.css";

export type AutomationAssetListItem = {
  id: string;
  name: string;
  description?: string;
  subtitle?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  metaLabel?: string;
};

type Props = {
  icon: LucideIcon;
  theme: AutomationAssetTheme;
  heroTitle: string;
  lead: string;
  listTitle: string;
  createLabel: string;
  createHint?: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  items: AutomationAssetListItem[];
  loading: boolean;
  creating: boolean;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  resolveUser: (userId: string | null | undefined) => string | null;
};

export function BoardAutomationAssetsList(props: Props) {
  const {
    icon: Icon,
    theme,
    heroTitle,
    lead,
    listTitle,
    createLabel,
    createHint,
    searchPlaceholder,
    emptyTitle,
    emptyDescription,
    items,
    loading,
    creating,
    onCreate,
    onEdit,
    onDelete,
    onToggleActive,
    resolveUser,
  } = props;
  const { t } = useTranslation();
  const colors = ASSET_THEME[theme];
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q)
    );
  }, [items, search]);

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-13 text-tertiary">
        <Loader />
        {t("loading")}
      </div>
    );
  }

  const heroGradient = theme === "mail" ? "from-success-subtle/35" : "from-accent-subtle/45";
  const accentBar = theme === "mail" ? "bg-success-primary" : "bg-accent-primary";
  const createAccent = theme === "mail" ? "text-success-primary" : "text-accent-primary";

  return (
    <div className="space-y-6">
      <AutomationListHero
        icon={Icon}
        title={heroTitle}
        description={lead}
        createLabel={createLabel}
        createHint={createHint}
        creating={creating}
        onCreate={onCreate}
        accentClass={cn(colors.iconWrap, colors.iconColor, "border-subtle")}
        gradientClass={heroGradient}
        showIllustration={false}
      />

      {items.length === 0 ? (
        <div className="automation-card-grid">
          <AutomationCreateCard
            label={createLabel}
            hint={emptyDescription}
            loading={creating}
            onClick={onCreate}
            accentClass={createAccent}
          />
        </div>
      ) : (
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-13 font-semibold text-secondary">{listTitle}</h2>
              <span className="rounded-full bg-layer-2 px-2 py-0.5 text-11 text-tertiary">{items.length}</span>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-placeholder" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border-subtle bg-layer-1 pl-8 text-13"
              />
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <p className="rounded-xl border border-subtle bg-layer-1 px-4 py-10 text-center text-13 text-tertiary">
              {t("boards.settings.automation.assets.no_results")}
            </p>
          ) : (
            <div className="automation-card-grid">
              {filteredItems.map((item) => (
                <AutomationGridCard
                  key={item.id}
                  title={item.name}
                  isActive={item.is_active}
                  accentBarClass={accentBar}
                  icon={
                    <span
                      className={cn(
                        "grid size-10 place-items-center rounded-lg border border-subtle shadow-sm",
                        item.is_active
                          ? cn(colors.iconWrap, colors.iconColor)
                          : "bg-layer-2 text-tertiary"
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                  }
                  description={
                    item.subtitle ? (
                      <>
                        <span className="block truncate font-medium text-secondary">{item.subtitle}</span>
                        {item.description && (
                          <span className="mt-0.5 block line-clamp-1 font-normal">{item.description}</span>
                        )}
                      </>
                    ) : (
                      item.description ||
                      t("boards.settings.automation.assets_list.no_description")
                    )
                  }
                  badges={
                    item.metaLabel ? (
                      <span className="inline-flex rounded-md border border-subtle bg-layer-2 px-2 py-0.5 text-10 font-medium text-tertiary">
                        {item.metaLabel}
                      </span>
                    ) : undefined
                  }
                  meta={
                    <AutomationCardMeta
                      createdAt={item.created_at}
                      updatedAt={item.updated_at}
                      createdById={item.created_by}
                      updatedById={item.updated_by}
                      resolveUser={resolveUser}
                    />
                  }
                  onOpen={() => onEdit(item.id)}
                  onToggle={() => onToggleActive(item.id)}
                  onEdit={() => onEdit(item.id)}
                  onDelete={() => onDelete(item.id)}
                />
              ))}

              <AutomationCreateCard
                label={createLabel}
                hint={createHint}
                loading={creating}
                onClick={onCreate}
                accentClass={createAccent}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
