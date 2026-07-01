"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BookOpen, ChevronDown, Search } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
import { OPEROZ_DOCS_CATEGORIES, articleTitleKey, flattenDocsArticles, getDocsArticlePath } from "./operoz-docs-nav";

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export const OperozDocsSidebar = observer(function OperozDocsSidebar() {
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const slug = workspaceSlug?.toString() ?? "";

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    OPEROZ_DOCS_CATEGORIES.forEach((cat) => {
      const isActive = cat.articles.some((a) => pathname?.includes(`/manual/${cat.key}/${a.slug}`));
      initial[cat.key] = isActive || cat.key === "get-started";
    });
    return initial;
  });

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flattenDocsArticles().filter((article) => {
      const title = t(articleTitleKey(article.articleKey)).toLowerCase();
      const category = t(article.categoryLabelKey).toLowerCase();
      return title.includes(q) || category.includes(q) || article.slug.includes(q);
    });
  }, [query, t]);

  const manualHome = `/${slug}/manual`;
  const isHome = normalizePath(pathname ?? "") === normalizePath(manualHome);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-t border-subtle bg-surface-1 md:w-64 md:border-t-0 md:border-l">
      <div className="border-b border-subtle px-3 py-3">
        <Link
          href={manualHome}
          className="mb-3 flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-layer-transparent-hover"
        >
          <div className="grid size-7 place-items-center rounded-md bg-accent-primary/10">
            <BookOpen className="size-4 text-accent-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-13 font-semibold text-primary">{t("operoz_manual.title")}</p>
            <p className="truncate text-11 text-tertiary">{t("operoz_manual.subtitle")}</p>
          </div>
        </Link>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("operoz_manual.search_placeholder")}
            className="focus:border-accent-primary w-full rounded-md border border-subtle bg-layer-1 py-1.5 pr-2 pl-8 text-13 text-primary placeholder:text-tertiary focus:outline-none"
          />
        </div>
      </div>

      <nav className="vertical-scrollbar flex-1 overflow-y-auto px-2 py-2">
        {filteredArticles ? (
          <ul className="flex flex-col gap-0.5">
            {filteredArticles.length === 0 ? (
              <li className="px-2 py-4 text-center text-13 text-tertiary">{t("operoz_manual.search_empty")}</li>
            ) : (
              filteredArticles.map((article) => {
                const href = getDocsArticlePath(slug, article.category, article.slug);
                const active = pathname?.includes(href);
                return (
                  <li key={`${article.category}-${article.slug}`}>
                    <Link
                      href={href}
                      onClick={() => setQuery("")}
                      className={cn(
                        "block rounded-md px-2 py-1.5 text-13 transition-colors",
                        active
                          ? "bg-layer-transparent-selected font-medium text-primary"
                          : "text-secondary hover:bg-layer-transparent-hover hover:text-primary"
                      )}
                    >
                      <span className="block text-11 text-tertiary">{t(article.categoryLabelKey)}</span>
                      <span>{t(articleTitleKey(article.articleKey))}</span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        ) : (
          <>
            <Link
              href={manualHome}
              className={cn(
                "mb-2 block rounded-md px-2 py-1.5 text-13 font-medium transition-colors",
                isHome
                  ? "bg-layer-transparent-selected text-primary"
                  : "text-secondary hover:bg-layer-transparent-hover hover:text-primary"
              )}
            >
              {t("operoz_manual.home.nav_label")}
            </Link>
            {OPEROZ_DOCS_CATEGORIES.map((category) => {
              const isOpen = expanded[category.key] ?? false;
              return (
                <div key={category.key} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [category.key]: !prev[category.key] }))}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-11 font-medium tracking-wide text-tertiary uppercase hover:bg-layer-transparent-hover hover:text-secondary"
                  >
                    <span>{t(category.labelKey)}</span>
                    <ChevronDown className={cn("size-3.5 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <ul className="mt-0.5 flex flex-col gap-0.5 pl-1">
                      {category.articles.map((article) => {
                        const href = getDocsArticlePath(slug, category.key, article.slug);
                        const active = pathname?.includes(href);
                        return (
                          <li key={article.slug}>
                            <Link
                              href={href}
                              className={cn(
                                "block rounded-md px-2 py-1.5 text-13 transition-colors",
                                active
                                  ? "bg-layer-transparent-selected font-medium text-primary"
                                  : "text-secondary hover:bg-layer-transparent-hover hover:text-primary"
                              )}
                            >
                              {t(articleTitleKey(article.articleKey))}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
});
