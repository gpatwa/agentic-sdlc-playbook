// Claims check — dependency-free Node ESM.
//
//   node scripts/check-claims.mjs [docs/MESSAGING.md]
//
// docs/MESSAGING.md section 8 is the register of every public claim. A claim is
// only as good as its evidence, so this fails when a row names an evidence path
// in THIS repo that does not exist, when a row has no evidence, or when a row's
// status is missing. Paths in other repos ("aveto-support `runs/...`") are
// skipped: CI cannot see them, and the row says whose they are.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const LOCAL_PREFIXES = ["agents/", "docs/", "execution/", "templates/", "scripts/", "project-packs/", "site/", "prompts/", "skills/", "examples/"];
const OTHER_REPOS = /(aveto-support|streak-seed|stash-seed)\s*(and\s+(aveto-support|streak-seed|stash-seed)\s*)?$/i;

export function checkClaims(text, root = ROOT) {
  const errors = [];
  const start = text.search(/^##\s+8\.\s+The claims register/m);
  if (start === -1) return { ok: false, errors: ["no 'The claims register' section 8"], rows: 0 };
  const rest = text.slice(start).replace(/^##[^\n]*\n/, "").split(/^##\s+/m)[0];
  const rows = rest.split("\n").filter((l) => /^\|\s*C\d+\s*\|/.test(l));
  if (!rows.length) errors.push("the claims register has no C<n> rows");
  const ids = new Set();
  for (const row of rows) {
    const cells = row.split("|").slice(1, -1).map((c) => c.trim());
    const [id, claim, status, evidence] = cells;
    if (ids.has(id)) errors.push(`${id}: duplicate id`);
    ids.add(id);
    if (!claim) errors.push(`${id}: no claim text`);
    if (!status) errors.push(`${id}: no status`);
    if (!evidence) { errors.push(`${id}: no evidence`); continue; }
    for (const m of evidence.matchAll(/`([^`]+)`/g)) {
      const token = m[1].replace(/[.,;]+$/, "");
      if (!LOCAL_PREFIXES.some((p) => token.startsWith(p))) continue;
      const before = evidence.slice(0, m.index);
      if (OTHER_REPOS.test(before.trimEnd().split(/[,;]\s*/).pop() || "")) continue; // a path in another repo
      const p = join(root, token);
      if (!existsSync(p)) errors.push(`${id}: evidence path does not exist: ${token}`);
    }
  }
  return { ok: errors.length === 0, errors, rows: rows.length };
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const file = process.argv[2] || join(ROOT, "docs", "MESSAGING.md");
  if (!existsSync(file)) { console.error(`no such file: ${file}`); process.exit(2); }
  const r = checkClaims(readFileSync(file, "utf8"));
  if (r.ok) { console.log(`claims check: ${r.rows} claims, all evidence paths in this repo exist`); process.exit(0); }
  console.log("claims check FAILED");
  for (const e of r.errors) console.log("  - " + e);
  process.exit(1);
}
