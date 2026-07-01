import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@operoz/i18n";
import { cn, getFileURL } from "@operoz/utils";

type Props = {
  logo: string | null | undefined;
  name: string | undefined;
  classNames?: string;
};

export const WorkspaceLogo = observer(function WorkspaceLogo(props: Props) {
  // translation
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        `relative flex h-6 w-6 shrink-0 items-center justify-center uppercase ${
          !props.logo && "rounded-md bg-accent-primary text-on-color"
        } ${props.classNames ? props.classNames : ""}`
      )}
    >
      {props.logo && props.logo !== "" ? (
        <img
          src={getFileURL(props.logo)}
          className="block max-h-full max-w-full rounded-md object-contain object-center"
          alt={t("aria_labels.projects_sidebar.workspace_logo")}
        />
      ) : (
        (props.name?.[0] ?? "...")
      )}
    </div>
  );
});
