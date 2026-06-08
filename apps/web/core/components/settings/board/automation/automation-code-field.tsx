import { cn } from "@operis/ui";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: string;
  rows?: number;
};

export function AutomationCodeField(props: Props) {
  const { value, onChange, label, hint, rows = 18 } = props;

  return (
    <label className="block">
      <span className="text-11 font-medium uppercase tracking-wide text-tertiary">{label}</span>
      {hint && <span className="mt-1 block text-11 leading-relaxed text-placeholder">{hint}</span>}
      <div className="mt-2 overflow-hidden rounded-md border border-subtle bg-canvas shadow-raised-100">
        <div className="border-b border-subtle px-3 py-1.5">
          <span className="text-10 font-medium uppercase tracking-wide text-placeholder">JavaScript</span>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          spellCheck={false}
          className={cn(
            "block w-full resize-y bg-transparent px-4 py-3 font-mono text-12 leading-6 text-primary",
            "placeholder:text-placeholder focus:outline-none min-h-[320px]"
          )}
        />
      </div>
    </label>
  );
}
