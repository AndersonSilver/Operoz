import { AssistantMarkdownContent } from "@/components/assistant/assistant-markdown-content";

type Props = {
  content: string;
  className?: string;
  variant?: "plain" | "markdown";
  inheritColor?: boolean;
};

export function AssistantSafeContent({ content, className, variant = "markdown", inheritColor = false }: Props) {
  if (variant === "plain") {
    return <p className={className ?? "text-13 leading-relaxed whitespace-pre-wrap"}>{content}</p>;
  }
  return <AssistantMarkdownContent content={content} className={className} inheritColor={inheritColor} />;
}
