import { EUserPermissions } from "@operis/constants";
import type { IWorkspaceBulkInviteFormData, TUserPermissions } from "@operis/types";

export type TWorkspaceMemberCsvRow = {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role: TUserPermissions;
};

export type TWorkspaceMemberCsvInvalidRow = {
  line: number;
  raw: string;
  reason: string;
};

export type TWorkspaceMemberCsvParseResult = {
  valid: TWorkspaceMemberCsvRow[];
  invalid: TWorkspaceMemberCsvInvalidRow[];
};

const EMAIL_HEADER = "email";
const ROLE_HEADER = "role";
const DISPLAY_NAME_HEADER = "display name";
const FIRST_NAME_HEADER = "first name";
const LAST_NAME_HEADER = "last name";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const WORKSPACE_MEMBERS_CSV_TEMPLATE: string[][] = [
  ["Email", "Display Name", "First Name", "Last Name", "Role"],
  ["alex@company.com", "Alex Chen", "Alex", "Chen", "member"],
  ["sarah@company.com", "Sarah Kim", "Sarah", "Kim", "admin"],
];

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

const normalizeHeader = (value: string) => value.trim().toLowerCase();

const parseRole = (raw: string | undefined): { role?: TUserPermissions; error?: string } => {
  if (!raw || raw.trim() === "") {
    return { role: EUserPermissions.MEMBER };
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized === "owner") {
    return { error: "Owner cannot be assigned via CSV import" };
  }

  if (normalized === "admin" || normalized === "20") {
    return { role: EUserPermissions.ADMIN };
  }
  if (normalized === "member" || normalized === "15") {
    return { role: EUserPermissions.MEMBER };
  }
  if (normalized === "guest" || normalized === "5") {
    return { role: EUserPermissions.GUEST };
  }

  return { error: `Invalid role: ${raw}` };
};

export const parseWorkspaceMembersCsv = (content: string): TWorkspaceMemberCsvParseResult => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const valid: TWorkspaceMemberCsvRow[] = [];
  const invalid: TWorkspaceMemberCsvInvalidRow[] = [];
  const seenEmails = new Set<string>();

  if (lines.length === 0) {
    return {
      valid,
      invalid: [{ line: 0, raw: "", reason: "CSV file is empty" }],
    };
  }

  const headerCells = parseCsvLine(lines[0]).map(normalizeHeader);
  const emailIndex = headerCells.indexOf(EMAIL_HEADER);
  const roleIndex = headerCells.indexOf(ROLE_HEADER);
  const displayNameIndex = headerCells.indexOf(DISPLAY_NAME_HEADER);
  const firstNameIndex = headerCells.indexOf(FIRST_NAME_HEADER);
  const lastNameIndex = headerCells.indexOf(LAST_NAME_HEADER);

  if (emailIndex === -1) {
    return {
      valid,
      invalid: [{ line: 1, raw: lines[0], reason: 'Missing required "Email" column' }],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = lines[i];
    const cells = parseCsvLine(rawLine);
    const email = cells[emailIndex]?.trim().toLowerCase();

    if (!email) {
      invalid.push({ line: lineNumber, raw: rawLine, reason: "Email is required" });
      continue;
    }

    if (!EMAIL_PATTERN.test(email)) {
      invalid.push({ line: lineNumber, raw: rawLine, reason: "Invalid email address" });
      continue;
    }

    if (seenEmails.has(email)) {
      invalid.push({ line: lineNumber, raw: rawLine, reason: "Duplicate email in CSV" });
      continue;
    }

    const roleRaw = roleIndex >= 0 ? cells[roleIndex] : undefined;
    const { role, error: roleError } = parseRole(roleRaw);
    if (roleError || role === undefined) {
      invalid.push({ line: lineNumber, raw: rawLine, reason: roleError ?? "Invalid role" });
      continue;
    }

    seenEmails.add(email);
    valid.push({
      email,
      role,
      displayName: displayNameIndex >= 0 ? cells[displayNameIndex]?.trim() : undefined,
      firstName: firstNameIndex >= 0 ? cells[firstNameIndex]?.trim() : undefined,
      lastName: lastNameIndex >= 0 ? cells[lastNameIndex]?.trim() : undefined,
    });
  }

  return { valid, invalid };
};

export const workspaceMembersCsvToInvitePayload = (
  rows: TWorkspaceMemberCsvRow[]
): IWorkspaceBulkInviteFormData => ({
  emails: rows.map((row) => ({
    email: row.email,
    role: row.role,
  })),
});
