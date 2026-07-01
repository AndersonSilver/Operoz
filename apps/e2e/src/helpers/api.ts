import type { APIRequestContext } from "@playwright/test";

export type E2ETestData = {
  email: string;
  password: string;
  workspaceSlug: string;
  workspaceName: string;
  boardSlug: string;
  boardName: string;
  projectId: string;
  projectIdentifier: string;
  projectName: string;
  issueName: string;
};

const DEFAULT_PASSWORD = "OperozE2E!2026";

async function fetchCsrf(request: APIRequestContext, apiUrl: string): Promise<string> {
  const response = await request.get(`${apiUrl}/auth/get-csrf-token/`);
  if (!response.ok()) {
    throw new Error(`CSRF token failed: ${response.status()} ${await response.text()}`);
  }
  const body = (await response.json()) as { csrf_token?: string };
  if (!body.csrf_token) throw new Error("CSRF token missing in response");
  return body.csrf_token;
}

async function apiJson<T>(
  request: APIRequestContext,
  apiUrl: string,
  method: "GET" | "POST" | "PATCH",
  path: string,
  data?: Record<string, unknown>
): Promise<T> {
  const csrf = await fetchCsrf(request, apiUrl);
  const headers: Record<string, string> = {
    "X-CSRFToken": csrf,
    Referer: process.env.E2E_WEB_URL ?? "http://localhost:3000",
  };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  const response = await request.fetch(`${apiUrl}${path}`, {
    method,
    headers,
    data: data ? JSON.stringify(data) : undefined,
  });
  if (!response.ok()) {
    throw new Error(`${method} ${path} → ${response.status()}: ${await response.text()}`);
  }
  if (response.status() === 204) return {} as T;
  return (await response.json()) as T;
}

export async function signUp(request: APIRequestContext, apiUrl: string, email: string, password: string) {
  const csrf = await fetchCsrf(request, apiUrl);
  const response = await request.post(`${apiUrl}/auth/sign-up/`, {
    form: {
      email,
      password,
      csrfmiddlewaretoken: csrf,
    },
    maxRedirects: 0,
  });
  // Redirect para a web após signup é esperado (mesmo que o dev server responda 405 no POST).
  if (![302, 303, 200].includes(response.status())) {
    throw new Error(`sign-up failed: ${response.status()} ${await response.text()}`);
  }
  const me = await apiJson<{ email: string }>(request, apiUrl, "GET", "/api/users/me/");
  if (me.email !== email) {
    throw new Error(`Session not established after sign-up (got ${me.email})`);
  }
}

export async function seedOperozF0Data(request: APIRequestContext, apiUrl: string): Promise<E2ETestData> {
  const stamp = Date.now();
  const email = `e2e-f0-${stamp}@operoz.test`;
  const password = DEFAULT_PASSWORD;
  const workspaceSlug = `e2e-ws-${stamp}`;
  const boardSlug = `e2e-board-${stamp}`;
  const projectIdentifier = `E2E${String(stamp).slice(-4)}`;

  await signUp(request, apiUrl, email, password);

  const workspace = await apiJson<{ id: string; slug: string; name: string }>(
    request,
    apiUrl,
    "POST",
    "/api/workspaces/",
    {
      name: `E2E Workspace ${stamp}`,
      slug: workspaceSlug,
      company_name: "Operoz E2E",
    }
  );

  await apiJson(request, apiUrl, "PATCH", "/api/users/me/profile/", {
    last_workspace_id: workspace.id,
  });
  await apiJson(request, apiUrl, "PATCH", "/api/users/me/onboard/", {
    is_onboarded: true,
  });

  const board = await apiJson<{ id: string; slug: string; name: string }>(
    request,
    apiUrl,
    "POST",
    `/api/workspaces/${workspaceSlug}/boards/`,
    { name: `E2E Board ${stamp}`, slug: boardSlug }
  );

  const project = await apiJson<{ id: string; identifier: string; name: string }>(
    request,
    apiUrl,
    "POST",
    `/api/workspaces/${workspaceSlug}/projects/`,
    {
      name: `E2E Project ${stamp}`,
      identifier: projectIdentifier,
      board_id: board.id,
    }
  );

  const issueName = `E2E Issue ${stamp}`;
  await apiJson(request, apiUrl, "POST", `/api/workspaces/${workspaceSlug}/projects/${project.id}/issues/`, {
    name: issueName,
  });

  return {
    email,
    password,
    workspaceSlug,
    workspaceName: workspace.name,
    boardSlug,
    boardName: board.name,
    projectId: project.id,
    projectIdentifier,
    projectName: project.name,
    issueName,
  };
}

export async function checkStackHealth(apiUrl: string, webUrl: string) {
  const api = await fetch(`${apiUrl}/api/instances/`);
  if (!api.ok) throw new Error(`API indisponível em ${apiUrl} (${api.status})`);
  const web = await fetch(webUrl);
  if (!web.ok) throw new Error(`Web indisponível em ${webUrl} (${web.status})`);
}
