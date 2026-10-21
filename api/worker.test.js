const assert = require("node:assert/strict");
const { test } = require("node:test");

const DOCS_ORIGIN = "https://gtref.github.io";
const workerPromise = import("./worker.mjs").then(module => module.default);

function createRequest({ method = "POST", origin = DOCS_ORIGIN, body } = {}) {
  const headers = new Headers({ Origin: origin });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  return new Request("https://satiscode-docs-help.example.workers.dev", {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

function createEnv(overrides = {}) {
  return {
    GROQ_API_KEY: "test-secret",
    HELP_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...overrides
  };
}

test("allows the docs site's CORS preflight and rejects other origins", async () => {
  const worker = await workerPromise;
  const preflight = await worker.fetch(createRequest({ method: "OPTIONS" }), createEnv());
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), DOCS_ORIGIN);

  const rejected = await worker.fetch(
    createRequest({ origin: "https://attacker.example", body: { prompt: "Hello" } }),
    createEnv()
  );
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get("Access-Control-Allow-Origin"), null);
});

test("validates request payloads before calling Groq", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(createRequest({ body: { prompt: "x".repeat(5001) } }), createEnv());
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Question is empty or too long." });
});

test("forwards valid prompts with the server-side key and returns the reply", async () => {
  const worker = await workerPromise;
  const originalFetch = globalThis.fetch;
  let providerRequest;

  globalThis.fetch = async (url, options) => {
    providerRequest = { url, options };
    return Response.json({ choices: [{ message: { content: "Welcome to Satiscode." } }] });
  };

  try {
    const response = await worker.fetch(createRequest({ body: { prompt: "Where can I download it?" } }), createEnv());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: "Welcome to Satiscode." });
    assert.equal(providerRequest.options.headers.Authorization, "Bearer test-secret");
    assert.equal(JSON.parse(providerRequest.options.body).messages[1].content, "Where can I download it?");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rate-limits requests before calling Groq", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    createRequest({ body: { prompt: "Please help." } }),
    createEnv({ HELP_RATE_LIMIT: { limit: async () => ({ success: false }) } })
  );

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "Too many questions. Please try again shortly." });
});

test("returns a setup error when the Groq secret is missing", async () => {
  const worker = await workerPromise;
  const response = await worker.fetch(
    createRequest({ body: { prompt: "Please help." } }),
    createEnv({ GROQ_API_KEY: undefined })
  );

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Help service is not configured." });
});
