import { AutomationCodeEditor, type AutomationCodeLanguage } from "./automation-code-editor";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  hint?: string;
  language?: AutomationCodeLanguage;
  minHeight?: string;
};

const LANGUAGE_LABEL: Record<AutomationCodeLanguage, string> = {
  html: "HTML",
  javascript: "JavaScript",
};

export function AutomationCodeField(props: Props) {
  const { value, onChange, label, hint, language = "javascript", minHeight = "480px" } = props;

  return (
    <label className="block">
      <span className="text-11 font-medium tracking-wide text-tertiary uppercase">{label}</span>
      {hint ? <span className="mt-1 block text-11 leading-relaxed text-placeholder">{hint}</span> : null}
      <div className="mt-2 overflow-hidden rounded-md border border-subtle bg-canvas shadow-raised-100">
        <div className="flex items-center justify-between border-b border-subtle bg-layer-2 px-3 py-1.5">
          <span className="text-10 font-medium tracking-wide text-placeholder uppercase">
            {LANGUAGE_LABEL[language]}
          </span>
          <span className="text-10 text-placeholder">VS Code</span>
        </div>
        <AutomationCodeEditor value={value} onChange={onChange} language={language} minHeight={minHeight} />
      </div>
    </label>
  );
}
