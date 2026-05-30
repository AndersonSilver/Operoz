import { useTheme } from "next-themes";
// plane imports
import { Toast } from "@operis/propel/toast";
import { resolveGeneralTheme } from "@operis/utils";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // themes
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toast theme={resolveGeneralTheme(resolvedTheme)} />
      {children}
    </>
  );
}
