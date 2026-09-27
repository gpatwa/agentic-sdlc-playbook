#!/usr/bin/env node
// Budget guard — PreToolUse hook on the Agent tool. Dependency-free.
//
// Makes RUN_ECONOMICS.md's pre-spawn budget check MECHANICAL instead of a
// discipline the Orchestrator has to remember. Reads the active slice's Budget
// block from runs/<slice>/STATE.md and checks the rule as written:
// spent + estimate(next stage) <= budget. When a spawn would exceed the
// declared budget, it asks the human with the numbers rather than proceeding.
//
// The estimate comes from the Budget block's "Next stage: ... est. <n>k" line.
// With no readable estimate it checks spent alone — a backstop, not the rule.
//
// FAILS OPEN, DELIBERATELY. This is a cost control, not a safety gate: a parse
// bug must never block legitimate work. Release gates fail closed; convenience
// guards fail open. Every failure path here allows the spawn.
//
// stdin:  Claude Code hook payload (JSON)
// stdout: hook JSON, or nothing (= allow)
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const allow = (extra) => {
  if (extra) process.stdout.write(JSON.stringify(extra));
  process.exit(0);
};

try {
  // Anchor on the project root, not the session's cwd. A session that has cd'd
  // into a subdirectory — or runs from a worktree the harness roots elsewhere —
  // otherwise finds no runs/ and silently allows every spawn. Found by a
  // product-repo session, which had patched only its installed copy.
  const runsDir = join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), "runs");
  if (!existsSync(runsDir)) allow(); // not a slice-running repo

  // Accept "600k", "600,000", "0.6M".
  const num = (s) => {
    if (!s) return null;
    const m = String(s).replace(/,/g, "").match(/([\d.]+)\s*([kKmM])?/);
    if (!m) return null;
    const v = parseFloat(m[1]);
    if (!Number.isFinite(v)) return null;
    const mult = m[2] ? (m[2].toLowerCase() === "m" ? 1e6 : 1e3) : 1;
    return v * mult;
  };

  // Collect EVERY in-progress budgeted slice, then guard the most constrained.
  //
  // This used to take the first match in readdir order and stop, which meant
  // that with two concurrent slices the guard silently watched whichever sorted
  // first — so an over-budget slice could be missed entirely because an
  // unrelated under-budget one happened to be named earlier. Scanning all of
  // them and picking the highest spent/budget ratio makes the guard correct
  // under concurrency without needing a lock: the binding constraint is the
  // one worth surfacing, whichever slice it belongs to.
  let active = null;
  for (const d of readdirSync(runsDir)) {
    const p = join(runsDir, d, "STATE.md");
    if (!existsSync(p) || !statSync(join(runsDir, d)).isDirectory()) continue;
    const text = readFileSync(p, "utf8");
    if (!/^\s*-\s*\*\*Status:\*\*\s*in-progress/im.test(text)) continue;
    if (!/\*\*Budget:\*\*/.test(text)) continue;
    const b = num((text.match(/\*\*Budget:\*\*\s*([\d.,]+\s*[kKmM]?)/) || [])[1]);
    const s = num((text.match(/\*\*Spent:\*\*\s*([\d.,]+\s*[kKmM]?)/) || [])[1]);
    if (!b || s === null) continue; // unreadable numbers -> not guardable
    // The next stage's estimate. Before this, a stage that would overshoot
    // still spawned, because only spent >= budget asked. Found by a product
    // repo's Orchestrator comparing the hook against the rule it cites.
    const e = num((text.match(/\*\*Next stage:\*\*[^\n]*?\best\.?\s*([\d.,]+\s*[kKmM]?)/i) || [])[1]) || 0;
    const ratio = (s + e) / b;
    if (!active || ratio > active.ratio) active = { slice: d, budget: b, spent: s, est: e, ratio };
  }
  if (!active) allow(); // no active budgeted slice — nothing to guard

  const { budget, spent, est } = active;
  const k = (n) => Math.round(n / 1000) + "k";

  // Over the line once spent has reached the budget, or once the next stage
  // would take it past. Landing exactly on the budget is within the rule.
  if (spent >= budget || spent + est > budget) {
    const pct = spent / budget;
    const what = est && spent < budget
      ? `The next stage (est. ${k(est)}) would take slice "${active.slice}" to ${k(spent + est)} ` +
        `of a ${k(budget)} budget — ${k(spent)} spent so far.`
      : `Budget exceeded on slice "${active.slice}": ${k(spent)} spent of a ${k(budget)} budget ` +
        `(${Math.round(pct * 100)}%).`;
    allow({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason:
          `${what} RUN_ECONOMICS.md says degrade the stage's depth, drop a ` +
          `non-load-bearing stage, or stop — never raise the budget to fit the spend. Approve only ` +
          `if you intend to continue anyway.`,
      },
    });
  }

  if ((spent + est) / budget >= 0.8) {
    allow({
      systemMessage:
        est
          ? `Budget guard: slice "${active.slice}" will be at ${Math.round(((spent + est) / budget) * 100)}% ` +
            `after the next stage (${k(spent)} spent + ${k(est)} est. of ${k(budget)}). Consider a lower depth.`
          : `Budget guard: slice "${active.slice}" is at ${Math.round((spent / budget) * 100)}% ` +
            `(${k(spent)}/${k(budget)}). One more stage will likely exceed it — consider a lower depth.`,
    });
  }

  allow();
} catch {
  allow(); // fail open, always
}
