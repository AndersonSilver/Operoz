import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { AppHeader, type AppHeaderProps } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { BoardHubContentPanel } from "@/components/board/board-hub-content-panel";
import { useBoardHubHasBackground } from "@/components/board/board-hub-background";

type ProjectViewShellProps = Pick<AppHeaderProps, "header" | "mobileHeader" | "className" | "rowClassName"> & {
  children: ReactNode;
};

/**
 * Cabeçalho + conteúdo do projeto. Com wallpaper do board, o painel principal fica
 * abaixo do header (sem “faixa” dupla nem botões soltos sobre o fundo).
 */
export const ProjectViewShell = observer(function ProjectViewShell(props: ProjectViewShellProps) {
  const { header, mobileHeader, className, rowClassName, children } = props;
  const hasBackground = useBoardHubHasBackground();

  if (!hasBackground) {
    return (
      <>
        <AppHeader header={header} mobileHeader={mobileHeader} className={className} />
        <ContentWrapper>{children}</ContentWrapper>
      </>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <AppHeader
        header={header}
        mobileHeader={mobileHeader}
        className={className}
        rowClassName={rowClassName ?? "h-auto min-h-11 items-center py-2"}
      />
      <BoardHubContentPanel className="min-h-0 flex-1">{children}</BoardHubContentPanel>
    </div>
  );
});
