// Conformity export — dependency-free Node ESM. Sibling to analyze.mjs.
//
//   node <playbook>/execution/conformity.mjs [productRepoRoot] [--strict]
//
// analyze.mjs answers "what did this cost". This answers a different question,
// asked by a different person: "show me who authorized these changes."
//
// Reads runs/<slice>/trace.json, falling back to runs/<slice>/STATE.md for
// approvals on runs that predate the `approvals` field, and writes:
//   - CONFORMITY.md  (the register an auditor is handed)
//
// It is deliberately pessimistic. Missing evidence is printed as missing, never
// omitted, because an export that quietly drops the runs it cannot evidence is
// worse than no export: it reads as complete. --strict exits non-zero when a
// landed run has no approval evidence at all, so CI can gate on it.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const STRICT = argv.includes("--strict");
const root = argv.find((a) => !a.startsWith("--")) || process.cwd();
const runsDir = join(root, "runs");
if (!existsSync(runsDir)) { console.error(`no runs/ dir at ${root}`); process.exit(1); }

// Markdown cells break on a raw pipe. Escape rather than strip — a truncated
// approval reason in an audit document is a defect, not a formatting choice.
const cell = (v) =>
  v === undefined || v === null || v === "" ? "—" : String(v).replace(/\|/g, "\\|").replace(/\n+/g, " ");

// ── approvals from STATE.md, for runs written before `approvals` existed ─────
//
// STATE.md's Approvals table is authored by the run, so parsing it is reading a
// source, not re-deriving a view. Rows recording that NO rule was tripped are
// real evidence too ("nothing here needed approval") and are kept, flagged, so
// they cannot be confused with an approval that went unrecorded.
const approvalsFromStateMd = (dir) => {
  const p = join(dir, "STATE.md");
  if (!existsSync(p)) return [];
  const text = readFileSync(p, "utf8");
  const start = text.search(/^##\s+Approvals\s*$/m);
  if (start === -1) return [];
  // Drop the heading line first. Splitting a string that BEGINS with the
  // delimiter yields an empty first element, which silently reads as
  // "no approvals" — the one wrong answer this export must never give.
  const rest = text.slice(start).replace(/^##[^\n]*\n/, "").split(/^##\s+/m)[0];
  const rows = rest.split("\n").filter((l) => l.trim().startsWith("|"));
  const out = [];
  for (const row of rows.slice(2)) { // drop header + separator
    const c = row.split("|").slice(1, -1).map((s) => s.trim());
    if (c.length < 6) continue;
    const [action, rule, requestedAt, decision, approver, decidedAt, record] = c;
    if (/^<.*>$/.test(action)) continue; // an uninstantiated template row
    out.push({
      action, rule, requestedAt, decision, approver, decidedAt, record,
      none: /^\(none/i.test(action.replace(/[*_`]/g, "")) || /^(n\/a|—|-)$/.test(decision.replace(/[*_`]/g, "").trim().toLowerCase()),
      source: "STATE.md",
    });
  }
  return out;
};

// ── load ────────────────────────────────────────────────────────────────────
const dirs = readdirSync(runsDir).filter((d) => statSync(join(runsDir, d)).isDirectory());
const runs = [];
for (const d of dirs) {
  const dir = join(runsDir, d);
  const tf = join(dir, "trace.json");
  if (!existsSync(tf)) { runs.push({ slice: d, untraced: true }); continue; }
  const t = JSON.parse(readFileSync(tf, "utf8"));
  const n = t.notes || {};
  const structured = Array.isArray(t.approvals) ? t.approvals.map((a) => ({ ...a, source: "trace.json" })) : null;
  runs.push({
    ...t,
    slice: t.slice || d,
    approvalList: structured || approvalsFromStateMd(dir),
    approvalsStructured: !!structured,
    leastPrivilege: t.leastPrivilegeEnforced ?? n.leastPrivilegeEnforced ?? null,
    telemetry: t.telemetrySource || null,
    catches: t.gateCatches || n.gatesThatFired || [],
    release: n.release || {},
  });
}
if (runs.length === 0) { console.error("no runs/ subdirectories — nothing to export"); process.exit(1); }

const traced = runs.filter((r) => !r.untraced);
const landed = traced.filter((r) => r.landed);

// A decision is not the same thing as an approval. "deferred" and "denied" are
// real, useful records — they show scope was bounded deliberately — but they
// grant nothing and have no approver to name. Counting them as approvals
// inflates coverage, and then flagging them for a missing approver invents a
// finding that isn't there. Both errors, from one conflation.
// STATE.md is authored by hand, so a decision arrives as `approved`,
// `**APPROVED**`, or `_Approved_` depending on who wrote the row. Matching the
// raw string silently under-reports real approvals — and under-reporting an
// approval is indistinguishable, in this document, from never having got one.
const norm = (v) => String(v ?? "").replace(/[*_`]/g, "").trim().toLowerCase();

const decisions = (r) => r.approvalList.filter((a) => !a.none && !/pending/.test(norm(a.decision)));
const granted = (r) => decisions(r).filter((a) => /^approved/.test(norm(a.decision)));

const allDecisions = traced.flatMap((r) => decisions(r).map((a) => ({ ...a, slice: r.slice })));
const allApprovals = traced.flatMap((r) => granted(r).map((a) => ({ ...a, slice: r.slice })));

// CC8.1 is evidenced for a run when it either carries a named approval, or
// explicitly records that no rule was tripped. Silence is the only failure.
// CC8.1 asks *who*, and a collective does not answer it. Flag only values that
// are unambiguously generic: over-flagging would invent a finding against a
// real person's name, which is the same class of error as missing a real gap.
const GENERIC = /^(the |a |an )?((security|engineering|eng|ops|platform|release|qa|dev|product)\s+)?(team|role|operator|reviewer|approver|owner|maintainer|group|committee|board)s?$/;
const named = (a) => {
  const v = norm(a.approver);
  return !!v && v !== "—" && v !== "-" && !GENERIC.test(v);
};
const cc81 = (r) => granted(r).some(named) || r.approvalList.some((a) => a.none);
const landedWithoutApproval = landed.filter((r) => !cc81(r));
const unnamed = allApprovals.filter((a) => !named(a));

// A control is only ever as covered as the weakest run. Counting the good ones
// and calling it coverage is the exact failure this document exists to avoid.
const cover = (ok, total, note) =>
  total === 0 ? `**No data** — ${note}` :
  ok === total ? `**Covered** — ${ok}/${total}` :
  ok === 0 ? `**Not covered** — 0/${total}` : `**Partial** — ${ok}/${total}`;

const lpEnforced = traced.filter((r) => r.leastPrivilege === true).length;
const lpRecorded = traced.filter((r) => r.leastPrivilege !== null).length;
const withOperator = traced.filter((r) => r.operator).length;
const otel = traced.filter((r) => r.telemetry === "otel").length;

const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");
const L = [];

L.push(`# Conformity Export`);
L.push(``);
L.push(`Generated ${ts} by \`conformity.mjs\` from \`runs/*/trace.json\`. Covers **${traced.length} traced run(s)**${runs.length - traced.length ? `, plus ${runs.length - traced.length} untraced` : ""}.`);
L.push(``);
L.push(`**What this is.** A register of changes made by autonomous agents in this repository, and the human authorization behind each one. It maps to the SOC 2 criteria an auditor applies to agent-written code.`);
L.push(``);
L.push(`**What this is not.** Nothing here is cryptographically signed. Every record below is plain JSON and markdown in this repository, and anyone with write access could have edited it after the fact. Where a record points at an independently verifiable event — a GitHub pull request, a merge commit — that reference is the stronger evidence and is shown. Treat the rest as this organization's own assertion.`);
L.push(``);

// ── control coverage ────────────────────────────────────────────────────────
L.push(`## Control coverage`);
L.push(``);
L.push(`| Control | What is asked | Status | Evidence |`);
L.push(`|---|---|---|---|`);
L.push(`| **CC8.1** Change management | A named human approved a change they did not author | ${cover(traced.filter(cc81).length, traced.length, "no traced runs")} | ${allApprovals.length} named approval(s) across ${traced.filter((r) => granted(r).length).length} run(s) |`);
L.push(`| **CC6.1** Logical access | Agent tool access is scoped, and the scope is auditable | ${cover(lpEnforced, traced.length, "no traced runs")} | ${lpEnforced} enforced, ${lpRecorded - lpEnforced} declared, ${traced.length - lpRecorded} unrecorded |`);
L.push(`| Evidence sampling | Which changes were agent-assisted | ${cover(traced.length, runs.length, "no runs")} | ${traced.reduce((a, r) => a + (r.stages || []).length, 0)} stages across ${traced.length} run(s) |`);
L.push(`| Review records | Reviewer identity per change | ${cover(withOperator, traced.length, "no traced runs")} | ${withOperator}/${traced.length} run(s) name an operator |`);
L.push(`| **CC3.2** Data classification | Prove confidential data did not reach a third-party model | **Not instrumented** | — |`);
L.push(``);
L.push(`CC3.2 is a real gap, stated rather than omitted. Prompt payloads are not recorded, so this system cannot evidence what was sent to which model. Enabling OpenTelemetry (\`TELEMETRY.md\`) records the *model* per request, which is a component of that evidence but not the whole of it.`);
if (otel < traced.length) {
  L.push(``);
  L.push(`> **Telemetry provenance.** ${otel}/${traced.length} run(s) record \`telemetrySource: otel\`. For the remainder, token and tool-call figures are the agent's own report of its work. They are operational numbers, not control evidence, and nothing in the table above rests on them.`);
}
L.push(``);

// ── change register ─────────────────────────────────────────────────────────
L.push(`## Change register`);
L.push(``);
L.push(`| Slice | Tier | Landed | Operator | Approvals | Tool scope | Independent reference |`);
L.push(`|---|---|---|---|---|---|---|`);
for (const r of runs) {
  if (r.untraced) { L.push(`| ${cell(r.slice)} | — | — | — | **untraced** | — | — |`); continue; }
  const n = granted(r).length;
  const ap = n ? `${n}${r.approvalsStructured ? "" : " (markdown)"}` : r.approvalList.length ? "none required" : "**none recorded**";
  const lp = r.leastPrivilege === true ? "enforced" : r.leastPrivilege === false ? "declared" : "**unrecorded**";
  const ref = r.release.prUrl ? `[PR](${r.release.prUrl})${r.release.mergeCommit ? ` \`${String(r.release.mergeCommit).slice(0, 7)}\`` : ""}` : "—";
  L.push(`| ${cell(r.slice)} | ${cell(r.tier)} | ${r.landed ? "yes" : "no"} | ${cell(r.operator)} | ${ap} | ${lp} | ${ref} |`);
}
L.push(``);

// ── approvals ───────────────────────────────────────────────────────────────
L.push(`## Approvals`);
L.push(``);
if (allDecisions.length === 0) {
  L.push(`No approval decisions are recorded in any run. Either no gated action occurred, or approvals were not captured — this export cannot distinguish the two, which is itself a finding.`);
} else {
  L.push(`| Slice | Action | Rule | Decision | Approver | Decided (UTC) | Record | Source |`);
  L.push(`|---|---|---|---|---|---|---|---|`);
  for (const a of allDecisions) {
    L.push(`| ${cell(a.slice)} | ${cell(a.action)} | ${cell(a.rule)} | ${cell(a.decision)} | **${cell(a.approver)}** | ${cell(a.decidedAt)} | ${cell(a.record)} | ${cell(a.source)} |`);
  }
  L.push(``);
  L.push(`Rows whose decision is not \`approved\` (deferred, denied) are recorded decisions, not grants — they show where scope was deliberately bounded, and have no approver to name. Only the ${allApprovals.length} approved row(s) count toward CC8.1.`);
  L.push(``);
  L.push(`Approvals marked \`STATE.md\` were read from the run's markdown because that run predates the \`approvals\` field in \`trace@2\`. They are authored records, not reconstructions, but they are unstructured and cannot be machine-verified for completeness.`);
}
if (unnamed.length) {
  L.push(``);
  L.push(`> **${unnamed.length} approval(s) do not name an individual.** \`HUMAN_APPROVAL_RULES.md\` requires an identity, not a role — CC8.1 asks who, and a role does not answer it. Affected: ${unnamed.map((a) => `\`${a.slice}\``).join(", ")}.`);
}
L.push(``);

// ── gate catches ────────────────────────────────────────────────────────────
const catches = traced.flatMap((r) => r.catches.map((c) => ({ ...c, slice: r.slice })));
L.push(`## Defects caught before release`);
L.push(``);
if (catches.length === 0) {
  L.push(`No gate catches recorded. On runs emitting \`gateCatches\`, an empty list means a clean slice; on older runs it may mean the field did not exist, so this is a floor rather than a count.`);
} else {
  L.push(`| Slice | Gate | Verdict | Severity | Detected | Resolved | Finding |`);
  L.push(`|---|---|---|---|---|---|---|`);
  for (const c of catches) {
    L.push(`| ${cell(c.slice)} | ${cell(c.gate)} | ${cell(c.verdict)} | ${cell(c.severity)} | ${cell(c.detectedAt)} | ${cell(c.resolvedAt)} | ${cell(c.finding)} |`);
  }
  L.push(``);
  L.push(`Each row is a defect a gate refused to pass. This is the separation-of-duties claim producing an observable result: the stage that found these was not the stage that wrote the code.`);
}
L.push(``);

// ── gaps ────────────────────────────────────────────────────────────────────
L.push(`## Known gaps in this export`);
L.push(``);
const gaps = [];
gaps.push(`Nothing is signed. Integrity of these records rests on repository access control, not cryptography.`);
gaps.push(`CC3.2 (prompt-payload classification) is not instrumented at all.`);
if (landedWithoutApproval.length) gaps.push(`${landedWithoutApproval.length} landed run(s) carry no approval evidence of any kind: ${landedWithoutApproval.map((r) => `\`${r.slice}\``).join(", ")}.`);
if (runs.length - traced.length) gaps.push(`${runs.length - traced.length} run(s) have no \`trace.json\` and appear only as a name.`);
if (traced.length - lpRecorded) gaps.push(`${traced.length - lpRecorded} run(s) do not record whether tool scoping was enforced, so CC6.1 cannot be evidenced for them either way.`);
if (traced.length - withOperator) gaps.push(`${traced.length - withOperator} run(s) do not name an operator.`);
for (const g of gaps) L.push(`- ${g}`);
L.push(``);

writeFileSync(join(runsDir, "CONFORMITY.md"), L.join("\n"));

console.log(
  `conformity: ${traced.length} traced run(s), ${allApprovals.length} approval(s), ` +
  `${lpEnforced} enforced / ${lpRecorded - lpEnforced} declared tool scope, ` +
  `${gaps.length} gap(s) → runs/CONFORMITY.md`
);

if (STRICT && landedWithoutApproval.length) {
  console.error(`conformity --strict: ${landedWithoutApproval.length} landed run(s) with no approval evidence`);
  process.exit(1);
}
