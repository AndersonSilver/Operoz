import { I18nProvider } from "./i18n.provider";

export function ExtendedProviders({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}
