import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Menu, Settings } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Breadcrumbs } from "@operis/ui";
import { BreadcrumbLink } from "../breadcrumb-link";
import { useTheme } from "@/hooks/store";
import { BREADCRUMB_SEGMENT_KEYS } from "./core";
import { EXTENDED_HEADER_SEGMENT_LABELS } from "./extended";

export const HamburgerToggle = observer(function HamburgerToggle() {
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  return (
    <button
      className="group flex size-7 cursor-pointer items-center justify-center rounded-sm bg-layer-1 transition-all hover:bg-layer-1-hover md:hidden"
      onClick={() => toggleSidebar(!isSidebarCollapsed)}
    >
      <Menu size={14} className="text-secondary transition-all group-hover:text-primary" />
    </button>
  );
});

export const AdminHeader = observer(function AdminHeader() {
  const pathName = usePathname();
  const { t } = useTranslation();

  const generateBreadcrumbItems = (pathname: string) => {
    const pathSegments = pathname.split("/").slice(1);
    pathSegments.pop();

    let currentUrl = "";
    return pathSegments.map((segment) => {
      currentUrl += "/" + segment;
      const key = BREADCRUMB_SEGMENT_KEYS[segment];
      const extended = EXTENDED_HEADER_SEGMENT_LABELS[segment];
      return {
        title: key ? t(key) : (extended ?? segment.toUpperCase()),
        href: currentUrl,
      };
    });
  };

  const breadcrumbItems = generateBreadcrumbItems(pathName || "");

  return (
    <div className="relative z-10 flex h-header w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-subtle bg-surface-1 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <HamburgerToggle />
        {breadcrumbItems.length >= 0 && (
          <div>
            <Breadcrumbs>
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    href="/general/"
                    label={t("god_mode.brand.settings")}
                    icon={<Settings className="h-4 w-4 text-tertiary" />}
                  />
                }
              />
              {breadcrumbItems.map(
                (item) =>
                  item.title && (
                    <Breadcrumbs.Item
                      key={item.href}
                      component={<BreadcrumbLink href={item.href} label={item.title} />}
                    />
                  )
              )}
            </Breadcrumbs>
          </div>
        )}
      </div>
    </div>
  );
});
