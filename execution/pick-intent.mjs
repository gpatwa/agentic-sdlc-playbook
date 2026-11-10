// Pick the next routine intent (Process v3) — dependency-free Node ESM.
//
//   node <playbook>/execution/pick-intent.mjs <product-repo> [--standing <STANDING_CHARTER.md>]
//
// Used by the scheduled task before it starts a routine run. One run at a time per
// repo: if any runs/<slice>/STATE.md has a Status other than `done`, nothing is
// picked. Otherwise the first intent in intents/ready/ (by file name) that has no
// runs/<slice>/ folder yet is printed. With --standing, it also prints how many runs
// have already used that standing Charter (each routine run writes
// runs/<slice>/STANDING_FIT.md naming the Charter's sha256 on its first line).
//
// "One run at a time per repo" means per REPO, not per checkout. A slice started in a git
// worktree (for example one under .claude/worktrees/) keeps its runs/ in that worktree, so
// the run folders of every worktree of the repo are read, and an open run in any of them
// stops the pick. A slice that already has a run folder in any worktree is not picked again,
// and the standing-Charter count covers all of them (counted once per slice name).
// Exit 0 = picked (path on stdout), 3 = a run is open, 4 = nothing ready, 2 = usage.
import { readFileSync, readdirSync, existsSync, statSync, realpathSync } from "node:fs";
import { join, basename, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const canon = (p) => { try { return realpathSync.native(p); } catch { return resolve(p); } };

// Every checkout of this repo: the one given, the linked worktrees git lists (from any of them,
// git lists all), and any .claude/worktrees/* directory (covers a worktree git no longer lists,
// and the case where git is not available). Paths that do not exist are dropped.
export function checkouts(repo) {
  const found = [canon(repo)];
  try {
    const out = execFileSync("git", ["-C", repo, "worktree", "list", "--porcelain"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    for (const line of out.split("\n")) if (line.startsWith("worktree ")) found.push(line.slice(9).trim());
  } catch { /* not a git repo, or no git: fall through to the directory scan */ }
  for (const base of new Set(found.slice())) {
    const wt = join(base, ".claude", "worktrees");
    try { for (const w of readdirSync(wt)) if (statSync(join(wt, w)).isDirectory()) found.push(join(wt, w)); } catch { /* none */ }
  }
  return [...new Set(found.map(canon))].filter((d) => existsSync(d));
}

export function pickIntent(repo, standingText = null) {
  const self = canon(repo);
  const where = (root) => (root === self ? null : relative(self, root).startsWith("..") ? root : relative(self, root));
  const runs = new Set();
  const open = [];
  const used = new Set();
  const sha = standingText ? createHash("sha256").update(standingText).digest("hex") : null;
  for (const root of checkouts(repo)) {
    const runsDir = join(root, "runs");
    if (!existsSync(runsDir)) continue;
    for (const d of readdirSync(runsDir)) {
      if (!statSync(join(runsDir, d)).isDirectory()) continue;
      runs.add(d);
      const st = join(runsDir, d, "STATE.md");
      if (existsSync(st)) {
        const m = readFileSync(st, "utf8").match(/\*\*Status:\*\*\s*([\w-]+)/);
        if ((!m || m[1] !== "done") && !open.some((o) => o.slice === d && o.in === where(root))) open.push({ slice: d, in: where(root) });
      }
      const f = join(runsDir, d, "STANDING_FIT.md");
      if (sha && existsSync(f) && readFileSync(f, "utf8").split("\n")[0].includes(sha)) used.add(d);
    }
  }
  const runsUsed = sha ? used.size : null;
  if (open.length) return { status: "open", open: open.map((o) => o.slice), openIn: open, runsUsed };
  const readyDir = join(repo, "intents", "ready");
  const ready = existsSync(readyDir) ? readdirSync(readyDir).filter((f) => f.endsWith(".md")).sort() : [];
  const next = ready.find((f) => !runs.has(basename(f, ".md")));
  if (!next) return { status: "none", runsUsed };
  return { status: "picked", intent: join("intents", "ready", next), slice: basename(next, ".md"), runsUsed };
}

// import.meta.url is the REAL path; process.argv[1] is the path as invoked (maybe via a symlink, e.g. macOS /var -> /private/var). Resolve both.
const isMain = (() => { try { return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (isMain) {
  const args = process.argv.slice(2);
  const repo = args[0];
  const si = args.indexOf("--standing");
  if (!repo || !existsSync(repo) || (si !== -1 && !existsSync(args[si + 1] || ""))) { console.error("usage: pick-intent.mjs <product-repo> [--standing <STANDING_CHARTER.md>]"); process.exit(2); }
  const r = pickIntent(repo, si !== -1 ? readFileSync(args[si + 1], "utf8") : null);
  if (r.runsUsed !== null) console.error(`runs already used under this standing Charter: ${r.runsUsed}`);
  if (r.status === "open") { console.log(`a run is open: ${r.openIn.map((o) => (o.in ? `${o.slice} (in ${o.in})` : o.slice)).join(", ")}`); process.exit(3); }
  if (r.status === "none") { console.log("nothing ready in intents/ready/"); process.exit(4); }
  console.log(r.intent); process.exit(0);
}
