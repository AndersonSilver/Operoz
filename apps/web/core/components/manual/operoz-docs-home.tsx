"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { OPEROZ_DOCS_CATEGORIES, getDocsArticlePath } from "./operoz-docs-nav";

export const OperozDocsHome = observer(function OperozDocsHome() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const slug = workspaceSlug?.toString() ?? "";

  return (
    <div className="vertical-scrollbar h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10 sm:py-14">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-accent-primary/10 p-3">
            <BookOpen className="size-8 text-accent-primary" />
          </div>
          <h1 className="mb-3 text-24 font-semibold tracking-tight text-primary sm:text-28">
            {t("operoz_manual.home.hero_title")}
          </h1>
          <p className="text-15 mx-auto max-w-2xl leading-relaxed text-secondary">
            {t("operoz_manual.home.hero_subtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={getDocsArticlePath(slug, "get-started", "introduction")}
              className="inline-flex items-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-13 font-medium text-on-color hover:bg-accent-primary-hover"
            >
              {t("operoz_manual.home.get_started")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={getDocsArticlePath(slug, "get-started", "quickstart")}
              className="inline-flex items-center gap-2 rounded-md border border-subtle bg-layer-1 px-4 py-2 text-13 font-medium text-primary hover:bg-layer-1-hover"
            >
              {t("operoz_manual.home.quickstart")}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {OPEROZ_DOCS_CATEGORIES.map((category) => {
            const firstArticle = category.articles[0];
            const href = firstArticle ? getDocsArticlePath(slug, category.key, firstArticle.slug) : `/${slug}/manual`;
            return (
              <Link
                key={category.key}
                href={href}
                className="group hover:border-accent-primary/30 flex flex-col rounded-lg border border-subtle bg-surface-1 p-5 transition-colors hover:bg-layer-1"
              >
                <h2 className="text-15 mb-2 font-semibold text-primary group-hover:text-accent-primary">
                  {t(category.labelKey)}
                </h2>
                <p className="mb-4 flex-1 text-13 leading-relaxed text-secondary">{t(category.homeDescriptionKey)}</p>
                <span className="inline-flex items-center gap-1 text-13 font-medium text-accent-primary">
                  {t(category.homeLinkKey)}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-center text-13 text-tertiary">{t("operoz_manual.footer")}</p>
      </div>
    </div>
  );
});
