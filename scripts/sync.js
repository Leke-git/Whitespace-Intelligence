const fs = require("fs");
const https = require("https");
const http = require("http");

const N8N_BASE_URL = (process.env.N8N_BASE_URL || "").replace(/\/$/, "");
const N8N_API_KEY = process.env.N8N_API_KEY || "";
const CHANGED_FILES = process.env.CHANGED_FILES || "";

if (!N8N_BASE_URL) {
  console.error("❌ ERROR: N8N_BASE_URL secret is not set in GitHub Secrets.");
  process.exit(1);
}
if (!N8N_API_KEY) {
  console.error("❌ ERROR: N8N_API_KEY secret is not set in GitHub Secrets.");
  process.exit(1);
}

function apiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${N8N_BASE_URL}/api/v1${endpoint}`;
    const url = new URL(fullUrl);
    console.log(`   🌐 API Request: ${method} ${fullUrl}`);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) options.headers["Content-Length"] = Buffer.byteLength(bodyStr);
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const statusCode = res.statusCode;
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        if (statusCode >= 200 && statusCode < 300) {
          resolve({ statusCode, data: parsed });
        } else {
          reject({ statusCode, message: parsed?.message || data || "Unknown error" });
        }
      });
    });
    req.on("error", (err) => reject({ message: err.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function validateWorkflow(workflow, filePath) {
  const errors = [];
  if (!workflow.name || typeof workflow.name !== "string") errors.push('Missing "name" field');
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) errors.push('Missing "nodes" array');
  if (!workflow.connections || typeof workflow.connections !== "object") errors.push('Missing "connections" object');
  if (errors.length > 0) {
    console.error(`\n❌ Validation failed for: ${filePath}`);
    errors.forEach((e) => console.error(`   • ${e}`));
    return false;
  }
  return true;
}

function prepareBody(workflow) {
  const allowed = ["name", "nodes", "connections", "settings", "staticData", "meta", "tags"];
  const body = {};
  allowed.forEach((key) => {
    if (workflow[key] !== undefined) body[key] = workflow[key];
  });
  return body;
}

async function main() {
  console.log(`🔍 Raw CHANGED_FILES from environment: "${CHANGED_FILES}"`);
  const changedFiles = CHANGED_FILES.split("\n")
    .map((f) => f.trim())
    .filter((f) => f.endsWith(".json") && f.startsWith("n8n/"));

  if (changedFiles.length === 0) {
    console.log("ℹ️  No n8n workflow JSON files found. Nothing to do.");
    return;
  }

  console.log(`\n🔍 Found ${changedFiles.length} changed workflow file(s):\n`);
  changedFiles.forEach((f) => console.log(`   • ${f}`));

  let successCount = 0;
  let failCount = 0;

  for (const filePath of changedFiles) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📄 Processing: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found. Skipping.`);
      continue;
    }

    let workflow;
    try {
      workflow = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      console.error(`❌ Could not parse JSON: ${err.message}`);
      failCount++;
      continue;
    }

    if (!validateWorkflow(workflow, filePath)) { failCount++; continue; }

    const workflowId = workflow.id;
    const isActive = workflow.active === true;
    const operation = workflowId ? "UPDATE" : "CREATE";

    console.log(`   Name: ${workflow.name} | Operation: ${operation} | Active: ${isActive}`);

    try {
      let result;
      if (operation === "CREATE") {
        result = await apiRequest("POST", "/workflows", prepareBody(workflow));
        const newId = result.data?.id;
        console.log(`   ✅ Created! New ID: ${newId}`);
        console.log(`   ⚠️  Add "id": "${newId}" to n8n/workflow.json for future updates.`);
        if (isActive && newId) {
          await apiRequest("POST", `/workflows/${newId}/activate`);
          console.log(`   ✅ Activated!`);
        }
      } else {
        result = await apiRequest("PUT", `/workflows/${workflowId}`, prepareBody(workflow));
        console.log(`   ✅ Updated!`);
        const currentlyActive = result.data?.active;
        if (isActive && !currentlyActive) {
          await apiRequest("POST", `/workflows/${workflowId}/activate`);
          console.log(`   ✅ Activated!`);
        } else if (!isActive && currentlyActive) {
          await apiRequest("POST", `/workflows/${workflowId}/deactivate`);
          console.log(`   ✅ Deactivated!`);
        }
      }
      successCount++;
    } catch (err) {
      console.error(`\n   ❌ n8n API Error (HTTP ${err.statusCode || "?"}): ${err.message}`);
      if (err.statusCode === 401) console.error(`   💡 Check your N8N_API_KEY secret.`);
      if (err.statusCode === 404) console.error(`   💡 Workflow ID not found. Remove "id" to create fresh.`);
      if (!err.statusCode) console.error(`   💡 Cannot reach n8n. Check N8N_BASE_URL.`);
      failCount++;
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`✅ Succeeded: ${successCount} | ❌ Failed: ${failCount}`);
  if (failCount > 0) process.exit(1);
}

main().catch((err) => { console.error("Unexpected error:", err); process.exit(1); });
