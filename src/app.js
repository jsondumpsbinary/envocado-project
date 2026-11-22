import express from "express";
import { envSchema, validateConfig, getSanitizedConfig } from "./config/env.js";

/**
 * Creates and configures the Express application instance.
 *
 * @param {Record<string, any>} config - Validated and frozen configuration object
 * @returns {express.Application}
 */
export function createApp(config) {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic CORS support using configured allowed origins
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (config.CORS_ALLOWED_ORIGINS && config.CORS_ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Serve static assets from public directory
  app.use(express.static("public"));

  // --- API Routes ---

  /**
   * Health Check Endpoint
   */
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      appName: config.APP_NAME,
      rateLimitMax: config.RATE_LIMIT_MAX,
      analyticsEnabled: config.ENABLE_ANALYTICS,
    });
  });

  /**
   * Current Configuration (Sanitized) Endpoint
   * Secrets like API_SECRET_KEY are strictly redacted.
   */
  app.get("/api/config", (req, res) => {
    const sanitized = getSanitizedConfig(config);
    const schemaDetails = Object.entries(envSchema).map(([key, def]) => ({
      key,
      type: def.type || "string",
      required: Boolean(def.required),
      secret: Boolean(def.secret),
      default: def.default !== undefined ? def.default : null,
      currentValue: sanitized[key],
    }));

    res.json({
      success: true,
      appName: config.APP_NAME,
      isFrozen: Object.isFrozen(config),
      config: sanitized,
      schema: schemaDetails,
    });
  });

  /**
   * Interactive Environment Validator Endpoint
   * Accepts an arbitrary environment key-value map and returns Envocado validation results.
   */
  app.post("/api/validate-env", (req, res) => {
    const inputEnv = req.body.env || req.body || {};
    const result = validateConfig(inputEnv);

    res.json({
      ok: result.ok,
      errors: result.errors,
      warnings: result.warnings,
      config: result.ok ? getSanitizedConfig(result.config) : {},
    });
  });

  /**
   * Feature Showcase Endpoint
   */
  app.get("/api/features", (req, res) => {
    res.json({
      package: "envocado",
      highlights: [
        {
          title: "Zero Runtime Dependencies",
          description: "Runs purely on standard JavaScript and Node.js APIs.",
        },
        {
          title: "Fail-Fast Startup Gating",
          description: "Blocks application boot immediately if required variables are missing or invalid.",
        },
        {
          title: "Automatic Type Casting",
          description: "Parses strings into port numbers, integers, booleans, enums, URLs, and lists.",
        },
        {
          title: "Strict Secret Redaction",
          description: "Variables marked secret: true never appear in terminal error logs or stack traces.",
        },
        {
          title: "Immutable Config Object",
          description: "createEnv() returns Object.freeze() to prevent runtime mutation bugs.",
        },
      ],
    });
  });

  // Catch-all 404 for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });

  return app;
}
