import { ArchiveIcon, Earth } from "lucide-react";
import { EPageAccess } from "@operis/constants";
import { LockIcon } from "@operis/propel/icons";
import type { TPage } from "@operis/types";

export function PageAccessIcon(page: TPage) {
  return (
    <div>
      {page.archived_at ? (
        <ArchiveIcon className="h-2.5 w-2.5 text-tertiary" />
      ) : page.access === EPageAccess.PUBLIC ? (
        <Earth className="h-2.5 w-2.5 text-tertiary" />
      ) : (
        <LockIcon className="h-2.5 w-2.5 text-tertiary" />
      )}
    </div>
  );
}
