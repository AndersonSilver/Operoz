import { PageHead } from "@/components/core/page-title";
import { OperozDocsArticle } from "@/components/manual/operoz-docs-article";
import type { Route } from "./+types/page";

export default function WorkspaceManualArticlePage({ params }: Route.ComponentProps) {
  const { category, article } = params;

  return (
    <>
      <PageHead title="Documentação Operoz" />
      <OperozDocsArticle category={category} articleSlug={article} />
    </>
  );
}
