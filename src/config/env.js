/**
 * Environment Configuration Module
 * Uses Envocado for zero-dependency, fail-fast schema validation.
 */
import { createEnv, validateEnv } from "envocado";

/**
 * Envocado Schema Definition
 * Enforces strong typing, required constraints, defaults, and secret masking.
 */
export const envSchema = {
  PORT: {
    type: "port",
    default: 3000,
  },
  NODE_ENV: {
    type: "enum",
    values: ["development", "production", "test"],
    default: "development",
  },
  APP_NAME: {
    type: "string",
    default: "Envocado Demo Store",
  },
  DATABASE_URL: {
    type: "url",
    required: true,
    protocols: ["postgres", "postgresql", "mysql", "mongodb", "https"],
  },
  API_SECRET_KEY: {
    type: "string",
    required: true,
    secret: true,
    minLength: 16,
  },
  RATE_LIMIT_MAX: {
    type: "int",
    default: 100,
    min: 1,
    max: 10000,
  },
  ENABLE_ANALYTICS: {
    type: "boolean",
    default: false,
  },
  CORS_ALLOWED_ORIGINS: {
    type: "list",
    separator: ",",
    default: ["http://localhost:3000", "http://127.0.0.1:3000"],
  },
  ADMIN_EMAIL: {
    type: "string",
    required: false,
  },
};

/**
 * Validates an environment object non-destructively without throwing.
 * Useful for runtime diagnostics, API validation endpoints, and health checks.
 *
 * @param {Record<string, any>} [source=process.env]
 * @returns {{ ok: boolean, config: Record<string, any>, errors: string[], warnings: string[] }}
 */
export function validateConfig(source = process.env) {
  return validateEnv(envSchema, source);
}

/**
 * Loads and validates environment variables.
 * Returns an immutable, frozen configuration object.
 * Throws a formatted Envocado error if validation fails.
 *
 * @param {Record<string, any>} [source=process.env]
 * @returns {Readonly<Record<string, any>>}
 */
export function loadConfig(source = process.env) {
  return createEnv(envSchema, source);
}

/**
 * Returns a sanitized copy of the configuration object with sensitive
 * values masked, safe for display in dashboards or logging.
 *
 * @param {Record<string, any>} config
 * @returns {Record<string, any>}
 */
export function getSanitizedConfig(config) {
  if (!config || typeof config !== "object") {
    return {};
  }

  const sanitized = { ...config };
  for (const [key, rule] of Object.entries(envSchema)) {
    if (rule.secret && key in sanitized) {
      sanitized[key] = "●●●●●●●● (redacted)";
    }
  }
  return sanitized;
}
