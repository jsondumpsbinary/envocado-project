import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, validateConfig, getSanitizedConfig } from "../src/config/env.js";

describe("Envocado Configuration Loader", () => {
  const validBaseEnv = {
    PORT: "4000",
    NODE_ENV: "production",
    APP_NAME: "Test Suite App",
    DATABASE_URL: "postgres://user:pass@localhost:5432/testdb",
    API_SECRET_KEY: "super_secret_test_key_123456",
    RATE_LIMIT_MAX: "500",
    ENABLE_ANALYTICS: "true",
    CORS_ALLOWED_ORIGINS: "http://localhost:3000,https://app.example.com",
    ADMIN_EMAIL: "admin@example.com",
  };

  it("should successfully parse and cast environment variables", () => {
    const config = loadConfig(validBaseEnv);

    assert.equal(config.PORT, 4000);
    assert.equal(typeof config.PORT, "number");
    assert.equal(config.NODE_ENV, "production");
    assert.equal(config.APP_NAME, "Test Suite App");
    assert.equal(config.DATABASE_URL, "postgres://user:pass@localhost:5432/testdb");
    assert.equal(config.API_SECRET_KEY, "super_secret_test_key_123456");
    assert.equal(config.RATE_LIMIT_MAX, 500);
    assert.equal(config.ENABLE_ANALYTICS, true);
    assert.deepEqual(config.CORS_ALLOWED_ORIGINS, ["http://localhost:3000", "https://app.example.com"]);
    assert.equal(config.ADMIN_EMAIL, "admin@example.com");
  });

  it("should apply default values when optional variables are omitted", () => {
    const minimalEnv = {
      DATABASE_URL: "https://db.local",
      API_SECRET_KEY: "a_valid_secret_key_16_chars",
    };

    const config = loadConfig(minimalEnv);

    assert.equal(config.PORT, 3000);
    assert.equal(config.NODE_ENV, "development");
    assert.equal(config.APP_NAME, "Envocado Demo Store");
    assert.equal(config.RATE_LIMIT_MAX, 100);
    assert.equal(config.ENABLE_ANALYTICS, false);
    assert.deepEqual(config.CORS_ALLOWED_ORIGINS, ["http://localhost:3000", "http://127.0.0.1:3000"]);
  });

  it("should return an immutable (frozen) object from loadConfig", () => {
    const config = loadConfig({
      DATABASE_URL: "https://db.local",
      API_SECRET_KEY: "a_valid_secret_key_16_chars",
    });

    assert.equal(Object.isFrozen(config), true);
    assert.throws(() => {
      // @ts-ignore
      config.PORT = 9999;
    }, TypeError);
  });

  it("should throw a formatted error on missing required variables", () => {
    assert.throws(
      () => {
        loadConfig({});
      },
      (err) => {
        assert.match(err.message, /DATABASE_URL is required/);
        assert.match(err.message, /API_SECRET_KEY is required/);
        return true;
      }
    );
  });

  it("should redact secrets and never leak secret values in error messages", () => {
    const secretValue = "super_private_token_abc";
    assert.throws(
      () => {
        loadConfig({
          DATABASE_URL: "https://db.local",
          API_SECRET_KEY: "short", // Invalid: minLength is 16
        });
      },
      (err) => {
        assert.doesNotMatch(err.message, /short/);
        assert.match(err.message, /API_SECRET_KEY/);
        return true;
      }
    );
  });

  it("should safely sanitize secrets for display", () => {
    const config = {
      PORT: 3000,
      DATABASE_URL: "postgres://localhost:5432/test",
      API_SECRET_KEY: "my_ultra_secret_key_string",
    };

    const sanitized = getSanitizedConfig(config);
    assert.equal(sanitized.PORT, 3000);
    assert.equal(sanitized.DATABASE_URL, "postgres://localhost:5432/test");
    assert.equal(sanitized.API_SECRET_KEY, "●●●●●●●● (redacted)");
  });

  it("should validate configurations without throwing via validateConfig", () => {
    const invalidResult = validateConfig({ PORT: "not-a-port" });
    assert.equal(invalidResult.ok, false);
    assert.ok(invalidResult.errors.length > 0);

    const validResult = validateConfig({
      DATABASE_URL: "https://db.local",
      API_SECRET_KEY: "valid_secret_minimum_16_chars",
    });
    assert.equal(validResult.ok, true);
    assert.equal(validResult.errors.length, 0);
  });
});
