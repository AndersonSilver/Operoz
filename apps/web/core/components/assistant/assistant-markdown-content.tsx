import { Fragment, type ReactNode } from "react";
import { cn } from "@operoz/utils";

type Props = {
  content: string;
  className?: string;
  inheritColor?: boolean;
};

function renderInline(text: string, strongClass: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className={strongClass}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function splitMarkdownTableRow(line: string): string[] {
  let inner = line.trim();
  if (inner.startsWith("|")) inner = inner.slice(1);
  if (inner.endsWith("|")) inner = inner.slice(0, -1);
  return inner.split("|").map((cell) => cell.trim());
}

function isMarkdownTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|") || !trimmed.includes("-")) return false;
  return /^[\s|:-]+$/.test(trimmed);
}

function isMarkdownTableRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  if (isMarkdownTableSeparator(trimmed)) return true;
  return splitMarkdownTableRow(trimmed).length >= 2;
}

type MarkdownTableProps = {
  rows: string[][];
  inheritColor: boolean;
  textClass: string;
  headingClass: string;
  strongClass: string;
};

function MarkdownTable(props: MarkdownTableProps) {
  const { rows, inheritColor, textClass, headingClass, strongClass } = props;
  if (!rows.length) return null;

  const [headerRow, ...bodyRows] = rows;
  const tableClass = cn("w-full min-w-[20rem] border-collapse text-left text-12", textClass);
  const cellClass = cn(
    "px-3 py-2 align-top leading-relaxed",
    inheritColor ? "border-on-color/15 border" : "border border-subtle"
  );
  const headerCellClass = cn(
    cellClass,
    "font-semibold",
    inheritColor ? "bg-on-color/10 text-inherit" : cn("bg-layer-2 text-primary", headingClass)
  );
  const bodyCellClass = cn(cellClass, inheritColor ? "text-inherit" : textClass);

  return (
    <div
      className={cn(
        "my-2 max-w-full overflow-x-auto rounded-lg",
        inheritColor ? "border-on-color/20 border" : "border border-subtle bg-surface-1"
      )}
    >
      <table className={tableClass}>
        <thead>
          <tr>
            {headerRow.map((cell, index) => (
              <th key={index} className={headerCellClass}>
                {renderInline(cell, strongClass)}
              </th>
            ))}
          </tr>
        </thead>
        {bodyRows.length > 0 ? (
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={cn(!inheritColor && rowIndex % 2 === 1 && "bg-layer-1/40")}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={bodyCellClass}>
                    {renderInline(cell, strongClass)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>
    </div>
  );
}

export function AssistantMarkdownContent({ content, className, inheritColor = false }: Props) {
  const textClass = inheritColor ? "text-inherit" : "text-secondary";
  const headingClass = inheritColor ? "text-inherit" : "text-primary";
  const strongClass = inheritColor ? "font-semibold text-inherit" : "font-semibold text-primary";
  const lines = (content || "").split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let tableLines: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    const ListTag = listOrdered ? "ol" : "ul";
    const listClass = listOrdered ? "list-decimal" : "list-disc";
    blocks.push(
      <ListTag key={`list-${blocks.length}`} className={cn("my-2 space-y-1 pl-5", listClass)}>
        {listItems.map((item, i) => (
          <li key={i} className={cn("text-13 leading-relaxed", textClass)}>
            {renderInline(item, strongClass)}
          </li>
        ))}
      </ListTag>
    );
    listItems = [];
    listOrdered = false;
  };

  const flushTable = () => {
    if (!tableLines.length) return;

    const rows = tableLines
      .filter((line) => !isMarkdownTableSeparator(line))
      .map(splitMarkdownTableRow)
      .filter((row) => row.some((cell) => cell.length > 0));

    tableLines = [];

    if (!rows.length) return;

    blocks.push(
      <MarkdownTable
        key={`table-${blocks.length}`}
        rows={rows}
        inheritColor={inheritColor}
        textClass={textClass}
        headingClass={headingClass}
        strongClass={strongClass}
      />
    );
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (isMarkdownTableRow(trimmed)) {
      flushList();
      tableLines.push(trimmed);
      continue;
    }

    if (tableLines.length) {
      flushTable();
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(
        <h4 key={`h4-${blocks.length}`} className={cn("mt-3 mb-1 text-12 font-semibold", headingClass)}>
          {renderInline(trimmed.slice(4), strongClass)}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className={cn("mt-3 mb-1.5 text-13 font-semibold", headingClass)}>
          {renderInline(trimmed.slice(3), strongClass)}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className={cn("mt-3 mb-2 text-14 font-semibold", headingClass)}>
          {renderInline(trimmed.slice(2), strongClass)}
        </h2>
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      if (listOrdered && listItems.length) flushList();
      listOrdered = false;
      listItems.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      if (!listOrdered && listItems.length) flushList();
      listOrdered = true;
      listItems.push(orderedMatch[1]);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className={cn("text-13 leading-relaxed", textClass)}>
        {renderInline(trimmed, strongClass)}
      </p>
    );
  }

  flushTable();
  flushList();

  return <div className={cn("space-y-1", className)}>{blocks}</div>;
}
