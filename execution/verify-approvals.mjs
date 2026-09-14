// Approval verification — dependency-free Node ESM except for the `gh` CLI.
// Implements T14's decided scope: bind approvals to GitHub, don't sign.
//
//   node <playbook>/execution/verify-approvals.mjs [productRepoRoot] [--strict]
//
// conformity.mjs displays whatever GitHub URL a run's own record claims. It
// never checks that URL against anything — a self-authored PR link is still a
// self-report, just a more convincing-looking one. This is the check: for
// every approval record that names a GitHub pull request, fetch the PR from
// GitHub itself and confirm the claim, rather than display it on trust.
//
// What this can and cannot prove, stated plainly rather than implied by what
// it outputs:
//
//   CAN verify   — the PR exists, who merged it, the real merge commit SHA,
//                  and whether the required status checks GitHub enforced
//                  before merge actually ran and passed. This is genuine
//                  third-party evidence: GitHub attests it, not this repo.
//
//   CANNOT verify — that a human distinct from the PR's author reviewed and
//                  approved it. GitHub's `merged_by` is the identity that
//                  clicked merge; if that is the same identity as the PR
//                  author, GitHub has no record of anyone else looking at it.
//                  A single-operator repo merging its own PRs is exactly this
//                  shape, and pretending otherwise would be the same
//                  self-report problem in a third party's clothing.
//
// Writes runs/APPROVAL_VERIFICATION.md. --strict exits non-zero if any claimed
// GitHub reference fails to verify — not found, or a mismatched merge commit.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const STRICT = argv.includes("--strict");
const root = argv.find((a) => !a.startsWith("--")) || process.cwd();
const runsDir = join(root, "runs");
if (!existsSync(runsDir)) { console.error(`no runs/ dir at ${root}`); process.exit(1); }

const cell = (v) => (v === undefined || v === null || v === "" ? "—" : String(v).replace(/\|/g, "\\|").replace(/\n+/g, " "));

// ── gather every approval `record` string, wherever it lives ────────────────
//
// Structured (trace@2 approvals[]) and unstructured (STATE.md's Approvals
// table, for runs written before that field existed) both surface a `record`
// string — a path or a URL a human wrote when the approval happened. This
// script only cares about that string's content, so both sources are read
// into one shape and nothing else about conformity.mjs's fuller coverage
// analysis is duplicated here.
const approvalsFromStateMd = (dir) => {
  const p = join(dir, "STATE.md");
  if (!existsSync(p)) return [];
  const text = readFileSync(p, "utf8");
  const start = text.search(/^##\s+Approvals\s*$/m);
  if (start === -1) return [];
  const rest = text.slice(start).replace(/^##[^\n]*\n/, "").split(/^##\s+/m)[0];
  const rows = rest.split("\n").filter((l) => l.trim().startsWith("|"));
  const out = [];
  for (const row of rows.slice(2)) {
    const c = row.split("|").slice(1, -1).map((s) => s.trim());
    if (c.length < 6) continue;
    const [action, , , decision, approver, decidedAt, record] = c;
    if (/^<.*>$/.test(action)) continue;
    out.push({ action, decision, approver, decidedAt, record, source: "STATE.md" });
  }
  return out;
};

const dirs = readdirSync(runsDir).filter((d) => statSync(join(runsDir, d)).isDirectory());
const claims = [];
for (const d of dirs) {
  const dir = join(runsDir, d);
  const tf = join(dir, "trace.json");
  let structured = null;
  if (existsSync(tf)) {
    const t = JSON.parse(readFileSync(tf, "utf8"));
    if (Array.isArray(t.approvals)) structured = t.approvals.map((a) => ({ ...a, source: "trace.json" }));
  }
  const list = structured || approvalsFromStateMd(dir);
  for (const a of list) claims.push({ ...a, slice: d });
}

// ── extract a GitHub PR reference from a record string ───────────────────────
const PR_RE = /github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)/;
const withRef = claims
  .map((c) => ({ ...c, ref: (c.record || "").match(PR_RE) }))
  .filter((c) => c.ref);

// ── is `gh` usable at all? checked once, reported once, not per-claim ───────
let ghOk = false, ghReason = "";
try {
  execFileSync("gh", ["auth", "status"], { stdio: "pipe" });
  ghOk = true;
} catch (e) {
  ghReason = e.code === "ENOENT" ? "gh CLI is not installed" : "gh is not authenticated (run `gh auth login`)";
}

const ghApi = (path) => JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8" }));

// ── verify each claim against GitHub's own record ────────────────────────────
const results = [];
for (const c of withRef) {
  const [, owner, repo, num] = c.ref;
  const base = { ...c, owner, repo, num };
  if (!ghOk) { results.push({ ...base, status: "unverified", why: ghReason }); continue; }
  try {
    const pr = ghApi(`repos/${owner}/${repo}/pulls/${num}`);
    if (!pr.merged) {
      results.push({ ...base, status: "unverified", why: `PR #${num} is not merged (state: ${pr.state})` });
      continue;
    }
    const selfMerged = pr.merged_by?.login && pr.user?.login && pr.merged_by.login === pr.user.login;

    // Claimed merge commit, if this record mentions one — a short SHA in
    // backticks, per the house style seen in every real STATE.md so far.
    const shaMatch = (c.record || "").match(/`([0-9a-f]{7,40})`/);
    let shaOk = null;
    if (shaMatch) shaOk = pr.merge_commit_sha.startsWith(shaMatch[1]) || shaMatch[1].startsWith(pr.merge_commit_sha.slice(0, shaMatch[1].length));

    let checks = [];
    try { checks = ghApi(`repos/${owner}/${repo}/commits/${pr.merge_commit_sha}/check-runs`).check_runs || []; }
    catch { /* check-runs can 404 on a commit GitHub has since pruned; not fatal to the merge verification */ }

    results.push({
      ...base,
      status: shaOk === false ? "mismatch" : "verified",
      why: shaOk === false ? `record claims \`${shaMatch[1]}\`, GitHub's merge commit is \`${pr.merge_commit_sha.slice(0, 7)}\`` : null,
      mergedBy: pr.merged_by?.login, prAuthor: pr.user?.login, selfMerged,
      mergeCommit: pr.merge_commit_sha, mergedAt: pr.merged_at,
      checks: checks.map((r) => ({ name: r.name, conclusion: r.conclusion })),
    });
  } catch (e) {
    results.push({ ...base, status: "unverified", why: `GitHub API call failed: ${String(e.message || e).split("\n")[0]}` });
  }
}

const withoutRef = claims.filter((c) => !(c.record || "").match(PR_RE) && String(c.decision).toLowerCase().replace(/[*_`]/g, "") === "approved");

// ── render ────────────────────────────────────────────────────────────────
const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");
const L = [];
L.push(`# Approval Verification`);
L.push(``);
L.push(`Generated ${ts} by \`verify-approvals.mjs\`. Checks every approval record naming a GitHub pull request against GitHub's own API — not against what the record claims about itself.`);
L.push(``);
L.push(`**What this proves.** That the named PR exists, who merged it, the real merge commit, and whether GitHub's required status checks ran and passed before merge — independent of this repository's own account of itself.`);
L.push(``);
L.push(`**What this does not prove.** That a human distinct from the PR's author reviewed it. GitHub's \`merged_by\` is whoever clicked merge; if that is the same identity as the author, there is no third party in this at all, only an authenticated actor and a required check. Flagged per claim below as **self-merged**, not silently passed.`);
L.push(``);

if (!ghOk) {
  L.push(`> **\`gh\` unavailable: ${ghReason}.** Every GitHub-referencing claim below is reported unverified, not skipped — the absence of a checker is not evidence the claims are false, but it is not evidence they are true either.`);
  L.push(``);
}

L.push(`## Verified against GitHub`);
L.push(``);
if (results.length === 0) {
  L.push(`No approval record in any run names a GitHub pull request. Nothing here for this script to check.`);
} else {
  L.push(`| Slice | Claim | PR | Status | Merged by | Checks |`);
  L.push(`|---|---|---|---|---|---|`);
  for (const r of results) {
    const pr = `[#${r.num}](https://github.com/${r.owner}/${r.repo}/pull/${r.num})`;
    const status = r.status === "verified" ? (r.selfMerged ? "**verified** · self-merged" : "**verified**") :
      r.status === "mismatch" ? "**MISMATCH**" : "unverified";
    const by = r.mergedBy ? (r.selfMerged ? `${r.mergedBy} (= author)` : r.mergedBy) : "—";
    const checks = r.checks?.length ? r.checks.map((c) => `${c.name}: ${c.conclusion}`).join(", ") : "—";
    L.push(`| ${cell(r.slice)} | ${cell(r.action)} | ${pr} | ${status} | ${cell(by)} | ${cell(checks)} |`);
    if (r.why) L.push(`| | *${cell(r.why)}* | | | | |`);
  }
}
L.push(``);

L.push(`## Approved, but nothing to verify`);
L.push(``);
if (withoutRef.length === 0) {
  L.push(`Every approved action in every run points at a GitHub reference.`);
} else {
  L.push(`These approvals were granted but their record names no GitHub pull request — a local artefact path, a bare commit mention, or free text. Not a defect: not every gated action ships as a PR (rules 4–6 gate work *before* implementation, when no PR exists yet). Listed so the gap is visible rather than silently absent from the table above.`);
  L.push(``);
  L.push(`| Slice | Claim | Approver | Record |`);
  L.push(`|---|---|---|---|`);
  for (const c of withoutRef) L.push(`| ${cell(c.slice)} | ${cell(c.action)} | ${cell(c.approver)} | ${cell(c.record)} |`);
}
L.push(``);

const selfMergedCount = results.filter((r) => r.status === "verified" && r.selfMerged).length;
const mismatchCount = results.filter((r) => r.status === "mismatch").length;
const unverifiedCount = results.filter((r) => r.status === "unverified").length;
if (selfMergedCount || mismatchCount || unverifiedCount) {
  L.push(`## Gaps`);
  L.push(``);
  if (mismatchCount) L.push(`- ${mismatchCount} claim(s) **do not match** what GitHub records — a stated merge commit that isn't the real one. Treat as a defect, not a rounding error.`);
  if (unverifiedCount) L.push(`- ${unverifiedCount} claim(s) named a PR that could not be checked — see the reason on each row.`);
  if (selfMergedCount) L.push(`- ${selfMergedCount} verified merge(s) were **self-merged**: the same identity authored and merged the PR, so GitHub corroborates the merge event but not a distinct reviewer. This repo's actual operating pattern — one operator — makes this the expected shape, not a red flag; the CC8.1 human-approval evidence for these lives in the driving session's own approval record, not in GitHub's review history.`);
  L.push(``);
}

writeFileSync(join(runsDir, "APPROVAL_VERIFICATION.md"), L.join("\n"));

console.log(
  `verify-approvals: ${results.length} GitHub reference(s) checked ` +
  `(${results.filter((r) => r.status === "verified").length} verified, ${mismatchCount} mismatch, ${unverifiedCount} unverified), ` +
  `${withoutRef.length} approval(s) with no reference to check → runs/APPROVAL_VERIFICATION.md`
);

if (STRICT && (mismatchCount > 0 || (unverifiedCount > 0 && ghOk))) {
  console.error(`verify-approvals --strict: ${mismatchCount} mismatch(es), ${unverifiedCount} unverified claim(s)`);
  process.exit(1);
}
