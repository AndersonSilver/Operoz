import { useTranslation } from "@operoz/i18n";
import type { IBoardCustomField, TBoardFieldFormSpan } from "@operoz/types";
import { CustomMenu } from "@operoz/ui";

type Props = {
  field: IBoardCustomField;
  onSetFormSpan: (formSpan: TBoardFieldFormSpan) => void;
};

export function BoardFieldLayoutMenu(props: Props) {
  const { field, onSetFormSpan } = props;
  const { t } = useTranslation();
  const current = field.form_span ?? "half";

  return (
    <>
      <CustomMenu.MenuItem onClick={() => onSetFormSpan("half")}>
        {current === "half" ? "✓ " : ""}
        {t("boards.settings.fields.form_span_half")}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => onSetFormSpan("full")}>
        {current === "full" ? "✓ " : ""}
        {t("boards.settings.fields.form_span_full")}
      </CustomMenu.MenuItem>
    </>
  );
}
