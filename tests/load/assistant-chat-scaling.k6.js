import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

/**
 * Load test — Assistente Operoz (escala 150 VUs)
 *
 * Pré-requisitos:
 * - API + api-chat + assistant-chat-worker + Redis + LLM_API_KEY configurados
 * - Sessão de chat criada e cookie de sessão válido (ou token API)
 *
 * Variáveis de ambiente:
 * - BASE_URL (default http://localhost:8000)
 * - CHAT_API_URL (default BASE_URL ou http://localhost:8001)
 * - WORKSPACE_SLUG
 * - SESSION_ID (UUID da sessão assistant)
 * - SESSION_COOKIE (ex.: sessionid=...)
 * - CSRF_TOKEN (opcional se usar cookie session)
 * - ASYNC_MODE=1 para fluxo 202 + stream job
 */

const asyncMode = (__ENV.ASYNC_MODE || "1") === "1";
const baseUrl = __ENV.BASE_URL || "http://localhost:8000";
const chatApiUrl = __ENV.CHAT_API_URL || baseUrl;
const workspaceSlug = __ENV.WORKSPACE_SLUG || "operoz";
const sessionId = __ENV.SESSION_ID;
const sessionCookie = __ENV.SESSION_COOKIE || "";
const csrfToken = __ENV.CSRF_TOKEN || "";

const chatLatency = new Trend("assistant_chat_duration_ms", true);
const firstTokenLatency = new Trend("assistant_first_token_ms", true);
const chatErrors = new Rate("assistant_chat_errors");
const chatSuccess = new Counter("assistant_chat_success");

export const options = {
  scenarios: {
    ramp_150: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5m", target: 150 },
        { duration: "10m", target: 150 },
        { duration: "2m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    assistant_chat_errors: ["rate<0.05"],
    assistant_chat_duration_ms: ["p(95)<45000"],
    http_req_failed: ["rate<0.05"],
  },
};

const SIMPLE_MESSAGES = [
  "Quantos cards abertos existem no workspace?",
  "Resuma a documentação do projeto.",
  "O que é o Cliente 360?",
  "Liste automações recentes do board.",
];

const TOOL_MESSAGES = [
  "Busque cards com a palavra sustentação e mostre os três primeiros.",
  "Consulte métricas de automação dos últimos 7 dias.",
  "Pesquise na documentação sobre SLA de intake.",
];

function pickMessage() {
  const useTool = Math.random() < 0.3;
  const pool = useTool ? TOOL_MESSAGES : SIMPLE_MESSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function headers(json = true) {
  const h = {
    Cookie: sessionCookie,
  };
  if (json) h["Content-Type"] = "application/json";
  if (csrfToken) h["X-CSRFTOKEN"] = csrfToken;
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
    console.warn("Defina SESSION_ID e SESSION_COOKIE para executar o teste.");
    sleep(1);
    return;
  }

  const started = Date.now();
  let ok = true;
  const message = pickMessage();
  const clientMessageId = `${__VU}-${__ITER}-${Date.now()}`;

  if (asyncMode) {
    const enqueue = http.post(
      `${baseUrl}/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/chat/`,
      JSON.stringify({
        message,
        stream: true,
        async_mode: true,
        client_message_id: clientMessageId,
      }),
      { headers: { ...headers(), Accept: "application/json" }, timeout: "120s" }
    );

    if (enqueue.status !== 202) {
      chatErrors.add(1);
      return;
    }

    const jobId = enqueue.json("job_id") || enqueue.json("id");
    const stream = http.get(`${chatApiUrl}/api/workspaces/${workspaceSlug}/assistant/chat/jobs/${jobId}/stream/`, {
      headers: { ...headers(false), Accept: "text/event-stream" },
      timeout: "180s",
    });

    ok = stream.status === 200;
    if (ok) {
      const events = parseSseEvents(stream.body);
      const firstToken = events.find((e) => e.type === "token");
      if (firstToken) {
        firstTokenLatency.add(Date.now() - started);
      }
      ok = events.some((e) => e.type === "done");
    }
  } else {
    const res = http.post(
      `${chatApiUrl}/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/chat/`,
      JSON.stringify({ message, stream: true }),
      { headers: { ...headers(), Accept: "text/event-stream" }, timeout: "180s" }
    );
    ok = res.status === 200;
    if (ok) {
      const events = parseSseEvents(res.body);
      const firstToken = events.find((e) => e.type === "token");
      if (firstToken) {
        firstTokenLatency.add(Date.now() - started);
      }
      ok = events.some((e) => e.type === "done");
    }
  }

  chatLatency.add(Date.now() - started);
  chatErrors.add(!ok);
  if (ok) chatSuccess.add(1);

  sleep(Math.random() * 2 + 1);
}
