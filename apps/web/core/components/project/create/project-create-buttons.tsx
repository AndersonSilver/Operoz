import { useFormContext } from "react-hook-form";
// plane imports
import { ETabIndices } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { IProject } from "@operis/types";
// ui
// helpers
import { getTabIndex } from "@operis/utils";

type Props = {
  handleClose: () => void;
  isMobile?: boolean;
};

function ProjectCreateButtons(props: Props) {
  const { t } = useTranslation();
  const { handleClose, isMobile = false } = props;
  const {
    formState: { isSubmitting },
  } = useFormContext<IProject>();

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  return (
    <div className="flex justify-end gap-2 border-t border-subtle py-4">
      <Button variant="secondary" size="lg" onClick={handleClose} tabIndex={getIndex("cancel")}>
        {t("common.cancel")}
      </Button>
      <Button variant="primary" size="lg" type="submit" loading={isSubmitting} tabIndex={getIndex("submit")}>
        {isSubmitting ? t("creating") : t("create_project")}
      </Button>
    </div>
  );
}

export default ProjectCreateButtons;
