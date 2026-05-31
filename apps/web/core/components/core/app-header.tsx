import type { ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import { Row } from "@operis/ui";
// components
import { cn } from "@operis/utils";
import { useBoardHubHasBackground } from "@/components/board/board-hub-background";
import { ExtendedAppHeader } from "@/plane-web/components/common/extended-app-header";

export interface AppHeaderProps {
  header: ReactNode;
  mobileHeader?: ReactNode;
  className?: string;
  rowClassName?: string;
  /** Quando false, a linha do cabeçalho fica transparente (wallpaper do board visível por baixo). */
  opaque?: boolean;
}

export const AppHeader = observer(function AppHeader(props: AppHeaderProps) {
  const { header, mobileHeader, className, rowClassName, opaque = true } = props;
  const hasBoardWallpaper = useBoardHubHasBackground();
  const isTransparentHeader = hasBoardWallpaper || !opaque;

  return (
    <div className={cn("relative z-[2] shrink-0", className)}>
      <Row
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-2",
          isTransparentHeader ? "border-none bg-transparent" : "border-b border-subtle bg-surface-1",
          rowClassName
        )}
      >
        <ExtendedAppHeader header={header} />
      </Row>
      {mobileHeader}
    </div>
  );
});
