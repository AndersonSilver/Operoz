import type { IBoardPermissionTreeNode, IBoardRole, TBoardRolePermissionsMap } from "@operoz/types";

export const boardPermissionI18nKey = (permissionKey: string) =>
  `boards.settings.permissions.keys.${permissionKey.replace(/\./g, "_")}`;

export const rolePermissionsToMap = (role: IBoardRole): TBoardRolePermissionsMap => {
  const map: TBoardRolePermissionsMap = {};
  for (const p of role.permissions ?? []) {
    map[p.permission_key] = p.granted;
  }
  return map;
};

export const emptyPermissionsMap = (keys: string[]): TBoardRolePermissionsMap =>
  Object.fromEntries(keys.map((k) => [k, false]));

export const flattenPermissionTree = (tree: IBoardPermissionTreeNode[]) => {
  const rows: { key: string; depth: number; hasChildren: boolean }[] = [];
  for (const node of tree) {
    const children = node.children ?? [];
    rows.push({ key: node.key, depth: 0, hasChildren: children.length > 0 });
    for (const childKey of children) {
      rows.push({ key: childKey, depth: 1, hasChildren: false });
    }
  }
  return rows;
};

export const setPermissionWithChildren = (
  map: TBoardRolePermissionsMap,
  tree: IBoardPermissionTreeNode[],
  key: string,
  granted: boolean
): TBoardRolePermissionsMap => {
  const next = { ...map, [key]: granted };
  const node = tree.find((n) => n.key === key);
  if (node?.children?.length) {
    for (const child of node.children) {
      next[child] = granted;
    }
  }
  return next;
};
