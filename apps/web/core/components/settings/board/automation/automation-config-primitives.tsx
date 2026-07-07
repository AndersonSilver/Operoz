import clsx from "clsx";

export function ConfigField(props: { label: string; hint?: string; children: React.ReactNode }) {
  const { label, hint, children } = props;
  return (
    <label className="mb-3 block">
      <span className="text-11 text-tertiary">{label}</span>
      {hint && <span className="mt-0.5 block text-10 text-placeholder">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function ConfigSelect(props: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const { value, onChange, options, placeholder } = props;
  return (
    <select
      className="w-full rounded border border-subtle bg-surface-2 px-2 py-1.5 text-13"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ConfigTextInput(props: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const { value, onChange, placeholder } = props;
  return (
    <input
      type="text"
      className="w-full rounded border border-subtle bg-surface-2 px-2 py-1.5 text-13"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function ConfigTextArea(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const { value, onChange, placeholder, rows = 4 } = props;
  return (
    <textarea
      className="w-full rounded border border-subtle bg-surface-2 px-2 py-1.5 text-13"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

export function ConfigCheckboxList(props: {
  options: { id: string; label: string; sublabel?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  emptyMessage?: string;
}) {
  const { options, selected, onChange, emptyMessage } = props;
  if (!options.length) {
    return <p className="text-11 text-tertiary">{emptyMessage ?? "Nenhuma opção disponível."}</p>;
  }

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-subtle bg-surface-2 p-2">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={clsx(
            "flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 text-13 hover:bg-surface-1",
            selected.includes(opt.id) && "bg-surface-1"
          )}
        >
          <input
            type="checkbox"
            className="mt-0.5"
            checked={selected.includes(opt.id)}
            onChange={() => toggle(opt.id)}
          />
          <span>
            <span className="text-primary">{opt.label}</span>
            {opt.sublabel && <span className="mt-0.5 block text-11 text-tertiary">{opt.sublabel}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
