#!/usr/bin/env node
// Role eval (B2 of docs/MODEL_CHANGE_CHECK_PLAN.md): the part of a model-change check that is plain code. Dependency-free.
//
//   node role-eval.mjs list                       the cases, their role and how each is checked
//   node role-eval.mjs check                      the fixtures match docs/model-change-evals/cases.toml; exit 1 if not
//   node role-eval.mjs prompt <case-id>           the task to give a fresh subagent of the role (a harness session does this)
//   node role-eval.mjs score <case-id> <file>     scripted case: PASS/FAIL with reasons (exit 0/1); judged case: prints the
//                                                 judge packet (rubric + the output) and exits 3, because a judge must read it
//
// What it does NOT do: it never calls a model. A harness session spawns the role subagent with `prompt` and saves the reply; a
// separate judge session (or a person) reads a packet for the judged cases. Scripted cases ask the role for `KEY: value` footer
// lines and compare them with the rubric, so they test whether the role reaches and states the right decision, not how well it
// reasons; the judged cases are the ones that test reasoning. A pass rate from this tool is a measurement of these cases only.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
export const EVAL_DIR = join(here, "..", "docs", "model-change-evals");
const FIX = join(EVAL_DIR, "fixtures");

export const caseIds = (fixDir = FIX) => existsSync(fixDir) ? readdirSync(fixDir).filter((d) => existsSync(join(fixDir, d, "rubric.json"))).sort() : [];
export const loadCase = (id, fixDir = FIX) => {
  const d = join(fixDir, id);
  if (!existsSync(join(d, "rubric.json"))) throw new Error(`no such case: ${id}`);
  return { dir: d, rubric: JSON.parse(readFileSync(join(d, "rubric.json"), "utf8")), input: readFileSync(join(d, "input.md"), "utf8") };
};
// ids named in the human-readable spec
export const specIds = () => [...readFileSync(join(EVAL_DIR, "cases.toml"), "utf8").matchAll(/^id = "([^"]+)"/gm)].map((m) => m[1]).sort();

const list = (v) => String(v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

// Last `KEY: value` line wins. The key is matched case-sensitively as written in the rubric.
export function footerOf(output) {
  const out = {};
  for (const line of String(output).split("\n")) {
    const m = line.match(/^\s*([A-Z][A-Z_]{2,}):\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export function scoreScripted(rubric, output) {
  const reasons = [];
  const f = footerOf(output);
  for (const [key, rule] of Object.entries(rubric.footer ?? {})) {
    if (!(key in f)) { reasons.push(`missing footer line ${key}`); continue; }
    if (rule.equals !== undefined && f[key].trim().toUpperCase() !== String(rule.equals).toUpperCase()) reasons.push(`${key} is "${f[key]}", expected "${rule.equals}"`);
    const got = list(f[key]);
    for (const w of rule.include ?? []) if (!got.includes(w.toLowerCase())) reasons.push(`${key} lacks "${w}"`);
    for (const w of rule.exclude ?? []) if (got.includes(w.toLowerCase())) reasons.push(`${key} must not contain "${w}"`);
  }
  for (const t of rubric.contains_text ?? []) if (!String(output).includes(t)) reasons.push(`output does not mention "${t}"`);
  return { pass: reasons.length === 0, reasons };
}

export function judgePacket(rubric, output) {
  return [
    `# Judge packet: ${rubric.id} (role: ${rubric.role})`,
    ``,
    `Read the OUTPUT below and decide, using only the OUTPUT, whether it satisfies the rubric. Answer PASS or FAIL on the first line,`,
    `then one sentence quoting the part of the OUTPUT that decided it. Do not reward length or confidence.`,
    ``,
    `MUST DO: ${rubric.must_do ?? rubric.must_find ?? "(none)"}`,
    `MUST NOT: ${rubric.must_not ?? "(none)"}`,
    ``,
    `OUTPUT sha256: ${createHash("sha256").update(output).digest("hex")}`,
    `--- OUTPUT ---`,
    output,
    `--- END OUTPUT ---`,
    ``,
  ].join("\n");
}

export const promptFor = (c) => `You are the ${c.rubric.role} agent. Read your brief at agents/${c.rubric.role}.md in the playbook, then do the task below. Work only from what is in the task.\n\n${c.input}`;

export function checkFixtures({ fixDir = FIX, spec = specIds() } = {}) {
  const problems = [];
  const fix = caseIds(fixDir);
  for (const id of spec) if (!fix.includes(id)) problems.push(`spec case "${id}" has no fixture`);
  for (const id of fix) if (!spec.includes(id)) problems.push(`fixture "${id}" is not in cases.toml`);
  for (const id of fix) {
    const c = loadCase(id, fixDir);
    if (c.rubric.id !== id) problems.push(`${id}: rubric id is "${c.rubric.id}"`);
    if (!c.input.trim()) problems.push(`${id}: empty input.md`);
    if (!["scripted", "judged"].includes(c.rubric.check)) problems.push(`${id}: check must be scripted or judged`);
    if (c.rubric.check === "scripted" && !Object.keys(c.rubric.footer ?? {}).length) problems.push(`${id}: scripted case has no footer rule`);
    if (c.rubric.check === "scripted") {
      for (const key of Object.keys(c.rubric.footer)) if (!c.input.includes(`${key}:`)) problems.push(`${id}: input never asks for the ${key} footer line`);
      for (const s of ["sample-good.md", "sample-bad.md"]) if (!existsSync(join(c.dir, s))) problems.push(`${id}: missing ${s}`);
    }
  }
  return problems;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const [cmd, id, file] = process.argv.slice(2);
  try {
    if (cmd === "list") {
      for (const i of caseIds()) { const r = loadCase(i).rubric; console.log(`${i.padEnd(42)} ${r.role.padEnd(20)} ${r.check}`); }
    } else if (cmd === "check") {
      const p = checkFixtures();
      if (p.length) { console.error(p.join("\n")); process.exit(1); }
      console.log(`ok: ${caseIds().length} cases, fixtures match cases.toml`);
    } else if (cmd === "prompt" && id) {
      process.stdout.write(promptFor(loadCase(id)));
    } else if (cmd === "score" && id && file) {
      const c = loadCase(id), out = readFileSync(file, "utf8");
      if (c.rubric.check === "judged") { process.stdout.write(judgePacket(c.rubric, out)); process.exit(3); }
      const r = scoreScripted(c.rubric, out);
      console.log(`${r.pass ? "PASS" : "FAIL"} ${id}${r.reasons.length ? "\n  " + r.reasons.join("\n  ") : ""}`);
      process.exit(r.pass ? 0 : 1);
    } else { console.error("usage: role-eval.mjs list | check | prompt <id> | score <id> <output-file>"); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(2); }
}
