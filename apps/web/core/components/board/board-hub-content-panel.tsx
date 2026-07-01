/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { cn } from "@plane/utils";
import { useBoardHubHasBackground } from "@/components/board/board-hub-background";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Área de conteúdo abaixo do header do projeto.
 * Com wallpaper: margem e moldura leve; o fundo sólido fica a cargo do conteúdo (ex.: cronograma).
 */
export function BoardHubContentPanel({ children, className }: Props) {
  const hasBackground = useBoardHubHasBackground();

  return (
    <div
      className={cn(
        "box-border flex h-full min-h-0 w-full flex-col",
        hasBackground && "p-4 md:p-5"
      )}
    >
      <div
        className={cn(
          "box-border flex min-h-0 flex-1 flex-col overflow-hidden",
          hasBackground
            ? "rounded-lg border border-subtle/50"
            : "border-t border-subtle bg-surface-1",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
