// Standing Charter checks (Process v3) — dependency-free Node ESM.
//
//   node <playbook>/execution/standing-charter.mjs check <STANDING_CHARTER.md> [--today YYYY-MM-DD]
//   node <playbook>/execution/standing-charter.mjs fits  <STANDING_CHARTER.md> <00-slice-plan.md> [--runs-used N] [--today YYYY-MM-DD]
//
// A standing Charter (templates/STANDING_CHARTER_TEMPLATE.md) approves a class of
// routine run once. `check` fails closed on anything that would make that class
// open-ended: a missing field, a placeholder, tier 3, an end action other than a
// pull request, a model without an effort level, a path prefix that reaches a safety
// control, a missing or too-distant expiry, or an edited "Never covered" list.
// `fits` proves one run's plan stays inside the class; anything it cannot prove is
// a "does not fit", and the run waits for a normal Charter.
//
// Exit 0 = ok / fits, 1 = not, 2 = usage.
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const MAX_DAYS = 90;
// Paths a routine run may never change: safety controls, permissions, CI.
const FORBIDDEN_PREFIXES = [".agentic/SAFETY_INVARIANTS.md", ".claude/", ".github/", "hooks/", ".agentic/", "SAFETY", "CLAUDE.md", "AGENTS.md"];
const NEVER_COVERED = [
  /sends or submits anything on a user's behalf/i,
  /deletes or overwrites shared state/i,
  /deploys or releases anything with an external effect/i,
  /changes a safety control/i,
  /model into a path that was deterministic/i,
  /adds a data processor/i,
];
// Words in a plan that mean the run needs a rule 1 to 6 approval: never routine.
const NOT_ROUTINE = [
  [/\bdeploy(s|ed|ing|ment)?\b/i, "a deploy (rule 3)"],
  [/\b(send|post|publish|submit)s?\b/i, "sending, posting or publishing (rule 1)"],
  [/\b(force-push|drop table|delete (the )?(branch|table|bucket|database))\b/i, "a destructive operation (rule 2)"],
  [/\bINV-\d+\b/, "a safety invariant (rule 4)"],
  [/\b(data processor|new processor|DPA)\b/i, "a data processor (rule 6)"],
  [/\b(runtime model|model call at runtime|LLM in the (product )?path)\b/i, "a model in the product path (rule 5)"],
];

function sections(text) {
  const map = new Map();
  const heads = [...text.matchAll(/^##\s+(\d+)\.\s+([^\n]+)$/gm)];
  heads.forEach((m, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    map.set(Number(m[1]), text.slice(m.index + m[0].length, end));
  });
  return map;
}
const field = (text, id) => {
  const m = text.match(new RegExp(`\\*\\*${id.replace(".", "\\.")}[^*]*\\*\\*\\s*:?\\s*([^\\n]*)`));
  return m ? m[1].trim() : null;
};
const kNum = (s) => {
  const m = (s || "").match(/([\d.,]+)\s*([kKmM])?/);
  if (!m) return null;
  const v = Number(m[1].replace(/,/g, ""));
  return m[2] && /m/i.test(m[2]) ? v * 1000 : v;
};
const day = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") ? new Date(`${s}T00:00:00Z`) : null);

export function parseStanding(text) {
  const s = sections(text);
  const tiers = (field(text, "S1.3") || "").match(/\d/g)?.map(Number) || [];
  const models = [...(s.get(3) || "").matchAll(/\*\*S3\.\d+\*\*[^`\n]*`([^`]+)`[^\n]*/g)].map((m) => ({ id: m[1], line: m[0] }));
  const paths = [...(s.get(4) || "").matchAll(/\*\*S4\.\d+\*\*\s*`([^`]+)`/g)].map((m) => m[1]);
  return {
    repo: (field(text, "S1.1") || "").replace(/`/g, "").trim(),
    tiers, models, paths,
    perRunCap: kNum(field(text, "S2.1")), perWeekCap: kNum(field(text, "S2.2")),
    endAction: (field(text, "S5.1") || "").toLowerCase(),
    autoMerge: (field(text, "S5.2") || "").toLowerCase().replace(/\s*\(.*$/, "").trim(),
    approved: day(field(text, "S6.1")), expires: day(field(text, "S6.2")),
    maxRuns: kNum(field(text, "S6.3")),
    never: s.get(7) || "",
  };
}

export function checkStanding(text, today = new Date()) {
  const errors = [];
  const s = sections(text);
  for (const n of [1, 2, 3, 4, 5, 6, 7]) if (!s.has(n)) errors.push(`section ${n} is missing`);
  const body = text.replace(/^>.*$/gm, "");
  const ph = body.match(/<[^>\n]{1,80}>/g);
  if (ph) errors.push(`placeholder(s) left: ${[...new Set(ph)].slice(0, 5).join(", ")}`);
  for (const id of ["S1.1", "S1.2", "S1.3", "S2.1", "S2.2", "S5.1", "S5.2", "S5.3", "S6.1", "S6.2", "S6.3"]) {
    const v = field(text, id);
    if (v === null || v === "") errors.push(`${id} has no value`);
  }
  const p = parseStanding(text);
  if (!p.tiers.length) errors.push("S1.3 names no release tier");
  if (p.tiers.some((t) => t >= 3)) errors.push("S1.3 includes tier 3: a tier 3 release is never routine");
  if (!(p.perRunCap > 0) || !(p.perWeekCap > 0)) errors.push("S2.1 and S2.2 must each be a number (k or M)");
  else if (p.perRunCap > p.perWeekCap) errors.push("S2.1 per-run cap is above S2.2 per-week cap");
  if (!p.models.length) errors.push("section 3 names no model");
  for (const m of p.models) if (!/\beffort\s+(low|medium|high|xhigh|max)\b/i.test(m.line)) errors.push(`model ${m.id} has no effort level`);
  if (!p.paths.length) errors.push("section 4 names no path prefix");
  for (const path of p.paths) {
    if (/\*/.test(path) || path === "/" || path === "." || path === "./") errors.push(`S4 path is open-ended: ${path}`);
    if (FORBIDDEN_PREFIXES.some((f) => path.startsWith(f) || f.startsWith(path))) errors.push(`S4 path reaches a safety control, permissions or CI: ${path}`);
  }
  if (p.endAction !== "pull request") errors.push(`S5.1 must be exactly "pull request", found "${p.endAction}"`);
  const s53 = field(text, "S5.3") || "";
  if (!/settings\.local\.json/.test(s53)) errors.push("S5.3 must write its allow rules to .claude/settings.local.json (gitignored)");
  for (const m of s53.matchAll(/`(\w+)\(([^`]*)\)`/g)) {
    const stem = m[2].trim().replace(/(\s\*|:\*)$/, "");
    if (stem.includes("*") || !stem.trim()) errors.push(`S5.3 permission rule allows any command: ${m[0]}`);
  }
  if (!["tier 1", "off"].includes(p.autoMerge)) errors.push(`S5.2 must be "tier 1" or "off", found "${p.autoMerge}"`);
  if (p.autoMerge === "tier 1" && !p.tiers.includes(1)) errors.push("S5.2 auto-merges tier 1 but S1.3 does not include tier 1");
  if (!p.approved || !p.expires) errors.push("S6.1 and S6.2 must be dates (YYYY-MM-DD)");
  else {
    const days = (p.expires - p.approved) / 86400000;
    if (days <= 0) errors.push("S6.2 expiry is not after S6.1");
    if (days > MAX_DAYS) errors.push(`S6.2 expiry is ${days} days after approval; at most ${MAX_DAYS}`);
  }
  if (!(p.maxRuns >= 1)) errors.push("S6.3 must be a number of runs, at least 1");
  NEVER_COVERED.forEach((re, i) => { if (!re.test(p.never)) errors.push(`section 7 item ${i + 1} is missing or changed`); });
  if (p.expires && today > p.expires) errors.push(`expired on ${field(text, "S6.2")}`);
  return { ok: errors.length === 0, errors, sha256: createHash("sha256").update(text).digest("hex") };
}

// A plan says what it will NOT do too ("never deploy", "no posting"). A routine word
// counts as negated only when a negation comes before it in the same clause; a
// section headed Non-goals / Out of scope is skipped. Anything else is a grant.
function grantHits(planText, re) {
  const hits = [];
  let skip = false;
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  for (const line of planText.split("\n")) {
    if (/^#{1,6}\s/.test(line)) { skip = /non-goal|out of scope|not in scope/i.test(line); continue; }
    if (skip) continue;
    for (const m of line.matchAll(g)) {
      const before = line.slice(0, m.index).split(/[.;:!?]/).pop();
      const after = line.slice(m.index + m[0].length).split(/[.;:!?]/)[0];
      const negated = /\b(never|not|no|without|don't|do not|won't)\b/i.test(before) || /\b(unchanged|untouched|stays as is)\b/i.test(after);
      if (!negated) hits.push(m[0]);
    }
  }
  return hits;
}

// The files a plan will change: its "Files changed" section when it has one,
// otherwise every path it names (fail closed: a read-only mention can make a plan
// not fit, never the reverse).
function changedPaths(planText) {
  const sec = planText.match(/^#{1,6}\s+files (changed|to change)[^\n]*\n([\s\S]*?)(?=^#{1,6}\s|$(?![\s\S]))/im);
  const src = sec ? sec[2] : planText;
  return new Set([...src.matchAll(/`([\w.\-/]+\/[\w.\-/]*|[\w.-]+\.(?:md|mjs|js|ts|tsx|py|json|toml|yml|yaml))`/g)].map((m) => m[1]));
}

export function checkFits(standingText, planText, { runsUsed = 0, today = new Date() } = {}) {
  const reasons = [];
  const c = checkStanding(standingText, today);
  if (!c.ok) reasons.push(...c.errors.map((e) => `standing Charter: ${e}`));
  const p = parseStanding(standingText);
  if (p.maxRuns >= 1 && runsUsed >= p.maxRuns) reasons.push(`run cap reached: ${runsUsed} of ${p.maxRuns}`);
  const tier = planText.match(/\btier\s*[:=]?\s*(\d)\b/i);
  if (!tier) reasons.push("the plan does not state its release tier");
  else if (!p.tiers.includes(Number(tier[1]))) reasons.push(`the plan is tier ${tier[1]}; the class allows ${p.tiers.join(", ")}`);
  for (const id of new Set(planText.match(/\bclaude-[a-z]+-\d+(?:-\d+)*\b/g) || [])) {
    if (!p.models.some((m) => m.id === id)) reasons.push(`the plan names model ${id}; the class does not`);
  }
  for (const [re, what] of NOT_ROUTINE) if (grantHits(planText, re).length) reasons.push(`the plan mentions ${what}: never routine`);
  for (const path of changedPaths(planText)) {
    if (path.startsWith("runs/") || path.startsWith("intents/")) continue; // the run's own record
    if (!p.paths.some((pre) => path.startsWith(pre))) reasons.push(`the plan names ${path}, outside the class's paths`);
  }
  const est = planText.match(/\bplan total\b[^\n\d]*([\d.,]+\s*[kKmM]?)/i);
  if (!est) reasons.push("the plan does not state its plan total");
  else if (kNum(est[1]) > p.perRunCap) reasons.push(`the plan total ${est[1].trim()} is above the per-run cap ${p.perRunCap}k`);
  return { fits: reasons.length === 0, reasons };
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i !== -1 ? rest[i + 1] : null; };
  const files = rest.filter((a, i) => !a.startsWith("--") && !(i > 0 && rest[i - 1].startsWith("--")));
  const today = opt("--today") ? new Date(`${opt("--today")}T00:00:00Z`) : new Date();
  const usage = () => { console.error("usage: standing-charter.mjs check <STANDING_CHARTER.md> | fits <STANDING_CHARTER.md> <plan.md> [--runs-used N] [--today YYYY-MM-DD]"); process.exit(2); };
  if (!files.every(existsSync)) usage();
  if (cmd === "check" && files.length === 1) {
    const r = checkStanding(readFileSync(files[0], "utf8"), today);
    if (r.ok) { console.log(`standing Charter complete: ${files[0]}\nsha256 ${r.sha256}`); process.exit(0); }
    console.log(`standing Charter NOT complete: ${files[0]}`); for (const e of r.errors) console.log(`  - ${e}`); process.exit(1);
  }
  if (cmd === "fits" && files.length === 2) {
    const r = checkFits(readFileSync(files[0], "utf8"), readFileSync(files[1], "utf8"), { runsUsed: Number(opt("--runs-used") || 0), today });
    if (r.fits) { console.log("fits: the plan is inside the standing Charter's class"); process.exit(0); }
    console.log("does NOT fit; the run waits for a normal Charter:"); for (const e of r.reasons) console.log(`  - ${e}`); process.exit(1);
  }
  usage();
}
