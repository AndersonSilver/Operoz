import type { TCustomFieldType } from "@operoz/types";
import { cn } from "@operoz/ui";

const FIELD_TYPE_ICON_COLOR = "#2684FF";

type Props = {
  fieldType: TCustomFieldType;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function BoardCustomFieldTypeGlyph(props: Props) {
  const { fieldType, size = "md", className } = props;
  const dim = size === "sm" ? 20 : size === "lg" ? 32 : 24;
  const stroke = FIELD_TYPE_ICON_COLOR;

  const wrap = (children: React.ReactNode) => (
    <span
      className={cn("inline-flex items-center justify-center text-[#2684FF]", className)}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      {children}
    </span>
  );

  switch (fieldType) {
    case "text":
      return wrap(
        <span className="leading-none font-semibold" style={{ fontSize: size === "lg" ? 22 : 16, color: stroke }}>
          Aa
        </span>
      );
    case "number":
      return wrap(
        <span className="leading-none font-semibold" style={{ fontSize: size === "lg" ? 18 : 14, color: stroke }}>
          123
        </span>
      );
    case "paragraph":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <path d="M5 7h14M5 12h10M5 17h14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "date":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="15" rx="2" stroke={stroke} strokeWidth="2" />
          <path d="M4 9h16M8 3v4M16 3v4" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "datetime":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="2" />
          <path d="M12 8v4l3 2" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "select":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="7" width="16" height="10" rx="1.5" stroke={stroke} strokeWidth="2" />
          <path d="M15 11l2 2 2-2" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "categories":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <path d="M7 6l8-2 4 3-9 2-3-3z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="10" cy="8" r="1" fill={stroke} />
        </svg>
      );
    case "checkbox":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="5" width="14" height="14" rx="2" stroke={stroke} strokeWidth="2" />
          <path d="M9 12l2 2 5-5" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "member":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="3.5" stroke={stroke} strokeWidth="2" />
          <path d="M6 19c0-3 2.7-5 6-5s6 2 6 5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "multi_select":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="2" />
          <path d="M9 10l3 3 3-3" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 14h6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "url":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <path d="M8 6h10a2 2 0 0 1 2 2v10H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke={stroke} strokeWidth="2" />
          <path d="M6 10h12" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case "standard":
      return wrap(
        <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="5" width="14" height="14" rx="2" stroke={stroke} strokeWidth="2" />
          <path d="M9 9h6M9 12h4M9 15h6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return wrap(
        <span className="font-semibold" style={{ color: stroke }}>
          ?
        </span>
      );
  }
}
