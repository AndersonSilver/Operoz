import { cn } from "@operis/utils";

function cleanListClasses(html: string): string {
  return html.replace(/<(ul|ol)([^>]*)\sclass="([^"]*)"/gi, (_match, tag, attrs, classNames) => {
    const cleaned = classNames
      .split(/\s+/)
      .filter((name: string) => name && !/^pl-/.test(name) && !/^space-y-/.test(name))
      .join(" ");
    return cleaned ? `<${tag}${attrs} class="${cleaned}"` : `<${tag}${attrs}`;
  });
}

/** Remove estilos inline de callout/blockquote que sobrepõem listas na visualização. */
export function normalizeObservationHtmlForDisplay(html: string): string {
  return cleanListClasses(
    html
      .replace(/\s*border-left:\s*[^;"]+;?/gi, "")
      .replace(/<blockquote([^>]*)>/gi, "<div$1>")
      .replace(/<\/blockquote>/gi, "</div>")
      .replace(/\s*style="\s*"/gi, "")
  );
}

const OBS_HTML_CLASS = cn(
  "sr-obs-html min-w-0 text-[11px] leading-relaxed text-secondary",
  "[&_p]:m-0 [&_p+p]:mt-2",
  "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:space-y-0.5",
  "[&_ul]:!ml-0 [&_ul]:!list-outside [&_ul]:!pl-5",
  "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:space-y-0.5",
  "[&_ol]:!ml-0 [&_ol]:!list-outside [&_ol]:!pl-5",
  "[&_li]:pl-0.5 [&_li_p]:m-0",
  "[&_strong]:font-medium [&_strong]:text-primary",
  "[&_a]:text-accent-primary [&_a]:underline",
  "[&_blockquote]:my-1.5 [&_blockquote]:border-0 [&_blockquote]:p-0",
  "[&_.editor-callout-component]:my-1.5 [&_.editor-callout-component]:rounded-md [&_.editor-callout-component]:border [&_.editor-callout-component]:border-subtle",
  "[&_.editor-callout-component]:bg-layer-3/40 [&_.editor-callout-component]:p-2.5 [&_.editor-callout-component]:!border-l-0",
  "[&_.editor-callout-component]:flex [&_.editor-callout-component]:flex-col [&_.editor-callout-component]:gap-1"
);

export function ObservationHtmlView({ html }: { html: string }) {
  return (
    <div
      className={OBS_HTML_CLASS}
      dangerouslySetInnerHTML={{ __html: normalizeObservationHtmlForDisplay(html) }}
    />
  );
}
