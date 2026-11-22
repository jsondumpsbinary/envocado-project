import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.js";

describe("Express Application Endpoints", () => {
  let server;
  let baseUrl;

  const testConfig = loadConfig({
    PORT: "4000",
    NODE_ENV: "test",
    APP_NAME: "Envocado Integration Test App",
    DATABASE_URL: "postgres://localhost:5432/integration_test",
    API_SECRET_KEY: "test_secret_key_16_chars_long",
    RATE_LIMIT_MAX: "50",
    ENABLE_ANALYTICS: "false",
  });

  before(async () => {
    const app = createApp(testConfig);
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("GET /api/health returns healthy server status", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.status, "healthy");
    assert.equal(data.environment, "test");
    assert.equal(data.appName, "Envocado Integration Test App");
  });

  it("GET /api/config returns sanitized config without leaking secret key", async () => {
    const res = await fetch(`${baseUrl}/api/config`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.isFrozen, true);
    assert.equal(data.config.API_SECRET_KEY, "●●●●●●●● (redacted)");
    assert.notEqual(data.config.API_SECRET_KEY, "test_secret_key_16_chars_long");
  });

  it("POST /api/validate-env succeeds on valid environment input", async () => {
    const payload = {
      env: {
        DATABASE_URL: "https://test.database.internal",
        API_SECRET_KEY: "valid_secret_key_16_bytes_long",
        PORT: "8080",
      },
    };

    const res = await fetch(`${baseUrl}/api/validate-env`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.errors.length, 0);
    assert.equal(data.config.PORT, 8080);
  });

  it("POST /api/validate-env catches invalid parameters and returns errors", async () => {
    const payload = {
      env: {
        PORT: "99999", // Port exceeds 65535
        API_SECRET_KEY: "short", // Below 16 chars
      },
    };

    const res = await fetch(`${baseUrl}/api/validate-env`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.ok(data.errors.length >= 2);
  });

  it("GET /api/features returns list of Envocado key highlights", async () => {
    const res = await fetch(`${baseUrl}/api/features`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.package, "envocado");
    assert.ok(Array.isArray(data.highlights));
    assert.ok(data.highlights.length >= 5);
  });

  it("GET /api/unknown returns 404 for unknown endpoints", async () => {
    const res = await fetch(`${baseUrl}/api/unknown-endpoint`);
    assert.equal(res.status, 404);
  });
});
