import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

/**
 * Smoke k6 go-live — 5 VUs, ~2 min (LLM real).
 * Credenciais geradas por: python manage.py validate_assistant_go_live --run-k6
 *
 * Env: BASE_URL, CHAT_API_URL, WORKSPACE_SLUG, SESSION_ID, SESSION_COOKIE
 */

const baseUrl = __ENV.BASE_URL || "http://localhost:8000";
const chatApiUrl = __ENV.CHAT_API_URL || "http://localhost:8001";
const workspaceSlug = __ENV.WORKSPACE_SLUG || "operoz";
const sessionId = __ENV.SESSION_ID;
const sessionCookie = __ENV.SESSION_COOKIE || "";

const chatErrors = new Rate("assistant_chat_errors");
const firstTokenLatency = new Trend("assistant_first_token_ms", true);
const chatDuration = new Trend("assistant_chat_duration_ms", true);

export const options = {
  scenarios: {
    go_live_smoke: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "90s", target: 5 },
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    assistant_chat_errors: ["rate<0.05"],
    assistant_first_token_ms: ["p(95)<3000"],
    assistant_chat_duration_ms: ["p(95)<45000"],
    http_req_failed: ["rate<0.05"],
  },
};

function headers(json = true) {
  const h = { Cookie: sessionCookie };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

function parseSseEvents(body) {
  const events = [];
  for (const part of body.split("\n\n")) {
    const line = part.split("\n").find((l) => l.startsWith("data: "));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)));
    } catch (_) {
      /* ignore */
    }
  }
  return events;
}

export default function () {
  if (!sessionId || !sessionCookie) {
    console.warn("SESSION_ID e SESSION_COOKIE são obrigatórios");
    sleep(1);
    return;
  }

  const started = Date.now();
  const clientMessageId = `go-live-${__VU}-${__ITER}-${Date.now()}`;

  const enqueue = http.post(
    `${baseUrl}/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/chat/`,
    JSON.stringify({
      message: "Responda em uma palavra: ok",
      stream: true,
      async_mode: true,
      client_message_id: clientMessageId,
    }),
    { headers: { ...headers(), Accept: "application/json" }, timeout: "120s" }
  );

  let ok = check(enqueue, { "enqueue 202": (r) => r.status === 202 });
  if (!ok) {
    chatErrors.add(1);
    return;
  }

  const jobId = enqueue.json("job_id") || enqueue.json("id");
  const stream = http.get(`${chatApiUrl}/api/workspaces/${workspaceSlug}/assistant/chat/jobs/${jobId}/stream/`, {
    headers: { ...headers(false), Accept: "text/event-stream" },
    timeout: "180s",
  });

  ok = check(stream, { "stream 200": (r) => r.status === 200 });
  if (ok) {
    const events = parseSseEvents(stream.body);
    const firstToken = events.find((e) => e.type === "token");
    if (firstToken) {
      firstTokenLatency.add(Date.now() - started);
    }
    ok = events.some((e) => e.type === "done");
    check(null, { "done event": () => ok });
  }

  chatDuration.add(Date.now() - started);
  chatErrors.add(!ok);
  sleep(1);
}
