import { useTheme } from "next-themes";
// plane imports
import { Toast } from "@operoz/propel/toast";
import { resolveGeneralTheme } from "@operoz/utils";

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
