/**
 * Main Application Server Entry Point
 * Demonstrates Envocado's fail-fast boot-time environment validation.
 */
import { loadConfig } from "./config/env.js";
import { createApp } from "./app.js";

// 1. Fail-fast configuration validation at boot time
let config;
try {
  config = loadConfig(process.env);
  console.log("🥑 Envocado: Environment configuration successfully verified and locked!");
} catch (error) {
  console.error("=================================================");
  console.error("❌ Envocado: Server startup aborted!");
  console.error("Configuration validation failed with errors:");
  console.error("=================================================");
  console.error(error.message);
  console.error("\nPlease update your environment variables or .env file.");
  process.exit(1);
}

// 2. Initialize and boot Express application with frozen config
const app = createApp(config);

const server = app.listen(config.PORT, () => {
  console.log(`🚀 ${config.APP_NAME} running at http://localhost:${config.PORT}`);
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Immutable Config: ${Object.isFrozen(config) ? "LOCKED" : "UNLOCKED"}`);
});

// 3. Graceful shutdown handlers
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log("Server closed cleanly.");
    process.exit(0);
  });
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
