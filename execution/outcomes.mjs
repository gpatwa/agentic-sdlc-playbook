#!/usr/bin/env node
// outcomes.mjs — delivery, quality, cost and review figures for one repo, computed from git and the run records (T42 P2).
//
//   node outcomes.mjs <repo> [--branch main] [--window-days 14] [--now <ISO>] [--exclude <regex>]... [--gh] [--json]
//
// The contract is docs/PRODUCTIVITY_METRICS.md. A figure not defined there is not produced here. Rules held in code:
//   • READ ONLY and NO MODEL CALL. Only `git log/diff/rev-list/diff-tree` (and, with --gh, `gh pr view`) are run, with -C <repo>.
//     Nothing is written to the target. The test proves HEAD, the index and the working tree are unchanged.
//   • Outcomes and teams, never inputs or individuals: no author name is read, kept or printed, and there is no ranking.
//   • Each figure carries its unit and n. Below ten merged changes no percentile or "slowest tenth" is drawn, only the list.
//   • A figure whose data is missing says "not recorded" with the reason. It is never estimated.
//   • Tokens appear only as cost (group C), in the unit the run records use: peak context summed per spawn.
//   • Works on a repo with no Aveto records (git only); where runs/*/trace.json exist it adds the record-based figures.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const run = (repo, cmd, args) => execFileSync(cmd, args, { cwd: repo, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
const git = (repo, args) => run(repo, "git", ["-C", repo, ...args]);

export const NOT_RECORDED = "not recorded";

// Paths a human is not expected to read line by line (H4). Printed in the output so nothing is hidden.
export const DEFAULT_EXCLUDES = [
  String.raw`(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|uv\.lock|Pipfile\.lock|Cargo\.lock|go\.sum|Gemfile\.lock|composer\.lock)$`,
  String.raw`(^|/)(node_modules|dist|build|\.next|__pycache__|vendor)/`,
  String.raw`\.min\.(js|css)$`,
  String.raw`\.(snap|map)$`,
  String.raw`(^|/)(generated|__generated__)/`,
];
// Records the process writes. Counted separately, never hidden: a person reads END_REVIEW.md, not every evidence file.
const RECORD_PATH = /^runs\//;

export const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const hoursBetween = (a, b) => (new Date(b) - new Date(a)) / 36e5;
const iso = (d) => new Date(d).toISOString().replace(".000Z", "Z");
const weekKey = (d) => {
  const t = new Date(d); const day = (t.getUTCDay() + 6) % 7; // Monday start
  const mon = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - day));
  return mon.toISOString().slice(0, 10);
};

/** The branch's merged changes: "Merge pull request #N" commits, else squash commits ending "(#N)". */
export function mergedChanges(repo, branch) {
  const out = git(repo, ["log", branch, "--first-parent", "--format=%H%x1f%cI%x1f%P%x1f%s"]).split("\n").filter(Boolean);
  const merges = []; const squashes = [];
  for (const line of out) {
    const [sha, when, parents, subject] = line.split("\x1f");
    const ps = parents.split(" ").filter(Boolean);
    let m = /^Merge pull request #(\d+)\b/.exec(subject);
    if (m && ps.length === 2) { merges.push({ sha, when: iso(when), pr: Number(m[1]), style: "merge", parents: ps, subject }); continue; }
    m = /\(#(\d+)\)\s*$/.exec(subject);
    if (m && ps.length === 1) squashes.push({ sha, when: iso(when), pr: Number(m[1]), style: "squash", parents: ps, subject });
  }
  return [...merges, ...squashes].sort((a, b) => new Date(a.when) - new Date(b.when));
}

const excluder = (extra) => {
  const res = [...DEFAULT_EXCLUDES, ...extra].map((s) => new RegExp(s));
  return (p) => res.some((r) => r.test(p));
};

function numstat(repo, from, to) {
  return git(repo, ["diff", "--numstat", from, to]).split("\n").filter(Boolean).map((l) => {
    const [a, d, ...p] = l.split("\t");
    return { path: p.join("\t"), lines: (a === "-" ? 0 : Number(a)) + (d === "-" ? 0 : Number(d)) };
  });
}

/** Per-change facts: first-commit time (merge style only), changed lines read vs excluded vs records, the file set. */
export function describeChange(repo, c, excluded) {
  const base = c.parents[0];
  const stat = numstat(repo, base, c.sha);
  const files = new Set(stat.map((s) => s.path));
  let read = 0, excludedLines = 0, recordLines = 0;
  for (const s of stat) {
    if (RECORD_PATH.test(s.path)) recordLines += s.lines;
    else if (excluded(s.path)) excludedLines += s.lines;
    else read += s.lines;
  }
  let firstCommit = null; let branchShas = [c.sha];
  if (c.style === "merge") {
    const rows = git(repo, ["log", `${c.parents[0]}..${c.parents[1]}`, "--format=%H%x1f%cI"]).split("\n").filter(Boolean).map((l) => l.split("\x1f"));
    branchShas = rows.map((r) => r[0]);
    const times = rows.map((r) => new Date(r[1]).getTime()).sort((a, b) => a - b);
    if (times.length) firstCommit = iso(times[0]);
  }
  return { ...c, firstCommit, files, readLines: read, excludedLines, recordLines, branchShas };
}

/** All non-merge commits with time, subject and body, for finding reverts and fixes after a merge. */
function commitIndex(repo, branch) {
  const raw = git(repo, ["log", branch, "--no-merges", "-z", "--format=%H%x1f%cI%x1f%s%x1f%b"]).split("\0").filter(Boolean);
  return raw.map((r) => { const [sha, when, subject, body] = r.split("\x1f"); return { sha: sha.trim(), when, subject, body: body ?? "" }; });
}

/**
 * Q2: within `windowDays` after a merge, was there a revert of it (certain) or a "fix" commit that names its PR or touches a file
 * it changed (a heuristic, reported separately so nobody reads it as certain)? Merges younger than the window are not counted.
 */
export function postMergeOutcomes(repo, changes, idx, { windowDays, now }) {
  const winMs = windowDays * 864e5;
  const cands = idx.filter((c) => /^(fix|hotfix|revert)\b|\brevert\b/i.test(c.subject));
  const filesOf = new Map();
  const filesFor = (sha) => { if (!filesOf.has(sha)) filesOf.set(sha, new Set(git(repo, ["diff-tree", "--no-commit-id", "--name-only", "-r", sha]).split("\n").filter(Boolean))); return filesOf.get(sha); };
  return changes.map((c) => {
    const t = new Date(c.when).getTime();
    if (t + winMs > now) return { pr: c.pr, windowClosed: false, reverted: null, fixCandidates: null };
    const ids = new Set([c.sha, ...c.branchShas]);
    let reverted = false; const fixes = [];
    for (const k of cands) {
      const kt = new Date(k.when).getTime();
      if (kt <= t || kt > t + winMs) continue;
      // Only the commit named after "This reverts commit" counts; the same body also mentions the parent it reverted onto.
      const named = [...k.body.matchAll(/This reverts commit ([0-9a-f]{7,40})/g)].map((m) => m[1]);
      const revertsThis = /^revert\b/i.test(k.subject) && (named.some((n) => [...ids].some((s) => s.startsWith(n))) || new RegExp(`Merge pull request #${c.pr}\\b`).test(k.subject));
      if (revertsThis) { reverted = true; continue; }
      if (!/^(fix|hotfix)\b/i.test(k.subject)) continue;
      const names = new RegExp(`#${c.pr}\\b`).test(k.subject + k.body);
      const overlap = [...filesFor(k.sha)].some((f) => c.files.has(f) && !RECORD_PATH.test(f));
      if (names || overlap) fixes.push(k.sha.slice(0, 7));
    }
    return { pr: c.pr, windowClosed: true, reverted, fixCandidates: fixes.length };
  });
}

// Record-based figures from runs/<slice>/trace.json and CHARTER.md.
export function recordFigures(repo) {
  const dir = join(repo, "runs");
  if (!existsSync(dir)) return null;
  const rows = [];
  for (const slice of readdirSync(dir).sort()) {
    const tf = join(dir, slice, "trace.json");
    if (!existsSync(tf)) continue;
    let t; try { t = JSON.parse(readFileSync(tf, "utf8")); } catch { continue; }
    const tokens = (t.stages ?? []).reduce((a, s) => a + (s.tokens || 0), 0);
    let plan = null;
    const cf = join(dir, slice, "CHARTER.md");
    if (existsSync(cf)) {
      const m = /C2\.1 Plan total:\*\*\s*([\d,.]+)\s*([kM])/.exec(readFileSync(cf, "utf8"));
      if (m) plan = Math.round(Number(m[1].replace(/,/g, "")) * (m[2] === "M" ? 1e6 : 1e3));
    }
    const charter = (t.approvals ?? []).filter((a) => a.decision === "approved" && a.decidedAt).map((a) => a.decidedAt).sort()[0] ?? null;
    rows.push({ slice, tier: t.tier ?? null, landed: !!t.landed, landedAt: t.landedAt ?? null, mergedPr: t.mergedPr ?? null, started: t.started ?? null, charterApprovedAt: charter, tokens, plan, stages: (t.stages ?? []).length,
      gateCatches: Array.isArray(t.gateCatches) ? t.gateCatches.length : null, postLandingFixes: "postLandingFixes" in t ? t.postLandingFixes : null, reverted: "reverted" in t ? !!t.reverted : null });
  }
  return rows;
}

export async function outcomes(repo, opts = {}) {
  const branch = opts.branch ?? "main";
  const windowDays = opts.windowDays ?? 14;
  const now = opts.now ? new Date(opts.now).getTime() : Date.now();
  const excluded = excluder(opts.exclude ?? []);
  const changes = mergedChanges(repo, branch).map((c) => describeChange(repo, c, excluded));
  const idx = commitIndex(repo, branch);
  const post = postMergeOutcomes(repo, changes, idx, { windowDays, now });
  const n = changes.length;

  // D2: merged changes per week
  const perWeek = {}; for (const c of changes) perWeek[weekKey(c.when)] = (perWeek[weekKey(c.when)] ?? 0) + 1;

  // D1 (git only): first commit on the branch to merge. Squash merges have no branch history, so they are left out, not guessed.
  const lead = changes.filter((c) => c.firstCommit).map((c) => ({ pr: c.pr, hours: Math.max(0, hoursBetween(c.firstCommit, c.when)) }));
  const slowest = n >= 10 ? [...lead].sort((a, b) => b.hours - a.hours).slice(0, Math.max(1, Math.ceil(lead.length / 10))) : null;

  // Q2
  const closed = post.filter((p) => p.windowClosed);
  const revertCount = closed.filter((p) => p.reverted).length;
  const fixCount = closed.filter((p) => !p.reverted && p.fixCandidates > 0).length;

  // H4
  const readLines = changes.map((c) => c.readLines);
  let noReview = { value: NOT_RECORDED, reason: "needs --gh (reads each pull request's reviews through the GitHub CLI)" };
  if (opts.gh) {
    const get = opts.reviewsOf ?? ((pr) => JSON.parse(run(repo, "gh", ["pr", "view", String(pr), "--json", "reviews"])).reviews?.length ?? 0);
    let none = 0, known = 0, failed = 0;
    for (const c of changes) { try { known++; if (get(c.pr) === 0) none++; } catch { failed++; known--; } }
    noReview = known ? { value: none / known, none, of: known, failed } : { value: NOT_RECORDED, reason: "GitHub CLI unavailable for this repo" };
  }

  const recs = recordFigures(repo);
  const recorded = recs && recs.length ? recs : null;
  let cost = null;
  if (recorded) {
    const withPlan = recorded.filter((r) => r.plan && r.tokens);
    cost = {
      unit: "tokens, peak context summed per spawn (trace.json stages[].tokens)",
      perSlice: recorded.map((r) => ({ slice: r.slice, tier: r.tier, tokens: r.tokens, plan: r.plan, ratio: r.plan ? r.tokens / r.plan : null, landed: r.landed })),
      mergedSlices: recorded.filter((r) => r.landed).length,
      tokensPerMergedSlice: recorded.filter((r) => r.landed).length ? Math.round(recorded.filter((r) => r.landed).reduce((a, r) => a + r.tokens, 0) / recorded.filter((r) => r.landed).length) : NOT_RECORDED,
      planRatioMedian: withPlan.length ? median(withPlan.map((r) => r.tokens / r.plan)) : NOT_RECORDED,
      planRatioN: withPlan.length,
    };
  }
  const charterLead = recorded ? recorded.filter((r) => r.charterApprovedAt && r.landedAt && r.landed).map((r) => ({ slice: r.slice, hours: Math.max(0, hoursBetween(r.charterApprovedAt, r.landedAt)) })) : [];

  return {
    schema: "aveto/outcomes@1",
    repo: { branch, tip: git(repo, ["rev-parse", "--short", branch]).trim(), tipAt: iso(git(repo, ["log", "-1", "--format=%cI", branch]).trim()), windowDays, generatedAt: iso(now),
      note: "Read from the named ref as it is on this machine; nothing is fetched. Compare tipAt with the remote's latest before trusting recency." },
    n: { mergedChanges: n, style: [...new Set(changes.map((c) => c.style))], withRecords: recorded ? recorded.length : 0 },
    excludedPaths: [...DEFAULT_EXCLUDES, ...(opts.exclude ?? [])],
    delivery: {
      D1_leadTime_gitOnly: { unit: "hours, first commit on the branch to merge", n: lead.length, median: median(lead.map((l) => l.hours)), items: lead, slowestTenth: slowest ?? "not drawn below ten merged changes", note: lead.length < n ? `${n - lead.length} squash-merged change(s) have no branch history and are left out` : undefined },
      D1_leadTime_fromCharter: recorded ? { unit: "hours, Charter approval to merge (from trace.json)", n: charterLead.length, median: median(charterLead.map((l) => l.hours)), items: charterLead } : { value: NOT_RECORDED, reason: "no runs/*/trace.json" },
      D2_mergedPerWeek: { unit: "merged changes per week (Monday start, UTC)", weeks: perWeek },
      D3_timeToRestore: { value: NOT_RECORDED, reason: "needs deploy or incident records; git shows reverts (Q2) but not when service was restored" },
    },
    quality: {
      Q2_postMergeWithin: { windowDays, closedWindowN: closed.length, openWindowN: post.length - closed.length, reverted: revertCount, fixCandidates: fixCount,
        revertRate: closed.length ? revertCount / closed.length : NOT_RECORDED,
        revertOrFixCandidateRate: closed.length ? (revertCount + fixCount) / closed.length : NOT_RECORDED,
        note: "reverts are certain; fix candidates are a heuristic (a fix/hotfix commit that names the PR or touches a file it changed)" },
      Q1_gateCatches: recorded ? { unit: "defects a gate caught before merge (trace.json gateCatches)", perSlice: recorded.map((r) => ({ slice: r.slice, catches: r.gateCatches })), recordedSlices: recorded.filter((r) => r.gateCatches !== null).length } : { value: NOT_RECORDED, reason: "no runs/*/trace.json" },
      Q3_Q4: { value: NOT_RECORDED, reason: "review findings are prose today; CI first-run results need the GitHub API (not read here)" },
    },
    cost: cost ?? { value: NOT_RECORDED, reason: "no runs/*/trace.json" },
    humanAttention: {
      H1_H2_H3: { value: NOT_RECORDED, reason: "owner touches live in the session transcript; no collector yet (backlog T30)" },
      H4_reviewBurden: { unit: "changed lines (added + removed) outside excluded paths and runs/, per merged change", n, median: median(readLines), items: changes.map((c, i) => ({ pr: c.pr, readLines: c.readLines, excludedLines: c.excludedLines, recordLines: c.recordLines })), mergedWithNoReview: noReview },
      H5_reviewsWaiting: { value: NOT_RECORDED, reason: "snapshot of open pull requests; needs the GitHub API" },
    },
    counterweightNote: "Read lead time beside Q2 and H4. A faster lead time with a rising revert or fix rate, or with thinner review, is not an improvement.",
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const repo = args.find((a, i) => !a.startsWith("--") && !["--branch", "--window-days", "--now", "--exclude"].includes(args[i - 1]));
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  if (!repo) { console.error("usage: outcomes.mjs <repo> [--branch main] [--window-days 14] [--now ISO] [--exclude regex]... [--gh] [--json]"); process.exit(2); }
  const exclude = []; args.forEach((a, i) => { if (a === "--exclude") exclude.push(args[i + 1]); });
  const r = await outcomes(repo, { branch: opt("--branch"), windowDays: opt("--window-days") ? Number(opt("--window-days")) : undefined, now: opt("--now"), exclude, gh: args.includes("--gh") });
  console.log(JSON.stringify(r, (k, v) => (v instanceof Set ? [...v] : v), 2));
}
