import { FileDown, FileText } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { CustomMenu } from "@operoz/ui";
import { cn } from "@operoz/utils";
import {
  useClient360QbrExport,
  type Client360QbrExportParams,
} from "@/components/board/client-360/use-client-360-qbr-export";

type Props = {
  params: Client360QbrExportParams;
  disabled?: boolean;
  variant?: "button" | "menu-items";
  buttonVariant?: "primary" | "secondary" | "tertiary" | "ghost" | "link";
  buttonSize?: "sm" | "base" | "lg" | "xl";
  className?: string;
  menuClassName?: string;
};

export function Client360QbrExportMenu({
  params,
  disabled = false,
  variant = "button",
  buttonVariant = "secondary",
  buttonSize = "sm",
  className,
  menuClassName,
}: Props) {
  const { t } = useTranslation();
  const { exportQbr, exporting } = useClient360QbrExport(params);

  const mdItem = (
    <CustomMenu.MenuItem
      className="flex items-center gap-2"
      disabled={disabled || exporting}
      onClick={() => exportQbr("md")}
    >
      <FileText className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate">{t("boards.client_360.qbr_export_md")}</span>
    </CustomMenu.MenuItem>
  );

  const pdfItem = (
    <CustomMenu.MenuItem
      className="flex items-center gap-2"
      disabled={disabled || exporting}
      onClick={() => exportQbr("pdf")}
    >
      <FileDown className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate">{t("boards.client_360.qbr_export_pdf")}</span>
    </CustomMenu.MenuItem>
  );

  if (variant === "menu-items") {
    return (
      <>
        <div className="border-b border-subtle px-3 py-2 text-11 font-medium tracking-wide text-tertiary uppercase">
          {t("boards.client_360.qbr_export_label")}
        </div>
        {mdItem}
        {pdfItem}
      </>
    );
  }

  return (
    <CustomMenu
      className={cn("inline-flex items-center", menuClassName)}
      placement="bottom-end"
      customButton={
        <Button
          variant={buttonVariant}
          size={buttonSize}
          disabled={disabled || exporting}
          className={cn("shrink-0", className)}
        >
          <FileDown className="size-3.5" strokeWidth={1.75} />
          {exporting ? t("boards.client_360.qbr_exporting") : t("boards.client_360.qbr_export_label")}
        </Button>
      }
    >
      {mdItem}
      {pdfItem}
    </CustomMenu>
  );
}
