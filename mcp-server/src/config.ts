export type OperozConfig = {
  baseUrl: string;
  apiKey?: string;
  sessionCookie?: string;
};

/** agent = discover + execute (Cursor); full = um tool por endpoint */
export type McpProfile = "agent" | "full";

export function loadConfig(): OperozConfig {
  const baseUrl = (process.env.OPEROZ_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
  const apiKey = process.env.OPEROZ_API_KEY?.trim() || undefined;
  const sessionCookie = process.env.OPEROZ_SESSION_COOKIE?.trim() || undefined;

  return { baseUrl, apiKey, sessionCookie };
}

export function loadMcpProfile(): McpProfile {
  const raw = process.env.OPEROZ_MCP_PROFILE?.trim().toLowerCase();
  if (raw === "full" || raw === "legacy") return "full";
  return "agent";
}
