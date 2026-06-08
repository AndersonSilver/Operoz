import { cn } from "@operis/utils";

type Props = React.ComponentProps<"button"> & {
  label: React.ReactNode;
  onClick: () => void;
};

export function SidebarAddButton(props: Props) {
  const { label, onClick, disabled, className, ...rest } = props;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-start gap-2 rounded-md border border-dashed border-subtle px-2.5 py-2 text-13 font-medium text-secondary transition-colors duration-150",
        "hover:border-strong hover:bg-layer-transparent-hover hover:text-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-subtle disabled:hover:bg-transparent disabled:hover:text-secondary",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {label}
    </button>
  );
}
