import { useTheme } from "next-themes";
import { Toast } from "@operis/propel/toast";
import { resolveGeneralTheme } from "@operis/utils";

export function ToastWithTheme() {
  const { resolvedTheme } = useTheme();
  return <Toast theme={resolveGeneralTheme(resolvedTheme)} />;
}
