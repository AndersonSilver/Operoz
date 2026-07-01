import { useTheme } from "next-themes";
import { Toast } from "@operoz/propel/toast";
import { resolveGeneralTheme } from "@operoz/utils";

export function ToastWithTheme() {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
}
