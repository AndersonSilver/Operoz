import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { observer } from "mobx-react";
import { AppHeader, type AppHeaderProps } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { cn } from "@operis/utils";
import {
  BOARD_HUB_GLASS_HEADER,
  BOARD_HUB_PROJECT_WORK_SURFACE,
  useBoardHubHasBackground,
} from "@/components/board/board-hub-background";

type ProjectViewShellProps = Pick<AppHeaderProps, "header" | "mobileHeader" | "className" | "rowClassName"> & {
  children: ReactNode;
};

/** Conteúdo dentro do cartão com vidro sobre wallpaper (legibilidade + fundo ainda visível). */
const ProjectWorkSurfaceContext = createContext(false);

export function useProjectWorkSurface(): boolean {
  return useContext(ProjectWorkSurfaceContext);
}

/**
 * Cabeçalho + conteúdo do projeto.
 * Com wallpaper: cartão em vidro fosco com margens — a imagem de fundo permanece visível à volta e através do painel.
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
    <ProjectWorkSurfaceContext.Provider value={true}>
      {/* Margens generosas para o wallpaper aparecer nas quatro laterais */}
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden px-3 py-3 md:px-5 md:py-4 lg:px-6 lg:py-5">
        <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", BOARD_HUB_PROJECT_WORK_SURFACE)}>
          <div className={cn("shrink-0 border-b", BOARD_HUB_GLASS_HEADER)}>
            <AppHeader
              header={header}
              mobileHeader={mobileHeader}
              className={className}
              rowClassName={rowClassName ?? "min-h-12 items-center px-3 py-2"}
              opaque={false}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </div>
    </ProjectWorkSurfaceContext.Provider>
  );
});
