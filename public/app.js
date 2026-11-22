/**
 * Frontend Dashboard Interaction Script
 */
document.addEventListener("DOMContentLoaded", () => {
  const configTableBody = document.getElementById("config-table-body");
  const appEnvPill = document.getElementById("app-env-pill");
  const envInput = document.getElementById("env-input");
  const validateBtn = document.getElementById("validate-btn");
  const outputBox = document.getElementById("output-box");
  const featuresGrid = document.getElementById("features-grid");

  // Preset Configurations for Testing
  const presets = {
    valid: {
      PORT: "8080",
      NODE_ENV: "production",
      DATABASE_URL: "postgres://prod_db.internal:5432/app",
      API_SECRET_KEY: "prod_ultra_secure_api_key_99999",
      RATE_LIMIT_MAX: "250",
      ENABLE_ANALYTICS: "true",
      CORS_ALLOWED_ORIGINS: "https://myapp.com,https://admin.myapp.com",
    },
    "missing-db": {
      PORT: "3000",
      NODE_ENV: "development",
      API_SECRET_KEY: "dev_secret_key_12345678",
    },
    "bad-port": {
      PORT: "99999",
      DATABASE_URL: "postgres://localhost:5432/test",
      API_SECRET_KEY: "dev_secret_key_12345678",
    },
    "short-secret": {
      DATABASE_URL: "postgres://localhost:5432/test",
      API_SECRET_KEY: "short_pw",
    },
    "bad-bool": {
      DATABASE_URL: "postgres://localhost:5432/test",
      API_SECRET_KEY: "dev_secret_key_12345678",
      ENABLE_ANALYTICS: "yes",
    },
  };

  // Set default textarea value
  envInput.value = JSON.stringify(presets.valid, null, 2);

  // 1. Fetch & Display Active Configuration
  async function loadActiveConfig() {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();

      if (data.success && data.schema) {
        appEnvPill.textContent = data.config.NODE_ENV || "development";
        configTableBody.innerHTML = "";

        data.schema.forEach((item) => {
          const row = document.createElement("tr");

          const isSecret = item.secret;
          const valDisplay = isSecret
            ? `<span class="val-box val-secret">${item.currentValue || "(redacted)"}</span>`
            : `<span class="val-box">${JSON.stringify(item.currentValue)}</span>`;

          row.innerHTML = `
            <td><span class="var-name">${item.key}</span></td>
            <td><span class="type-tag">${item.type}</span></td>
            <td>${item.required ? '<span style="color:#f87171;">● Yes</span>' : '<span style="color:#94a3b8;">○ No</span>'}</td>
            <td>${valDisplay}</td>
          `;
          configTableBody.appendChild(row);
        });
      }
    } catch (err) {
      configTableBody.innerHTML = `<tr><td colspan="4" style="color:#ef4444;">Failed to load active configuration: ${err.message}</td></tr>`;
    }
  }

  // 2. Fetch & Display Features Highlights
  async function loadFeatures() {
    try {
      const res = await fetch("/api/features");
      const data = await res.json();

      if (data.highlights) {
        featuresGrid.innerHTML = "";
        data.highlights.forEach((h) => {
          const el = document.createElement("div");
          el.className = "feature-item";
          el.innerHTML = `
            <div class="feature-title">${h.title}</div>
            <div class="feature-desc">${h.description}</div>
          `;
          featuresGrid.appendChild(el);
        });
      }
    } catch (err) {
      console.error("Could not fetch features:", err);
    }
  }

  // 3. Preset Button Handlers
  document.querySelectorAll(".btn-outline[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const presetKey = btn.getAttribute("data-preset");
      if (presets[presetKey]) {
        envInput.value = JSON.stringify(presets[presetKey], null, 2);
        runValidation();
      }
    });
  });

  // 4. Run Validation Action
  async function runValidation() {
    outputBox.innerHTML = '<span class="placeholder-text">Validating with Envocado...</span>';
    let parsedInput;
    try {
      parsedInput = JSON.parse(envInput.value);
    } catch (err) {
      outputBox.innerHTML = `<span class="res-error">❌ JSON Syntax Error: ${err.message}</span>`;
      return;
    }

    try {
      const res = await fetch("/api/validate-env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: parsedInput }),
      });
      const data = await res.json();

      if (data.ok) {
        let outputHtml = `<div class="res-success"><strong>🥑 Envocado: Configuration is VALID!</strong></div>\n\n`;
        outputHtml += `<span style="color:#94a3b8;">// Parsed & typed configuration (Object.freeze):</span>\n`;
        outputHtml += `<pre style="color:#a7f3d0; margin-top: 8px;">${JSON.stringify(data.config, null, 2)}</pre>`;
        outputBox.innerHTML = outputHtml;
      } else {
        let outputHtml = `<div class="res-error"><strong>❌ Envocado: Configuration Validation FAILED</strong></div>\n\n`;
        outputHtml += `<div style="color:#f87171; margin-bottom: 8px;">${data.errors.length} validation error(s) detected:</div>\n`;
        data.errors.forEach((err) => {
          outputHtml += `<div style="margin-bottom: 6px; padding-left: 12px; border-left: 2px solid #ef4444; color:#fca5a5;">${escapeHtml(err)}</div>`;
        });
        if (data.warnings && data.warnings.length > 0) {
          outputHtml += `\n<div class="res-warning">Warnings:</div>`;
          data.warnings.forEach((w) => {
            outputHtml += `<div style="padding-left: 12px; border-left: 2px solid #f59e0b; color:#fde047;">${escapeHtml(w)}</div>`;
          });
        }
        outputBox.innerHTML = outputHtml;
      }
    } catch (err) {
      outputBox.innerHTML = `<span class="res-error">Request failed: ${err.message}</span>`;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  validateBtn.addEventListener("click", runValidation);

  // Initialize
  loadActiveConfig();
  loadFeatures();
});
