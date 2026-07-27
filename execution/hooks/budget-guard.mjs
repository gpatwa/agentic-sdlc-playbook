#!/usr/bin/env node
// Budget guard — PreToolUse hook on the Agent tool. Dependency-free.
//
// Makes RUN_ECONOMICS.md's pre-spawn budget check MECHANICAL instead of a
// discipline the Orchestrator has to remember. Reads the active slice's Budget
// block from runs/<slice>/STATE.md and, when a spawn would exceed the declared
// budget, asks the human with the numbers rather than proceeding silently.
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
  const runsDir = join(process.cwd(), "runs");
  if (!existsSync(runsDir)) allow(); // not a slice-running repo

  // Find the active slice: an in-progress STATE.md carrying a Budget block.
  let active = null;
  for (const d of readdirSync(runsDir)) {
    const p = join(runsDir, d, "STATE.md");
    if (!existsSync(p) || !statSync(join(runsDir, d)).isDirectory()) continue;
    const text = readFileSync(p, "utf8");
    if (!/^\s*-\s*\*\*Status:\*\*\s*in-progress/im.test(text)) continue;
    if (!/\*\*Budget:\*\*/.test(text)) continue;
    active = { slice: d, text };
    break;
  }
  if (!active) allow(); // no active budgeted slice — nothing to guard

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

  const budget = num((active.text.match(/\*\*Budget:\*\*\s*([\d.,]+\s*[kKmM]?)/) || [])[1]);
  const spent = num((active.text.match(/\*\*Spent:\*\*\s*([\d.,]+\s*[kKmM]?)/) || [])[1]);
  if (!budget || spent === null) allow(); // can't read it -> don't block

  const pct = spent / budget;
  const k = (n) => Math.round(n / 1000) + "k";

  if (pct >= 1) {
    allow({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason:
          `Budget exceeded on slice "${active.slice}": ${k(spent)} spent of a ${k(budget)} budget ` +
          `(${Math.round(pct * 100)}%). RUN_ECONOMICS.md says degrade the stage's depth, drop a ` +
          `non-load-bearing stage, or stop — never raise the budget to fit the spend. Approve only ` +
          `if you intend to continue anyway.`,
      },
    });
  }

  if (pct >= 0.8) {
    allow({
      systemMessage:
        `Budget guard: slice "${active.slice}" is at ${Math.round(pct * 100)}% ` +
        `(${k(spent)}/${k(budget)}). One more stage will likely exceed it — consider a lower depth.`,
    });
  }

  allow();
} catch {
  allow(); // fail open, always
}
