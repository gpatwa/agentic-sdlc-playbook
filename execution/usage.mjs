#!/usr/bin/env node
// usage.mjs — measured token usage per slice and per stage, from the logs
// Claude Code itself writes. Dependency-free.
//
//   node <playbook>/execution/usage.mjs <product-repo> [--slice <id>] [--logs <dir>]... [--write] [--json]
//
// WHY THIS EXISTS. trace.json's per-stage `tokens` has been taken from the
// harness's spawn result, `totalTokens` — which is the context size of the
// stage's LAST request, not what the stage consumed. A stage that made 55
// requests and processed 4.4M tokens (mostly cache reads) was recorded as
// ~118k. Both numbers are real and both matter, but for different questions:
//
//   peakContext   how close a stage came to its context window
//   processed     what it actually consumed, request by request
//
// This tool reports both, labelled, and never lets one stand in for the other.
//
// SOURCE. ~/.claude/projects/<encoded-dir>/<session>.jsonl carries each spawn's
// result (agentId, agentType, prompt, totalTokens); <session>/subagents/
// agent-<agentId>.jsonl carries every request that subagent made, with usage.
// Written by the harness, not reported by the agent being measured.
//
// ATTRIBUTION. A spawn belongs to a slice when its prompt names
// runs/<slice-id>/ AND that directory exists in the product repo. Both the
// product repo's log directory and the playbook's are searched by default,
// because slices have often been driven from a session rooted in the playbook.
//
// NOT MEASURED HERE: the Orchestrator's own turns. They live in the main
// session log interleaved with everything else that session did, and are not
// attributed to a slice. Totals cover subagent stages only, and say so.
//
// --write puts the result in runs/<slice>/usage.json. It does not touch
// trace.json, which is the Orchestrator's record.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

// Relative cost weights per token type, from Anthropic's published pricing
// (cache read 0.1x input, 5-minute write 1.25x, 1-hour write 2x, output 5x
// for the current Opus and Sonnet tiers). On a subscription there is no bill:
// "inputEquivalents" is a weight for comparing stages, not a dollar figure.
export const WEIGHTS = { input: 1, cacheRead: 0.1, cacheWrite5m: 1.25, cacheWrite1h: 2, output: 5 };

const GENERIC = new Set(["claude", "general-purpose"]);

export const encodeDir = (p) => resolve(p).replace(/[^a-zA-Z0-9]/g, "-");

const readJsonl = (f) => {
  const out = [];
  for (const line of readFileSync(f, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* a torn last line is normal mid-session */ }
  }
  return out;
};

// Sum one subagent's requests. Streaming writes the same request's usage on
// several lines, so rows are keyed by requestId and the last copy wins.
export const sumSubagent = (rows) => {
  const byReq = new Map();
  const models = new Set();
  for (const r of rows) {
    const u = r?.message?.usage;
    if (!u) continue;
    byReq.set(r.requestId ?? r.uuid ?? byReq.size, u);
    if (r.message.model && r.message.model !== "<synthetic>") models.add(r.message.model);
  }
  const t = { requests: 0, input: 0, cacheRead: 0, cacheWrite5m: 0, cacheWrite1h: 0, output: 0 };
  for (const u of byReq.values()) {
    const cw = u.cache_creation_input_tokens ?? 0;
    const h1 = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    t.requests++;
    t.input += u.input_tokens ?? 0;
    t.cacheRead += u.cache_read_input_tokens ?? 0;
    t.cacheWrite1h += h1;
    t.cacheWrite5m += Math.max(0, cw - h1);
    t.output += u.output_tokens ?? 0;
  }
  t.processed = t.input + t.cacheRead + t.cacheWrite5m + t.cacheWrite1h + t.output;
  t.inputEquivalents = Math.round(
    t.input * WEIGHTS.input + t.cacheRead * WEIGHTS.cacheRead +
    t.cacheWrite5m * WEIGHTS.cacheWrite5m + t.cacheWrite1h * WEIGHTS.cacheWrite1h +
    t.output * WEIGHTS.output,
  );
  t.models = [...models].sort();
  return t;
};

// The slice a spawn worked on: the runs/<id>/ its prompt names most often,
// among slices that actually exist in this product repo.
export const sliceOf = (prompt, known) => {
  const counts = new Map();
  for (const m of String(prompt ?? "").matchAll(/runs\/([a-z0-9][a-z0-9-]*)\//g)) {
    if (known.has(m[1])) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  let best = null;
  for (const [id, n] of counts) if (!best || n > best[1]) best = [id, n];
  return best?.[0] ?? null;
};

export const collect = ({ repo, logDirs, only }) => {
  const runsDir = join(repo, "runs");
  const known = new Set(
    existsSync(runsDir)
      ? readdirSync(runsDir).filter((d) => statSync(join(runsDir, d)).isDirectory())
      : [],
  );
  // Keyed by agentId: that key is what stops overlapping log dirs double
  // counting. The has() check below only skips re-reading a log already summed.
  const spawns = new Map();
  for (const dir of logDirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".jsonl"))) {
      const session = join(dir, f);
      for (const row of readJsonl(session)) {
        const r = row.toolUseResult;
        if (!r || typeof r !== "object" || !r.agentId || spawns.has(r.agentId)) continue;
        const slice = sliceOf(r.prompt, known);
        if (!slice || (only && slice !== only)) continue;
        const log = join(session.slice(0, -".jsonl".length), "subagents", `agent-${r.agentId}.jsonl`);
        let meta = {};
        try { meta = JSON.parse(readFileSync(log.replace(/\.jsonl$/, ".meta.json"), "utf8")); } catch { /* older runs have none */ }
        const type = r.agentType ?? meta.agentType ?? null;
        spawns.set(r.agentId, {
          slice,
          agentId: r.agentId,
          role: type,
          // A generic type means the brief was inlined into a general agent,
          // so least-privilege did not bind for this stage (ADAPTERS.md inv. 4).
          generic: !type || GENERIC.has(type),
          description: meta.description ?? r.description ?? null,
          finishedAt: row.timestamp ?? null,
          durationMs: r.totalDurationMs ?? null,
          toolCalls: r.totalToolUseCount ?? null,
          peakContext: r.totalTokens ?? null,
          measured: existsSync(log) ? sumSubagent(readJsonl(log)) : null,
        });
      }
    }
  }
  const bySlice = {};
  for (const s of [...spawns.values()].sort((a, b) => String(a.finishedAt).localeCompare(String(b.finishedAt)))) {
    (bySlice[s.slice] ??= []).push(s);
  }
  return bySlice;
};

export const totals = (spawns) => {
  const m = spawns.filter((s) => s.measured);
  const sum = (k) => m.reduce((a, s) => a + s.measured[k], 0);
  const t = {
    spawns: spawns.length,
    measuredSpawns: m.length,
    unmeasuredSpawns: spawns.length - m.length,
    requests: sum("requests"),
    input: sum("input"), cacheRead: sum("cacheRead"),
    cacheWrite5m: sum("cacheWrite5m"), cacheWrite1h: sum("cacheWrite1h"),
    output: sum("output"), processed: sum("processed"),
    inputEquivalents: sum("inputEquivalents"),
    peakContextSum: spawns.reduce((a, s) => a + (s.peakContext ?? 0), 0),
  };
  const read = t.cacheRead, rest = t.input + t.cacheWrite5m + t.cacheWrite1h;
  t.cacheHitRate = read + rest ? +(read / (read + rest)).toFixed(4) : null;
  return t;
};

// ── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(n);
  const values = (n) => args.flatMap((a, i) => (a === n && args[i + 1] ? [args[i + 1]] : []));
  const repo = args.find((a, i) => !a.startsWith("--") && !["--slice", "--logs"].includes(args[i - 1]));
  if (!repo) {
    console.error("usage: node execution/usage.mjs <product-repo> [--slice <id>] [--logs <dir>]... [--write] [--json]");
    process.exit(1);
  }
  const productRepo = resolve(repo);
  const playbook = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const base = join(homedir(), ".claude", "projects");
  const logDirs = [...new Set([
    join(base, encodeDir(productRepo)),
    join(base, encodeDir(playbook)),
    ...values("--logs").map((d) => resolve(d)),
  ])];

  const bySlice = collect({ repo: productRepo, logDirs, only: values("--slice")[0] });
  const report = Object.fromEntries(
    Object.entries(bySlice).map(([id, spawns]) => [id, { totals: totals(spawns), spawns }]),
  );

  if (flag("--write")) {
    for (const [id, r] of Object.entries(report)) {
      writeFileSync(join(productRepo, "runs", id, "usage.json"), JSON.stringify({
        schema: "aveto/usage@1",
        source: "harness-log",
        note: "Subagent stages only; the Orchestrator's own turns are not attributed. " +
              "peakContext is the last request's context size; processed is the sum over every request.",
        weights: WEIGHTS,
        generatedAt: new Date().toISOString(),
        ...r,
      }, null, 2) + "\n");
    }
  }

  if (flag("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    const k = (n) => (n == null ? "—" : n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : Math.round(n / 1e3) + "k");
    if (!Object.keys(report).length) console.log(`no attributable subagent spawns for ${basename(productRepo)} in:\n  ${logDirs.join("\n  ")}`);
    for (const [id, { totals: t, spawns }] of Object.entries(report)) {
      console.log(`\n${id}  —  ${t.measuredSpawns}/${t.spawns} stages measured, ${t.requests} requests, cache hit ${t.cacheHitRate == null ? "—" : (t.cacheHitRate * 100).toFixed(1) + "%"}`);
      console.log(`  ${"role".padEnd(24)}${"reqs".padStart(6)}${"processed".padStart(11)}${"in-equiv".padStart(10)}${"peak ctx".padStart(10)}   ratio`);
      for (const s of spawns) {
        const m = s.measured;
        const ratio = m && s.peakContext ? (m.processed / s.peakContext).toFixed(0) + "x" : "";
        const label = s.generic ? `*${s.description ?? "unknown"}` : s.role;
        console.log(`  ${String(label).slice(0, 23).padEnd(24)}${String(m?.requests ?? "—").padStart(6)}${k(m?.processed).padStart(11)}${k(m?.inputEquivalents).padStart(10)}${k(s.peakContext).padStart(10)}   ${m ? ratio : "no subagent log"}`);
      }
      console.log(`  ${"TOTAL".padEnd(24)}${String(t.requests).padStart(6)}${k(t.processed).padStart(11)}${k(t.inputEquivalents).padStart(10)}${k(t.peakContextSum).padStart(10)}`);
    }
    console.log(`\n* = spawned as a generic agent (role from its description), so the role's tool restrictions did not bind`);
    console.log(`processed = every token each request sent or received · in-equiv = weighted by cost (notional on a subscription) · peak ctx = what trace.json has been recording`);
  }
}
