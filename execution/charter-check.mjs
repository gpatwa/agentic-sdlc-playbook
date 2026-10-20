// Charter check — dependency-free Node ESM.
//
//   node <playbook>/execution/charter-check.mjs <CHARTER.md> [--plan <00-slice-plan.md>]
//
// A Process v2 run has one human approval: the Charter (templates/CHARTER_TEMPLATE.md).
// The human approves a file by its sha256, so the file must be complete before it
// is shown. This check fails closed on anything that would make the approval
// vague: a missing section, a placeholder or blank field, a budget whose figures
// are out of order, a wildcard in a line that grants something, and (with --plan)
// a model ID or invariant the plan names that the Charter does not.
//
// It prints the file's sha256 on success. Exit 0 = complete, 1 = not, 2 = usage.
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const REQUIRED_SECTIONS = [
  [1, "Scope"],
  [2, "Budget"],
  [3, "Models"],
  [4, "Data processors"],
  [5, "Safety controls"],
  [6, "Prerequisites"],
  [7, "Depth"],
  [8, "Outcomes decided now"],
  [9, "Stops"],
];
// Sections whose lines grant something: no wildcard or open-ended wording there.
const GRANTING = new Set([3, 4, 5, 6, 8]);
const WILDCARD = /(^|[\s`(])\*($|[\s`)])|\band similar\b|\betc\.?(\s|$)|\bany (file|model|processor|invariant)\b/i;

export function checkCharter(text, planText = null) {
  const errors = [];
  const sections = new Map();
  const heads = [...text.matchAll(/^##\s+(\d+)\.\s+([^\n]+)$/gm)];
  heads.forEach((m, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    sections.set(Number(m[1]), { title: m[2].trim(), body: text.slice(m.index + m[0].length, end) });
  });

  for (const [n, name] of REQUIRED_SECTIONS) {
    const s = sections.get(n);
    if (!s) { errors.push(`section ${n} (${name}) is missing`); continue; }
    if (!s.title.toLowerCase().startsWith(name.toLowerCase())) errors.push(`section ${n} should be "${name}", found "${s.title}"`);
    if (n <= 8 && n !== 6 && !new RegExp(`\\*\\*C${n}\\.\\d+`).test(s.body)) errors.push(`section ${n} (${name}) has no C${n}.x line`);
    if (n === 6 && !/\|\s*C6\.(\d+|P)\s*\|/.test(s.body) && !/\*\*C6\.0/.test(s.body)) errors.push("section 6 (Prerequisites) has no C6.x row (write C6.0 None if there are none)");
    if (n === 6 && !/\|\s*C6\.P\s*\|/.test(s.body)) errors.push("section 6 has no C6.P row: say how no app permission prompt will interrupt the run (allow rules or the permission mode)");
  }

  // C8.4 must be exactly review or skip.
  const c84 = text.match(/\*\*C8\.4[^*]*\*\*\s*:?\s*([^\n(]*)/);
  if (!c84) errors.push("section 8 has no C8.4 line (human review of a Low-risk change: review or skip)");
  else if (!/^\s*(review|skip)\s*$/i.test(c84[1])) errors.push(`C8.4 must be exactly "review" or "skip", found "${c84[1].trim().slice(0, 40)}"`);

  // Placeholders and blank fields anywhere outside the leading quote block.
  const body = text.replace(/^>.*$/gm, "");
  const ph = body.match(/<[^>\n]{1,80}>/g);
  if (ph) errors.push(`placeholder(s) left: ${[...new Set(ph)].slice(0, 5).join(", ")}`);
  for (const m of body.matchAll(/^\s*-\s*\*\*(C\d+\.\d+)[^*]*\*\*\s*:?\s*$/gm)) errors.push(`${m[1]} has no value`);

  // C6.P must write to the gitignored local settings file, not the tracked one.
  const p6 = (sections.get(6)?.body || "").split("\n").find((l) => /\|\s*C6\.P\s*\|/.test(l)) || "";
  if (p6 && !/settings\.local\.json/.test(p6)) errors.push("C6.P must write the allow rules to .claude/settings.local.json (gitignored), not the tracked .claude/settings.json");

  // Permission rules (section 6): a fixed command prefix, a wildcard only at the end.
  const permRule = /`(\w+)\(([^`]*)\)`/g;
  for (const line of (sections.get(6)?.body || "").split("\n")) {
    if (line.trimStart().startsWith(">")) continue; // explanatory quote, not a grant
    for (const m of line.matchAll(permRule)) {
      const inner = m[2].trim();
      const stem = inner.replace(/(\s\*|:\*)$/, "");
      if (stem.includes("*")) errors.push(`permission rule allows any command (wildcard before or inside it): ${m[0]}`);
      if (!stem.trim()) errors.push(`permission rule has no command prefix: ${m[0]}`);
    }
  }

  // Granting lines must be exact.
  for (const n of GRANTING) {
    const s = sections.get(n);
    if (!s) continue;
    for (const line of s.body.split("\n")) {
      if (!/C\d+\.(\d+|P)/.test(line)) continue;
      if (n === 6) {
        const noRules = line.replace(/`\w+\([^`]*\)`/g, "");
        if (WILDCARD.test(noRules.replace(/`[^`]*`/g, ""))) errors.push(`open-ended grant in section 6: ${line.trim().slice(0, 100)}`);
        continue;
      }
      if (WILDCARD.test(line.replace(/`[^`]*`/g, (c) => (c.includes("*") && !/mcp__\*/.test(c) ? " * " : "")))) {
        errors.push(`open-ended grant in section ${n}: ${line.trim().slice(0, 100)}`);
      }
    }
  }

  // Section 3: every model line states an effort level; the review rescore is stated.
  const s3 = (sections.get(3)?.body || "").split("\n").filter((l) => !l.trimStart().startsWith(">"));
  const modelLines = s3.filter((l) => /\*\*C3\.\d+\*\*/.test(l));
  for (const l of modelLines) if (!/\beffort\s+(low|medium|high|xhigh|max)\b/i.test(l)) errors.push(`model line has no effort level (low, medium, high, xhigh or max): ${l.trim().slice(0, 90)}`);
  if (modelLines.length && !s3.some((l) => /\*\*C3\.R\b/.test(l))) errors.push("section 3 needs a C3.R line: the review rescore status (rescored, unchanged, or no review step)");

  // Budget order.
  const num = (id) => {
    const m = text.match(new RegExp(`\\*\\*${id.replace(".", "\\.")}[^*]*\\*\\*\\s*:?\\s*([\\d.,]+)\\s*([kKmM])?`));
    if (!m) return null;
    const v = Number(m[1].replace(/,/g, ""));
    return m[2] && /m/i.test(m[2]) ? v * 1000 : v;
  };
  const [plan, ceiling, cap] = [num("C2.1"), num("C2.2"), num("C2.3")];
  if ([plan, ceiling, cap].some((v) => v === null || Number.isNaN(v))) errors.push("budget: C2.1, C2.2 and C2.3 must each be a number (k or M)");
  else if (!(plan <= ceiling && ceiling <= cap)) errors.push(`budget out of order: plan ${plan}k, ceiling ${ceiling}k, hard cap ${cap}k`);

  // Everything the plan names that needs a grant must be in the Charter.
  if (planText) {
    const models = new Set(planText.match(/\bclaude-[a-z]+-\d+(?:-\d+)*\b/g) || []);
    for (const id of models) if (!(sections.get(3)?.body || "").includes(id)) errors.push(`the plan names model ${id}; section 3 does not`);
    const invs = new Set(planText.match(/\bINV-\d+\b/g) || []);
    for (const inv of invs) if (!(sections.get(5)?.body || "").includes(inv)) errors.push(`the plan names ${inv}; section 5 does not grant a change to it (write it, or state the plan leaves it unchanged)`);
  }

  return { ok: errors.length === 0, errors, sha256: createHash("sha256").update(text).digest("hex") };
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const pi = args.indexOf("--plan");
  if (!file || !existsSync(file)) { console.error("usage: charter-check.mjs <CHARTER.md> [--plan <00-slice-plan.md>]"); process.exit(2); }
  const planText = pi !== -1 && args[pi + 1] && existsSync(args[pi + 1]) ? readFileSync(args[pi + 1], "utf8") : null;
  const r = checkCharter(readFileSync(file, "utf8"), planText);
  if (r.ok) { console.log(`charter complete: ${file}\nsha256 ${r.sha256}`); process.exit(0); }
  console.log(`charter NOT complete: ${file}`);
  for (const e of r.errors) console.log(`  - ${e}`);
  process.exit(1);
}
