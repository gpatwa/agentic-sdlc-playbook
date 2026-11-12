#!/usr/bin/env node
// Event log — PreToolUse / PostToolUse / PostToolUseFailure hook. Dependency-free.
//
// Writes one line per tool call to .claude/events/<session_id>.jsonl, chained: each
// line carries the SHA-256 of the previous raw line, so editing or deleting a line
// breaks the chain (execution/events-verify.mjs recomputes it). The hook, not an
// agent, writes the file; agents never see this as a tool.
//
// WHAT IT RECORDS, AND WHAT IT NEVER DOES. A line holds the time, the session, the
// agent type and id (which role made the call, from the hook payload), the tool, the
// call's id, and a target: a project-relative path for file tools, a subagent type
// for Agent, and for Bash only the program name and a 12-character hash of the full
// command. For the two web tools (pack v34) it records, for WebFetch, the host and path
// of the URL (never the query string or fragment), and for WebSearch the first four words
// of the query and a 12-character hash of the whole of it. It never records file contents,
// command text, other tool input or tool output, so the log cannot hold a secret a tool
// touched. The first words of a search are the one place free text from a query is kept.
// Pack v35: on the post line of a web call it also records `out`, the SHA-256 and length of
// what the tool returned (never the text), so a copy of what the agent was shown can later
// be checked against the record, and two runs can be told apart by what they read.
//
// FAILS OPEN, DELIBERATELY. This is observability, not a safety gate (that is
// write-scope-guard.mjs, which fails closed): any error exits 0 and prints nothing,
// so a logging fault can never block a run. A missing line shows up as a gap in the
// chain when the log is verified.
//
// usage:  node .claude/hooks/event-log.mjs <pre|post|fail>
// stdin:  Claude Code hook payload (JSON)
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, openSync, closeSync, unlinkSync, statSync, existsSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join, resolve, relative, isAbsolute, sep } from "node:path";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const FILE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit", "Read"]);

export function targetOf(tool, input, projectDir) {
  try {
    if (FILE_TOOLS.has(tool)) {
      const p = input?.file_path ?? input?.notebook_path;
      if (typeof p !== "string" || !p) return "";
      const abs = isAbsolute(p) ? resolve(p) : resolve(projectDir, p);
      const rel = relative(projectDir, abs);
      return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel.split(sep).join("/") : `(outside) ${abs}`;
    }
    if (tool === "Bash") {
      const cmd = String(input?.command ?? "");
      const prog = cmd.trim().split(/\s+/)[0] || "";
      return `${prog.replace(/[^\w./-]/g, "").slice(0, 40)} #${sha(cmd).slice(0, 12)}`;
    }
    if (tool === "Agent" || tool === "Task") return String(input?.subagent_type ?? "").slice(0, 60);
    if (tool === "Grep" || tool === "Glob") return String(input?.path ?? "").slice(0, 120);
    // Web tools: what was read must be in the record. A fetch logs host and path (no query string,
    // which can carry tokens). A search logs a hash and the first words only, so a private term
    // that slipped into a query is not copied into the log in full.
    if (tool === "WebFetch") {
      const u = new URL(String(input?.url ?? ""));
      return `${u.host}${u.pathname}`.slice(0, 160);
    }
    if (tool === "WebSearch") {
      const q = String(input?.query ?? "");
      return `${q.trim().split(/\s+/).slice(0, 4).join(" ").slice(0, 40)} #${sha(q).slice(0, 12)}`;
    }
  } catch { /* fall through */ }
  return "";
}

// What a web tool returned, as a hash and a length only (pack v35). Never the content.
export function outOf(phase, tool, response) {
  try {
    if (phase !== "post" || (tool !== "WebFetch" && tool !== "WebSearch") || response === undefined) return {};
    const s = typeof response === "string" ? response : JSON.stringify(response);
    return { out: `sha256:${sha(s)} len:${s.length}` };
  } catch { return {}; }
}

function lastLine(file) {
  if (!existsSync(file)) return null;
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n").filter(Boolean);
  return lines.length ? lines[lines.length - 1] : null;
}

// A directory-free lock: a file created exclusively. Concurrent subagents would
// otherwise read the same last line and fork the chain.
function withLock(lockPath, fn) {
  const deadline = Date.now() + 3000;
  for (;;) {
    try { closeSync(openSync(lockPath, "wx")); break; }
    catch {
      try { if (Date.now() - statSync(lockPath).mtimeMs > 5000) unlinkSync(lockPath); } catch { /* raced */ }
      if (Date.now() > deadline) return; // give up: fail open
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15);
    }
  }
  try { fn(); } finally { try { unlinkSync(lockPath); } catch { /* already gone */ } }
}

export function record(phase, payload, projectDir, now = new Date()) {
  const session = String(payload?.session_id ?? "unknown").replace(/[^\w-]/g, "_").slice(0, 80);
  const dir = join(projectDir, ".claude", "events");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${session}.jsonl`);
  withLock(`${file}.lock`, () => {
    const prevRaw = lastLine(file);
    const prev = prevRaw ? sha(prevRaw) : "genesis";
    const seq = prevRaw ? (JSON.parse(prevRaw).seq ?? 0) + 1 : 1;
    const tool = String(payload?.tool_name ?? "");
    const line = {
      v: 1, seq, t: now.toISOString(), ev: phase, session,
      agent: String(payload?.agent_type ?? "main"), agent_id: String(payload?.agent_id ?? ""),
      tool, id: String(payload?.tool_use_id ?? ""),
      target: targetOf(tool, payload?.tool_input, projectDir),
      ...outOf(phase, tool, payload?.tool_response),
      prev,
    };
    appendFileSync(file, JSON.stringify(line) + "\n");
  });
}

// import.meta.url is the REAL path; process.argv[1] is the path as invoked (maybe via a symlink, e.g. macOS /var -> /private/var). Resolve both.
const isMain = (() => { try { return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (isMain) {
  try {
    const phase = process.argv[2];
    if (!["pre", "post", "fail"].includes(phase)) process.exit(0);
    const raw = readFileSync(0, "utf8");
    const payload = JSON.parse(raw);
    const projectDir = resolve(process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd());
    record(phase, payload, projectDir);
  } catch { /* fail open */ }
  process.exit(0);
}
