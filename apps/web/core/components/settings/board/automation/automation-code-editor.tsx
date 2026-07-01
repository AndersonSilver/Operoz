import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { EditorView } from "@codemirror/view";
import { useTheme } from "next-themes";
import { cn } from "@operoz/ui";
import "./automation-code-editor.css";

export type AutomationCodeLanguage = "html" | "javascript";

type Props = {
  value: string;
  onChange: (value: string) => void;
  language: AutomationCodeLanguage;
  minHeight?: string;
  readOnly?: boolean;
  className?: string;
};

export function AutomationCodeEditor(props: Props) {
  const { value, onChange, language, minHeight = "420px", readOnly = false, className } = props;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const extensions = useMemo(() => {
    const languageExtension = language === "html" ? html() : javascript();
    return [
      languageExtension,
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          fontSize: "13px",
        },
        ".cm-scroller": {
          fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          lineHeight: "1.6",
        },
        ".cm-content": {
          padding: "12px 0",
        },
        ".cm-gutters": {
          minHeight,
        },
      }),
    ];
  }, [language, minHeight]);

  const theme = resolvedTheme === "light" ? vscodeLight : vscodeDark;

  if (!mounted) {
    return (
      <div className={cn("automation-code-editor automation-code-editor--fallback", className)} style={{ minHeight }}>
        <pre className="automation-code-editor__fallback">{value}</pre>
      </div>
    );
  }

  return (
    <div className={cn("automation-code-editor", className)}>
      <CodeMirror
        value={value}
        height={minHeight}
        theme={theme}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          indentOnInput: true,
          tabSize: 2,
          autocompletion: false,
        }}
      />
    </div>
  );
}
