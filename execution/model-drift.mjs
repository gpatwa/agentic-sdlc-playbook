#!/usr/bin/env node
// model-drift: which model each role actually ran on, and has it moved since the role was last rescored?
//
//   node execution/model-drift.mjs <product-repo> [--baselines <file>]
//
// Reads runs/*/usage.json (execution/usage.mjs: the model the harness logged for every request of every spawn).
// Compares each role's most recent spawns with docs/model-change-evals/baselines.json, the model that role was last rescored on.
// Exit 1 if any role with a baseline now runs on a different model ("stale": rescore before relying on it).
//
// Why: the pack names the aliases `opus` and `sonnet`. Claude Code resolves an alias to the newest version and "updates over time",
// and a subagent whose parent is in the same family takes the parent's version, so a release (or the session's own model) can
// move a role with no change to any file here and no check. This makes the move visible. Read-only; no model call; no network.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_BASELINES = join(here, "..", "docs", "model-change-evals", "baselines.json");

// -> [{ slice, role, models: [...], at }] for every non-generic spawn that logged a model, oldest first.
export function collectSpawns(repo) {
  const root = join(repo, "runs");
  if (!existsSync(root)) return [];
  const out = [];
  for (const slice of readdirSync(root)) {
    const f = join(root, slice, "usage.json");
    if (!existsSync(f)) continue;
    let u; try { u = JSON.parse(readFileSync(f, "utf8")); } catch { continue; }
    if (u?.schema !== "aveto/usage@1" || !Array.isArray(u.spawns)) continue;
    for (const s of u.spawns) {
      const models = s?.measured?.models;
      if (!s?.role || s.generic || !Array.isArray(models) || !models.length) continue;
      out.push({ slice, role: s.role, models: [...models].sort(), at: s.finishedAt || "" });
    }
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

// -> one row per role: its models by date first seen, the latest spawn's models, and a status against the baseline.
export function drift(spawns, baselines = {}) {
  const roles = new Map();
  for (const s of spawns) {
    const r = roles.get(s.role) ?? { role: s.role, seen: new Map(), latest: null, latestAt: "" };
    for (const m of s.models) if (!r.seen.has(m)) r.seen.set(m, s.at);
    if (s.at >= r.latestAt) { r.latest = s.models; r.latestAt = s.at; }
    roles.set(s.role, r);
  }
  return [...roles.values()].sort((a, b) => a.role.localeCompare(b.role)).map((r) => {
    const base = baselines[r.role];
    let status, note;
    if (!base || !base.model) { status = "no-baseline"; note = "never rescored: any model change is unmeasured"; }
    else if (r.latest.every((m) => m === base.model)) { status = "ok"; note = `same model as its baseline (${base.date})`; }
    else { status = "stale"; note = `now ${r.latest.join("+")}, baseline ${base.model} (${base.date}): rescore before relying on it`; }
    return { role: r.role, latest: r.latest, seen: [...r.seen].map(([model, firstSeen]) => ({ model, firstSeen })), baseline: base?.model ?? null, status, note };
  });
}

export function render(rows) {
  const w = (s, n) => String(s).slice(0, n).padEnd(n);
  const lines = [`${w("role", 24)}${w("latest model", 24)}${w("baseline", 20)}status`];
  for (const r of rows) lines.push(`${w(r.role, 24)}${w(r.latest.join("+").replace(/^claude-/, ""), 24)}${w((r.baseline ?? "none").replace(/^claude-/, ""), 20)}${r.status}`);
  for (const r of rows.filter((x) => x.seen.length > 1)) lines.push(`\n${r.role} has run on: ${r.seen.map((x) => `${x.model} (first seen ${String(x.firstSeen).slice(0, 10) || "?"})`).join(", ")}`);
  for (const r of rows.filter((x) => x.status === "stale")) lines.push(`\nSTALE ${r.role}: ${r.note}`);
  if (rows.some((x) => x.seen.length > 1 || x.status === "stale")) lines.push("\nA role can move to another model three ways: an alias resolving to a newer model, the session's own model (a subagent whose parent is in the same family takes the parent's version), or a Charter's own choice (its C3 lines). The run's CHARTER.md says which.");
  return lines.join("\n");
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const args = process.argv.slice(2);
  const repo = args[0] && !args[0].startsWith("--") ? args[0] : undefined;
  const bi = args.indexOf("--baselines");
  try {
    if (!repo) throw new Error("usage: model-drift.mjs <product-repo> [--baselines <file>]");
    const bf = bi === -1 ? DEFAULT_BASELINES : args[bi + 1];
    const baselines = existsSync(bf) ? JSON.parse(readFileSync(bf, "utf8")) : {};
    const spawns = collectSpawns(repo);
    if (!spawns.length) { console.log("no usage.json with a logged model under runs/ (run execution/usage.mjs per slice first)"); process.exit(0); }
    const rows = drift(spawns, baselines);
    console.log(render(rows));
    process.exit(rows.some((r) => r.status === "stale") ? 1 : 0);
  } catch (e) { console.error(e.message); process.exit(2); }
}
