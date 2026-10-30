#!/usr/bin/env node
// assess-guard.mjs — makes "an assessment changes nothing" mechanical (docs/REVIEW_MODE_PLAN.md, M1 and M3b).
//
//   node assess-guard.mjs prepare <repo> <scratch-dir>     build the review copy, print and save guard.json
//   node assess-guard.mjs verify  <scratch-dir>/guard.json  exit 1 unless the repo and the copy are as expected
//
// WHY. In the spike a reviewer told not to edit files edited seven. A prompt is not a control, so the review runs in a
// throwaway clone with write tools and pushes denied by permission rules, secret paths removed from the copy, and the
// target's own harness configuration moved aside (a repository's hooks and MCP servers are code that Claude Code runs
// when it opens the folder, so an unreviewed repo must not get to run them). After the run, `verify` fails if the target's
// HEAD or status moved, or if the copy differs from the commit by anything other than the removals recorded here.
//
// The held files are not lost: they are moved to .assess-held/<path>.txt, inert and readable, because they are exactly the
// high-risk files an assessment should read.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { denyReason, READ_DENY_GLOBS } from "./repo-map.mjs";

const git = (cwd, args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const HELD = /^(\.claude\/(settings(\.local)?\.json|hooks\/.*|commands\/.*)|\.mcp\.json|\.claude\/\.mcp\.json)$/;

export const REVIEW_PERMISSIONS = {
  deny: [
    "Edit", "Write", "NotebookEdit",
    "Bash(git push:*)", "Bash(git commit:*)", "Bash(git add:*)", "Bash(git reset:*)", "Bash(git checkout:*)", "Bash(git clean:*)",
    "Bash(git remote:*)", "Bash(rm:*)", "Bash(mv:*)", "Bash(cp:*)", "Bash(curl:*)", "Bash(wget:*)",
    ...READ_DENY_GLOBS.map((g) => `Read(${g})`),
  ],
};

export function prepare(repoDir, scratchDir) {
  const repo = resolve(repoDir);
  const scratch = resolve(scratchDir);
  if (!existsSync(join(repo, ".git"))) throw new Error(`${repo} is not a git repository`);
  const sha = git(repo, ["rev-parse", "HEAD"]).trim();
  const before = { head: sha, status: git(repo, ["status", "--porcelain", "--untracked-files=all"]) };
  const clone = join(scratch, "copy");
  if (existsSync(clone)) throw new Error(`${clone} already exists: use a new scratch directory`);
  mkdirSync(scratch, { recursive: true });
  execFileSync("git", ["clone", "-q", "--no-hardlinks", repo, clone], { stdio: "pipe" });
  git(clone, ["checkout", "-q", "--detach", sha]);
  // No remote: nothing in the copy can push anywhere.
  git(clone, ["remote", "remove", "origin"]);

  const tracked = git(clone, ["ls-files", "-z"]).split("\0").filter(Boolean);
  const removed = [], held = [];
  for (const p of tracked) {
    if (denyReason(p)) { rmSync(join(clone, p), { force: true }); removed.push(p); }
    else if (HELD.test(p)) {
      const dest = join(clone, ".assess-held", `${p}.txt`);
      mkdirSync(dirname(dest), { recursive: true });
      renameSync(join(clone, p), dest);
      held.push(p);
    }
  }
  mkdirSync(join(clone, ".claude"), { recursive: true });
  const settingsText = JSON.stringify({ permissions: REVIEW_PERMISSIONS }, null, 2) + "\n";
  writeFileSync(join(clone, ".claude", "settings.json"), settingsText);
  appendFileSync(join(clone, ".git", "info", "exclude"), "/.claude/\n/.assess-held/\n/reviews/\n");

  const guard = { repo, clone, sha, before, removed, held, settingsHash: createHash("sha256").update(settingsText).digest("hex"), preparedAt: new Date().toISOString() };
  writeFileSync(join(scratch, "guard.json"), JSON.stringify(guard, null, 2) + "\n");
  return guard;
}

export function verify(guardOrPath) {
  const g = typeof guardOrPath === "string" ? JSON.parse(readFileSync(guardOrPath, "utf8")) : guardOrPath;
  const problems = [];
  const head = git(g.repo, ["rev-parse", "HEAD"]).trim();
  if (head !== g.before.head) problems.push(`the target's HEAD moved: ${g.before.head.slice(0, 8)} -> ${head.slice(0, 8)}`);
  const status = git(g.repo, ["status", "--porcelain", "--untracked-files=all"]);
  if (status !== g.before.status) problems.push(`the target's working tree changed:\n${status}`);
  const cloneHead = git(g.clone, ["rev-parse", "HEAD"]).trim();
  if (cloneHead !== g.sha) problems.push(`the review copy's HEAD moved: ${g.sha.slice(0, 8)} -> ${cloneHead.slice(0, 8)}`);
  // The only differences allowed are the recorded removals, and our own settings file where the target tracked one.
  const expected = new Set([...g.removed, ...g.held].map((p) => `D ${p}`));
  if (g.held.includes(".claude/settings.json")) expected.add("M .claude/settings.json");
  for (const line of git(g.clone, ["status", "--porcelain", "--untracked-files=all"]).split("\n").filter(Boolean)) {
    const norm = line.replace(/^ (?=[DM] )/, "").replace(/^([DM]) {2}/, "$1 ");
    if (!expected.has(norm)) problems.push(`the review copy differs from the commit: ${line}`);
  }
  // The permission rules themselves must be exactly what prepare wrote.
  const settings = join(g.clone, ".claude", "settings.json");
  const hash = existsSync(settings) ? createHash("sha256").update(readFileSync(settings)).digest("hex") : null;
  if (hash !== g.settingsHash) problems.push("the review copy's permission rules (.claude/settings.json) were changed or removed");
  return { ok: problems.length === 0, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, a, b] = process.argv.slice(2);
  try {
    if (cmd === "prepare" && a && b) {
      const g = prepare(a, b);
      console.log(`review copy: ${g.clone}\ncommit: ${g.sha}\nremoved (secret paths): ${g.removed.length}\nheld (harness config, inert): ${g.held.length}\nguard record: ${join(resolve(b), "guard.json")}`);
    } else if (cmd === "verify" && a) {
      const r = verify(a);
      if (r.ok) console.log("ok: the target is unchanged and the review copy differs from the commit only by the recorded removals");
      else { console.error("FAILED:\n- " + r.problems.join("\n- ")); process.exit(1); }
    } else { console.error("usage: assess-guard.mjs prepare <repo> <scratch-dir> | verify <scratch-dir>/guard.json"); process.exit(2); }
  } catch (e) { console.error(`! ${e.message}`); process.exit(2); }
}
