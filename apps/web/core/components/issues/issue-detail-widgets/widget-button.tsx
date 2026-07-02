import * as React from "react";
import { Button } from "@operoz/propel/button";

type Props = {
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
};

export const IssueDetailWidgetButton = React.forwardRef<HTMLButtonElement, Props>(
  function IssueDetailWidgetButton(props, ref) {
    const { icon, title, disabled = false } = props;

    return (
      <Button ref={ref} variant="secondary" disabled={disabled} size="sm" className="h-8 gap-1.5 px-2.5">
        {icon && icon}
        <span className="text-body-xs-medium">{title}</span>
      </Button>
    );
  }
);

IssueDetailWidgetButton.displayName = "IssueDetailWidgetButton";
