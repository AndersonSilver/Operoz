import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@operis/utils";

/** Largura do controlo (nem todos os campos ocupam a linha inteira). */
export type IssueFormControlWidth = "full" | "medium" | "compact" | "custom";

export const issueFormControlWidthClass: Record<IssueFormControlWidth, string> = {
  full: "w-full",
  medium: "w-full max-w-[17.5rem]",
  compact: "w-full max-w-[10.5rem]",
  custom: "w-full max-w-[20rem]",
};

/**
 * Borda visível nos dois temas (tokens do design system, não cor fixa).
 * Claro: neutral escuro; escuro: neutral mais claro — mesmo padrão que oauth-button / dropdowns.
 */
export const issueFormControlBorderClass =
  "border border-strong hover:border-strong-1 focus:border-accent-primary focus-visible:border-accent-primary";

/** Foco em contentores (ex.: editor de descrição). */
export const issueFormControlFocusWithinClass =
  "focus-within:border-accent-primary focus-within:shadow-[0_0_0_1px_var(--border-color-accent-strong)]";

/** Estilo visual do input/select (largura vem do wrapper). */
export const issueFormControlBaseClass = cn(
  "h-9 min-h-9 min-w-0 rounded-[3px] bg-layer-2 px-2.5 text-13 text-primary shadow-sm outline-none transition-[border-color,box-shadow]",
  issueFormControlBorderClass,
  "focus:shadow-[0_0_0_1px_var(--border-color-accent-strong)]"
);

export function getIssueFormControlClass(width: IssueFormControlWidth = "medium") {
  return cn(issueFormControlBaseClass, "w-full");
}

type IssueFormFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
  labelAction?: ReactNode;
  controlWidth?: IssueFormControlWidth;
};

export function IssueFormField(props: IssueFormFieldProps) {
  const { label, required, hint, children, className, labelAction, controlWidth = "medium" } = props;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-12 font-medium text-secondary">
          {label}
          {required ? <span className="ml-0.5 font-normal text-danger-primary">*</span> : null}
        </label>
        {labelAction}
      </div>
      <div className={issueFormControlWidthClass[controlWidth]}>{children}</div>
      {hint ? <p className="mt-1 text-11 leading-snug text-tertiary">{hint}</p> : null}
    </div>
  );
}

export function IssueFormSectionDivider() {
  return <div className="border-t border-subtle" role="presentation" />;
}

type IssueFormNativeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
  width?: IssueFormControlWidth;
};

export function IssueFormNativeSelect(props: IssueFormNativeSelectProps) {
  const { value, onChange, placeholder, options, width = "custom" } = props;

  return (
    <div className={cn("relative", issueFormControlWidthClass[width])}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(getIssueFormControlClass(width), "cursor-pointer appearance-none pr-9", !value && "text-tertiary")}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-placeholder" />
    </div>
  );
}
