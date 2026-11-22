# Envocado Project 🥑

> **Interactive Express & Node.js environment validation demo powered by Envocado.**

This demo project demonstrates how to enforce **fail-fast, zero-dependency environment variable validation** in a real-world Node.js / Express application before the server boots.

---

## 💡 What is Envocado?

**Envocado** is a lightweight, zero-runtime-dependency validation toolkit for Node.js. It catches configuration errors upfront before your application listens for requests, preventing silent runtime bugs, crashes, and accidental secret leaks in production logs.

---

## ✨ Features Demonstrated in this Project

- **Fail-Fast Startup Gating**: If critical variables are missing or invalid, the server halts immediately with human-readable error messages.
- **Type Coercion**: Automatically casts raw string environment variables into `port`, `int`, `enum`, `boolean`, `url`, and `list` types.
- **Strict Secret Redaction**: Variables marked with `secret: true` (e.g. `API_SECRET_KEY`) are protected and never leaked in logs, error traces, or API responses.
- **Immutable Configuration**: Produces a frozen `Object.freeze()` configuration object to prevent runtime mutations.
- **Interactive Web Dashboard**: A built-in browser UI at `http://localhost:3000` to inspect active configuration and test validation scenarios in real time.
- **RESTful Validation API**: Endpoints to check server health, view sanitized config, and validate custom environment payloads.

---

## 📁 Project Structure

```text
envocado-project/
├── .env.example          # Template environment variable configuration
├── .gitignore            # Git exclusions (node_modules, .env, logs)
├── package.json          # Project manifest and scripts
├── public/               # Interactive frontend demo dashboard
│   ├── app.js            # Client-side validation runner
│   ├── index.html        # Dashboard UI
│   └── style.css         # Modern dark theme styles
├── src/
│   ├── app.js            # Express application setup & API endpoints
│   ├── config/
│   │   └── env.js        # Envocado schema definition and loader
│   └── server.js         # Bootstrapping script with startup gating
└── test/
    ├── api.test.js       # Express endpoint tests
    └── config.test.js    # Envocado schema validation unit tests
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (verified on `v26.13.0`)
- **npm**: `v9.0.0` or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/jsondumpsbinary/envocado-project.git
cd envocado-project

# Install dependencies
npm install
```

### 3. Configure Environment Variables
Copy the template configuration into a local `.env` file:
```bash
cp .env.example .env
```

Review `.env`:
```ini
PORT=3000
NODE_ENV=development
APP_NAME=Envocado Demo Store
DATABASE_URL=postgres://demo_user:demopass123@localhost:5432/envocado_demo
API_SECRET_KEY=super_secure_secret_token_12345
RATE_LIMIT_MAX=100
ENABLE_ANALYTICS=true
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_EMAIL=admin@envocado.dev
```

### 4. Run the Application
```bash
# Production start
npm start

# Development mode (with file watching)
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`** to view the interactive dashboard.

---

## 🥑 Demonstrating Startup Gating

Envocado intercepts configuration problems **before** the Express server starts listening for traffic.

### Scenario A: Startup Blocked (Missing required variables)
Run the server without required variables:
```bash
PORT=3000 node src/server.js
```
**Result**: Startup is aborted with detailed diagnostics:
```text
=================================================
❌ Envocado: Server startup aborted!
Configuration validation failed with errors:
=================================================
  Envocado: Configuration validation failed

✖ DATABASE_URL
  DATABASE_URL is required.

✖ API_SECRET_KEY
  API_SECRET_KEY is required.
```

### Scenario B: Startup Blocked (Invalid port & secret length)
```bash
PORT=99999 API_SECRET_KEY=short DATABASE_URL=https://db.local node src/server.js
```
**Result**: Startup is blocked because `PORT` exceeds `65535` and `API_SECRET_KEY` is below the 16-character minimum.

### Scenario C: Successful Startup
```bash
DATABASE_URL=postgres://localhost:5432/db API_SECRET_KEY=my_secure_secret_key_123 node src/server.js
```
**Result**:
```text
🥑 Envocado: Environment configuration successfully verified and locked!
🚀 Envocado Demo Store running at http://localhost:3000
   Environment: development
   Immutable Config: LOCKED
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server uptime and active environment state |
| `GET` | `/api/config` | Sanitized configuration (secrets securely masked) |
| `POST` | `/api/validate-env` | Interactive sandbox endpoint for validating custom env objects |
| `GET` | `/api/features` | Core Envocado feature summary list |

---

## 🧪 Running Tests

The project includes unit and integration tests using Node.js's native test runner (`node:test`):

```bash
npm test
```

---

## 📄 License

MIT &copy; Parineeta
