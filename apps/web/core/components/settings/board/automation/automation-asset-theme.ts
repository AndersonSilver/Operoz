export type AutomationAssetTheme = "code" | "mail";

export const ASSET_THEME: Record<
  AutomationAssetTheme,
  {
    iconWrap: string;
    iconColor: string;
    selectedBorder: string;
    selectedBg: string;
    accentBar: string;
  }
> = {
  code: {
    iconWrap: "bg-accent-subtle",
    iconColor: "text-accent-primary",
    selectedBorder: "border-accent-subtle",
    selectedBg: "bg-accent-subtle/25",
    accentBar: "bg-accent-primary",
  },
  mail: {
    iconWrap: "bg-success-subtle",
    iconColor: "text-success-primary",
    selectedBorder: "border-success-subtle",
    selectedBg: "bg-success-subtle/25",
    accentBar: "bg-success-primary",
  },
};
