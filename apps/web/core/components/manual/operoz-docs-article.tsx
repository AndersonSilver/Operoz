"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import {
  articleDescriptionKey,
  articleParagraphKey,
  articleTipKey,
  articleTitleKey,
  findDocsArticle,
  getAdjacentArticles,
  getDocsArticlePath,
} from "./operoz-docs-nav";

type Props = {
  category: string;
  articleSlug: string;
};

export const OperozDocsArticle = observer(function OperozDocsArticle({ category, articleSlug }: Props) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const slug = workspaceSlug?.toString() ?? "";

  const article = findDocsArticle(category, articleSlug);

  if (!article) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-15 font-medium text-primary">{t("operoz_manual.article_not_found")}</p>
        <Link href={`/${slug}/manual`} className="text-13 text-accent-primary hover:underline">
          {t("operoz_manual.back_to_home")}
        </Link>
      </div>
    );
  }

  const { prev, next } = getAdjacentArticles(category, articleSlug);
  const paragraphs = Array.from({ length: article.paragraphCount }, (_, i) =>
    t(articleParagraphKey(article.articleKey, i))
  );
  const tips =
    article.tipCount && article.tipCount > 0
      ? Array.from({ length: article.tipCount }, (_, i) => t(articleTipKey(article.articleKey, i)))
      : [];

  return (
    <div className="vertical-scrollbar h-full overflow-y-auto">
      <article className="mx-auto max-w-3xl px-6 py-8 sm:px-10 sm:py-10">
        <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">{t(article.categoryLabelKey)}</p>
        <h1 className="text-22 mb-3 font-semibold tracking-tight text-primary sm:text-24">
          {t(articleTitleKey(article.articleKey))}
        </h1>
        <p className="text-15 mb-8 leading-relaxed text-secondary">{t(articleDescriptionKey(article.articleKey))}</p>

        <div className="flex flex-col gap-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-14 leading-relaxed text-primary">
              {paragraph}
            </p>
          ))}
        </div>

        {tips.length > 0 && (
          <div className="mt-8 rounded-lg border border-subtle bg-layer-2 px-5 py-4">
            <p className="mb-3 text-11 font-medium tracking-wide text-tertiary uppercase">
              {t("operoz_manual.tips_label")}
            </p>
            <ul className="flex flex-col gap-2.5">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2.5 text-13 text-primary">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav
          className={cn(
            "mt-10 flex gap-4 border-t border-subtle pt-6",
            prev && next ? "justify-between" : prev ? "justify-start" : "justify-end"
          )}
          aria-label={t("operoz_manual.pagination_label")}
        >
          {prev && (
            <Link
              href={getDocsArticlePath(slug, prev.category, prev.slug)}
              className="group hover:border-accent-primary/30 flex max-w-[45%] flex-col gap-1 rounded-md border border-subtle bg-layer-1 px-4 py-3 transition-colors hover:bg-layer-1-hover"
            >
              <span className="inline-flex items-center gap-1 text-11 text-tertiary">
                <ArrowLeft className="size-3" />
                {t("operoz_manual.prev_article")}
              </span>
              <span className="truncate text-13 font-medium text-primary group-hover:text-accent-primary">
                {t(articleTitleKey(prev.articleKey))}
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={getDocsArticlePath(slug, next.category, next.slug)}
              className="group hover:border-accent-primary/30 flex max-w-[45%] flex-col items-end gap-1 rounded-md border border-subtle bg-layer-1 px-4 py-3 text-right transition-colors hover:bg-layer-1-hover"
            >
              <span className="inline-flex items-center gap-1 text-11 text-tertiary">
                {t("operoz_manual.next_article")}
                <ArrowRight className="size-3" />
              </span>
              <span className="truncate text-13 font-medium text-primary group-hover:text-accent-primary">
                {t(articleTitleKey(next.articleKey))}
              </span>
            </Link>
          )}
        </nav>
      </article>
    </div>
  );
});
