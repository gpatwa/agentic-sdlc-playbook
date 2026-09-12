// OTLP probe — dependency-free Node ESM. Verifies TELEMETRY.md against reality.
//
//   node <playbook>/execution/otlp-probe.mjs [--port 4318] [--timeout 120] [--out DIR]
//
// `TELEMETRY.md` is written from Claude Code's and OpenTelemetry's documentation.
// Documentation is a claim, not evidence, and this repo's whole argument is that
// the difference matters. This tool is how that protocol gets checked: it stands
// in as the OTLP endpoint, records what actually arrives, and reports which
// documented signals were present.
//
// It is not a collector. It decodes nothing — protobuf stores string values
// verbatim on the wire, so scanning for printable runs surfaces attribute names
// and values without a dependency or a decode step. That is enough to answer the
// only question being asked: does the runtime emit what we said it does?
//
// Exits non-zero when nothing arrived, so a run that proves nothing fails loudly
// rather than printing an empty report that reads like a pass.
import { createServer } from "node:http";
import { writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const PORT = Number(flag("port", 4318));
const TIMEOUT = Number(flag("timeout", 0)); // seconds; 0 = run until interrupted
const OUT = flag("out", "./otlp-capture");

// Every signal TELEMETRY.md claims Claude Code emits. Keep in sync with it:
// a claim that stops being checked here is a claim nothing verifies.
const CLAIMS = {
  "claude_code.api_request": "event — per-call model, tokens, cost, duration",
  "claude_code.tool_result": "event — per tool call",
  "claude_code.token.usage": "metric — tokens by type and query_source",
  "claude_code.cost.usage": "metric — cost by model and query_source",
  "claude_code.interaction": "span (beta) — root of the span tree",
  "claude_code.llm_request": "span (beta) — model call",
  "claude_code.tool": "span (beta) — tool execution",
  "gen_ai.request.attempt": "span — the only gen_ai.* name in the tree",
  query_source: "attribute — main / subagent / auxiliary",
  subagent: "value — the subagent/main split trace@2 records as executor",
  "agent.name": "attribute — collapses user-defined agents to \"custom\"",
  agent_id: "span attribute — identifies one agent",
  parent_agent_id: "span attribute — orchestrator to subagent edge",
  subagent_type: "span attribute — the per-role name metrics lack",
  input_tokens: "attribute — runtime-sourced, replaces self-report",
  output_tokens: "attribute — runtime-sourced, replaces self-report",
  cost_usd: "attribute — runtime-sourced",
  duration_ms: "attribute — wall-clock, runtime-sourced",
  effort: "attribute — the level a stage actually ran at",
  "prompt.id": "attribute — correlates a prompt to its calls and tools",
  custom: "value — confirms the agent.name collapse is real",
};

mkdirSync(OUT, { recursive: true });

// `claude_code.tool` is a prefix of `claude_code.tool_result`, so a plain
// substring test reports the span present whenever the event appears. A check
// that misreports is worse than no check: it sends you concluding the wrong
// thing. Require the next character not to continue the identifier.
const has = (hay, needle) => {
  let i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) {
    const after = hay[i + needle.length];
    if (after === undefined || !/[A-Za-z0-9_.]/.test(after)) return true;
    i += 1;
  }
  return false;
};

// Printable-ASCII runs of 3+ chars. Protobuf stores string fields uncompressed,
// so attribute keys and string values survive this intact.
const strings = (buf) => {
  const out = [];
  let cur = "";
  for (const b of buf) {
    if (b >= 32 && b < 127) cur += String.fromCharCode(b);
    else { if (cur.length >= 3) out.push(cur); cur = ""; }
  }
  if (cur.length >= 3) out.push(cur);
  return out;
};

const seen = new Map();
const endpoints = new Map();
let n = 0;
let done = false;

const server = createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const i = ++n;
    const ct = String(req.headers["content-type"] || "");
    endpoints.set(req.url, (endpoints.get(req.url) || 0) + 1);
    writeFileSync(join(OUT, `${String(i).padStart(4, "0")}-${req.url.replace(/\//g, "_")}.bin`), body);

    const found = new Set();
    if (ct.includes("json")) {
      const text = body.toString("utf8");
      for (const c of Object.keys(CLAIMS)) if (has(text, c)) found.add(c);
      appendFileSync(join(OUT, "decoded.jsonl"), text + "\n");
    } else {
      const ss = strings(body);
      for (const s of ss) for (const c of Object.keys(CLAIMS)) if (has(s, c)) found.add(c);
      appendFileSync(join(OUT, "strings.log"), `--- #${i} ${req.url} ---\n${ss.join("\n")}\n`);
    }
    for (const f of found) seen.set(f, (seen.get(f) || 0) + 1);

    console.log(`#${i} ${req.method} ${req.url} ${body.length}b ${ct.split(";")[0] || "-"} | ${[...found].join(", ") || "no claimed signals"}`);

    // OTLP treats a non-2xx as a failed export and retries, which would inflate
    // the request count and misrepresent how much the runtime actually sent.
    res.writeHead(200, { "content-type": "application/json" });
    res.end("{}");
  });
});

const report = () => {
  if (done) return;
  done = true;

  const present = Object.keys(CLAIMS).filter((c) => seen.has(c));
  const absent = Object.keys(CLAIMS).filter((c) => !seen.has(c));

  const L = [];
  L.push(`# OTLP probe — TELEMETRY.md verification`);
  L.push(``);
  L.push(`Ran ${new Date().toISOString().replace(/\.\d+Z$/, "Z")} on port ${PORT}.`);
  L.push(`**${n} request(s)** received${n ? ` across ${[...endpoints.keys()].join(", ")}` : ""}.`);
  L.push(``);
  if (n === 0) {
    L.push(`**Nothing arrived.** This verifies nothing either way. Either telemetry`);
    L.push(`was not enabled for the session, the session was started before the env`);
    L.push(`was set, or the endpoint differs. Claude Code reads its environment at`);
    L.push(`process start, so the session must be restarted after enabling it.`);
  } else {
    L.push(`| Signal | Status | Seen | What it is |`);
    L.push(`|---|---|---|---|`);
    for (const c of Object.keys(CLAIMS)) {
      const ok = seen.has(c);
      L.push(`| \`${c}\` | ${ok ? "**present**" : "absent"} | ${ok ? seen.get(c) : "—"} | ${CLAIMS[c]} |`);
    }
    L.push(``);
    L.push(`${present.length}/${Object.keys(CLAIMS).length} documented signals observed.`);
    if (absent.length) {
      L.push(``);
      L.push(`**Absent is not automatically a failure.** Span-only signals require`);
      L.push(`\`CLAUDE_CODE_ENHANCED_TELEMETRY_BETA\`, and a session that spawned no`);
      L.push(`subagent cannot produce \`subagent\`, \`parent_agent_id\` or \`subagent_type\`.`);
      L.push(`Absent with the beta flag set and subagents spawned *is* a finding, and`);
      L.push(`means TELEMETRY.md overstates what the runtime emits.`);
    }
  }
  L.push(``);
  L.push(`Raw payloads are in \`${OUT}/\`.`);

  const md = L.join("\n");
  writeFileSync(join(OUT, "report.md"), md + "\n");
  console.log(`\n${md}\n`);
  console.log(`report written to ${join(OUT, "report.md")}`);

  server.close();
  process.exit(n === 0 ? 1 : 0);
};

server.listen(PORT, () => {
  console.log(`otlp-probe listening on http://localhost:${PORT} → ${OUT}/`);
  console.log(`checking ${Object.keys(CLAIMS).length} signals documented in TELEMETRY.md`);
  console.log(TIMEOUT ? `reporting after ${TIMEOUT}s` : `Ctrl-C to report`);
});

if (TIMEOUT) setTimeout(report, TIMEOUT * 1000).unref?.();
process.on("SIGINT", report);
process.on("SIGTERM", report);
