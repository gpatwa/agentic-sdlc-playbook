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
// Exit 0 = picked (path on stdout), 3 = a run is open, 4 = nothing ready, 2 = usage.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";

export function pickIntent(repo, standingText = null) {
  const runsDir = join(repo, "runs");
  const runs = existsSync(runsDir) ? readdirSync(runsDir).filter((d) => statSync(join(runsDir, d)).isDirectory()) : [];
  const open = runs.filter((d) => {
    const st = join(runsDir, d, "STATE.md");
    if (!existsSync(st)) return false;
    const m = readFileSync(st, "utf8").match(/\*\*Status:\*\*\s*([\w-]+)/);
    return !m || m[1] !== "done";
  });
  let runsUsed = null;
  if (standingText) {
    const sha = createHash("sha256").update(standingText).digest("hex");
    runsUsed = runs.filter((d) => {
      const f = join(runsDir, d, "STANDING_FIT.md");
      return existsSync(f) && readFileSync(f, "utf8").split("\n")[0].includes(sha);
    }).length;
  }
  if (open.length) return { status: "open", open, runsUsed };
  const readyDir = join(repo, "intents", "ready");
  const ready = existsSync(readyDir) ? readdirSync(readyDir).filter((f) => f.endsWith(".md")).sort() : [];
  const next = ready.find((f) => !runs.includes(basename(f, ".md")));
  if (!next) return { status: "none", runsUsed };
  return { status: "picked", intent: join("intents", "ready", next), slice: basename(next, ".md"), runsUsed };
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const args = process.argv.slice(2);
  const repo = args[0];
  const si = args.indexOf("--standing");
  if (!repo || !existsSync(repo) || (si !== -1 && !existsSync(args[si + 1] || ""))) { console.error("usage: pick-intent.mjs <product-repo> [--standing <STANDING_CHARTER.md>]"); process.exit(2); }
  const r = pickIntent(repo, si !== -1 ? readFileSync(args[si + 1], "utf8") : null);
  if (r.runsUsed !== null) console.error(`runs already used under this standing Charter: ${r.runsUsed}`);
  if (r.status === "open") { console.log(`a run is open: ${r.open.join(", ")}`); process.exit(3); }
  if (r.status === "none") { console.log("nothing ready in intents/ready/"); process.exit(4); }
  console.log(r.intent); process.exit(0);
}
