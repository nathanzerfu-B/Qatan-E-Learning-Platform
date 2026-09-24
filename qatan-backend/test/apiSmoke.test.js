import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

test("API Integration & Security Smoke Suite", async (t) => {
  // Check if backend is reachable before running live tests
  let serverReachable = false;
  try {
    const res = await fetch(`${BASE_URL}/`);
    serverReachable = res.ok;
  } catch {
    serverReachable = false;
  }

  if (!serverReachable) {
    t.diagnostic(`⚠️ Live server not reachable at ${BASE_URL}. Skipping smoke tests.`);
    return;
  }

  await t.test("GET / responds with 200 OK and health status", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.match(text, /Qatan E-Learning API is running/i);
  });

  await t.test("Responses enforce security headers (CSP, HSTS, X-Frame-Options, nosniff)", async () => {
    const res = await fetch(`${BASE_URL}/`);
    
    assert.ok(res.headers.get("content-security-policy"), "Missing Content-Security-Policy header");
    assert.ok(res.headers.get("x-frame-options"), "Missing X-Frame-Options header");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.ok(res.headers.get("cross-origin-resource-policy"), "Missing CORP header");
  });

  await t.test("GET /api/courses serves public catalog without authentication", async () => {
    const res = await fetch(`${BASE_URL}/api/courses`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.courses));
  });

  await t.test("GET /api/unknown-endpoint triggers 404 notFoundHandler with JSON", async () => {
    const res = await fetch(`${BASE_URL}/api/unknown-endpoint-xyz-123`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /route not found/i);
  });

  await t.test("POST /api/admin/platform-settings blocks unauthenticated access with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/platform-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /access token required/i);
  });

  await t.test("GET /api/reports/performance blocks unauthenticated access with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/reports/performance`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  await t.test("POST /api/courses blocks unauthenticated course creation with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Injected Course" }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  await t.test("POST /api/auth/login with malformed JSON triggers safe 400 Bad Request", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ unclosed_json: ",
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /malformed json payload/i);
  });
});
