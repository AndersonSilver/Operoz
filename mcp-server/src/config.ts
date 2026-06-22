export type OperisConfig = {
  baseUrl: string;
  apiKey?: string;
  sessionCookie?: string;
};

/** agent = discover + execute (Cursor); full = um tool por endpoint */
export type McpProfile = "agent" | "full";

export function loadConfig(): OperisConfig {
  const baseUrl = (process.env.OPERIS_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
  const apiKey = process.env.OPERIS_API_KEY?.trim() || undefined;
  const sessionCookie = process.env.OPERIS_SESSION_COOKIE?.trim() || undefined;

  return { baseUrl, apiKey, sessionCookie };
}

export function loadMcpProfile(): McpProfile {
  const raw = process.env.OPERIS_MCP_PROFILE?.trim().toLowerCase();
  if (raw === "full" || raw === "legacy") return "full";
  return "agent";
}
