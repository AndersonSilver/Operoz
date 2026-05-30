/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { IBoardPermissionTreeNode, TBoardRolePermissionsMap } from "@plane/types";
import { Checkbox } from "@plane/ui";
import {
  boardPermissionI18nKey,
  flattenPermissionTree,
  setPermissionWithChildren,
} from "./board-permission-utils";

type Props = {
  boardName: string;
  tree: IBoardPermissionTreeNode[];
  value: TBoardRolePermissionsMap;
  onChange: (next: TBoardRolePermissionsMap) => void;
  disabled?: boolean;
};

export const BoardRolePermissionsTree = observer(function BoardRolePermissionsTree(props: Props) {
  const { boardName, tree, value, onChange, disabled = false } = props;
  const { t } = useTranslation();
  const rows = flattenPermissionTree(tree);

  return (
    <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border border-subtle bg-layer-1 p-3">
      <p className="mb-2 text-11 font-medium text-secondary">
        {t("boards.settings.roles.permissions_section", { board: boardName })}
      </p>
      {rows.map((row) => (
        <label
          key={row.key}
          className="flex cursor-pointer items-start gap-2 py-1"
          style={{ paddingLeft: row.depth * 20 }}
        >
          <Checkbox
            checked={Boolean(value[row.key])}
            disabled={disabled}
            onChange={() => {
              onChange(setPermissionWithChildren(value, tree, row.key, !value[row.key]));
            }}
          />
          <span className="text-13 text-primary">{t(boardPermissionI18nKey(row.key), { board: boardName })}</span>
        </label>
      ))}
    </div>
  );
});
