// Event log verifier — dependency-free Node ESM.
//
//   node <playbook>/execution/events-verify.mjs <events.jsonl> [more.jsonl ...] [--paths src/,test/] [--json]
//
// Recomputes the hash chain written by hooks/event-log.mjs and reports, per agent
// role, how many tool calls were made. Exit 0 = chain intact, 1 = broken, 2 = usage.
//
// What it can and cannot show, stated plainly:
//   - It detects an EDITED, DELETED or REORDERED line (the chain breaks). It cannot
//     detect lines never written (the hook fails open), nor a whole file replaced by
//     a fresh, internally consistent one; record the file's final hash in the end
//     review at the time it is written, as the protocol says.
//   - "Attempts with no outcome" are PreToolUse lines with no matching PostToolUse or
//     PostToolUseFailure: a call another hook or the permission system denied, or an
//     interrupted one. Not necessarily an attack, but worth a look.
//   - With --paths, a write (Write, Edit, MultiEdit, NotebookEdit) to a path outside
//     those prefixes, or outside the project, is reported.
//     In a worktree session the ".claude/worktrees/<name>/" part of a target is ignored when
//     matching, so the Charter's prefixes need not name the worktree; writes into two
//     different checkouts in one log are reported.
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

// In a git worktree (for example one the desktop app creates under .claude/worktrees/<name>/) the hook records a write's target
// relative to the project root, which is the MAIN checkout, so the target reads ".claude/worktrees/<name>/runs/x.md". The Charter's
// allowed prefixes are written without the worktree ("runs/x/"), so the prefix is stripped before matching. A session writes into
// one checkout only: writes into two different worktrees, or into a worktree and the main checkout, are reported.
const WORKTREE = /^\.claude\/worktrees\/([^/]+)\/(.*)$/;
const splitWorktree = (t) => { const m = t.match(WORKTREE); return m ? { wt: m[1], rel: m[2] } : { wt: null, rel: t }; };

export function verifyLog(text, { paths = null } = {}) {
  const alerts = [];
  const lines = text.split("\n").filter(Boolean);
  const events = [];
  let prevRaw = null;
  let broken = false;
  lines.forEach((raw, i) => {
    let e;
    try { e = JSON.parse(raw); } catch { alerts.push(`line ${i + 1}: not valid JSON (chain broken)`); broken = true; prevRaw = raw; return; }
    const expectPrev = prevRaw === null ? "genesis" : sha(prevRaw);
    if (e.prev !== expectPrev) { alerts.push(`line ${i + 1} (seq ${e.seq}): chain break: it does not follow the previous line`); broken = true; }
    if (e.seq !== i + 1) { alerts.push(`line ${i + 1}: sequence says ${e.seq}; a line was removed, added or moved`); broken = true; }
    events.push(e);
    prevRaw = raw;
  });

  const perAgent = {};
  const writeRoots = new Set();
  const open = new Map();
  let failures = 0;
  for (const e of events) {
    perAgent[e.agent] ??= { calls: 0, failed: 0 };
    if (e.ev === "pre") { perAgent[e.agent].calls++; if (e.id) open.set(e.id, e); }
    else if (e.ev === "post" && e.id) open.delete(e.id);
    else if (e.ev === "fail") { perAgent[e.agent].failed++; failures++; if (e.id) open.delete(e.id); }
    if (e.ev === "pre" && WRITE_TOOLS.has(e.tool)) {
      const t = e.target || "";
      const inside = t && !t.startsWith("(outside)");
      if (t.startsWith("(outside)")) alerts.push(`seq ${e.seq}: ${e.agent} wrote outside the project: ${t}`);
      else {
        if (inside) { const { wt } = splitWorktree(t); writeRoots.add(wt ?? "(main checkout)"); }
        const { rel } = splitWorktree(t);
        if (paths && inside && !paths.some((p) => rel.startsWith(p))) alerts.push(`seq ${e.seq}: ${e.agent} wrote ${t}, outside the allowed paths`);
      }
    }
  }
  if (writeRoots.size > 1) alerts.push(`writes went into more than one checkout: ${[...writeRoots].sort().join(", ")}`);
  const noOutcome = [...open.values()];
  for (const e of noOutcome) alerts.push(`seq ${e.seq}: ${e.agent} attempted ${e.tool} ${e.target || ""} with no outcome recorded (denied, blocked or interrupted)`.trim());

  return {
    ok: !broken, lines: lines.length, perAgent, failures,
    noOutcome: noOutcome.length, alerts,
    head: prevRaw ? sha(prevRaw) : null,
  };
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const args = process.argv.slice(2);
  const pi = args.indexOf("--paths");
  const paths = pi !== -1 && args[pi + 1] ? args[pi + 1].split(",").map((s) => s.trim()).filter(Boolean) : null;
  const json = args.includes("--json");
  const files = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1] === "--paths"));
  if (!files.length || !files.every(existsSync)) { console.error("usage: events-verify.mjs <events.jsonl> [...] [--paths src/,test/] [--json]"); process.exit(2); }
  let allOk = true;
  for (const f of files) {
    const r = verifyLog(readFileSync(f, "utf8"), { paths });
    allOk &&= r.ok;
    if (json) { console.log(JSON.stringify({ file: f, ...r })); continue; }
    console.log(`${f}: ${r.ok ? "chain intact" : "CHAIN BROKEN"}; ${r.lines} lines; head ${r.head ? r.head.slice(0, 16) : "none"}`);
    for (const [a, c] of Object.entries(r.perAgent).sort()) console.log(`  ${a}: ${c.calls} calls, ${c.failed} failed`);
    for (const a of r.alerts) console.log(`  ! ${a}`);
  }
  process.exit(allOk ? 0 : 1);
}
