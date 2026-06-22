"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import {
  articleDescriptionKey,
  articleParagraphKey,
  articleStepKey,
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

function DocsSectionHeading(props: { children: React.ReactNode }) {
  return <h2 className="text-15 mb-4 font-semibold tracking-tight text-primary">{props.children}</h2>;
}

export const OperozDocsArticle = observer(function OperozDocsArticle({ category, articleSlug }: Props) {
  const { workspaceSlug } = useParams();
  const { t, tRaw } = useTranslation();
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
    tRaw(articleParagraphKey(article.articleKey, i))
  );
  const steps =
    article.stepCount && article.stepCount > 0
      ? Array.from({ length: article.stepCount }, (_, i) => tRaw(articleStepKey(article.articleKey, i)))
      : [];
  const tips =
    article.tipCount && article.tipCount > 0
      ? Array.from({ length: article.tipCount }, (_, i) => tRaw(articleTipKey(article.articleKey, i)))
      : [];

  return (
    <div className="vertical-scrollbar h-full overflow-y-auto bg-surface-1">
      <article className="w-full px-6 py-8 sm:px-10 sm:py-12 lg:px-12 xl:px-14">
        <p className="mb-3 text-12 font-medium text-tertiary">{t(article.categoryLabelKey)}</p>
        <h1 className="mb-4 text-24 font-semibold tracking-tight text-primary">
          {t(articleTitleKey(article.articleKey))}
        </h1>
        <p className="text-15 mb-10 leading-relaxed text-secondary">
          {tRaw(articleDescriptionKey(article.articleKey))}
        </p>

        {paragraphs.length > 0 && (
          <section className="mb-10 flex flex-col gap-5">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-14 leading-[1.75] text-primary">
                {paragraph}
              </p>
            ))}
          </section>
        )}

        {steps.length > 0 && (
          <section className="mb-10">
            <DocsSectionHeading>{t("operoz_manual.steps_label")}</DocsSectionHeading>
            <ol className="grid grid-cols-1 gap-2 2xl:grid-cols-2 2xl:gap-x-4">
              {steps.map((step, index) => (
                <li
                  key={index}
                  className="flex gap-3 rounded-md border border-subtle bg-layer-1 px-4 py-3.5 transition-colors hover:bg-layer-1-hover"
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-12 font-semibold text-accent-primary tabular-nums"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <p className="min-w-0 pt-0.5 text-14 leading-[1.7] text-primary">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {tips.length > 0 && (
          <section className="mb-10 rounded-md border border-l-[3px] border-subtle border-l-accent-strong bg-layer-2 px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="size-4 shrink-0 text-accent-primary" strokeWidth={1.75} />
              <p className="text-15 font-semibold tracking-tight text-primary">{t("operoz_manual.tips_label")}</p>
            </div>
            <ul className="flex flex-col gap-3 pl-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-13 leading-relaxed text-secondary">
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav
          className={cn(
            "mt-12 flex gap-4 border-t border-subtle pt-8",
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
