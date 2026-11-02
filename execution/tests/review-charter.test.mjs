// The review-mode Charter template (templates/REVIEW_CHARTER_TEMPLATE.md) fixes what an assessment may never do and asks the
// owner for the rest. These tests pin that the filled example passes the same check as any Charter, that the unfilled template
// does not, and that the lines that matter most for an unfamiliar codebase (what data it is, who receives it) cannot be left blank.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkCharter } from "../charter-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const template = readFileSync(join(root, "templates", "REVIEW_CHARTER_TEMPLATE.md"), "utf8");
const example = readFileSync(join(root, "examples", "review-charter-hr-timeoff-agent.md"), "utf8");

describe("review-mode Charter", () => {
  test("the filled example passes charter-check", () => {
    const r = checkCharter(example);
    assert.deepEqual(r.errors, []);
    assert.equal(r.ok, true);
  });
  test("the unfilled template fails on its placeholders", () => {
    const r = checkCharter(template);
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /placeholder/.test(e)));
  });
  test("a blank data classification or processor line is refused", () => {
    for (const id of ["C4.D", "C4.1"]) {
      const re = new RegExp(`(- \\*\\*${id.replace(".", "\\.")}[^:\\n]*:?\\*\\*)[^\\n]*`);
      assert.match(example, re, `${id} exists in the example`);
      const r = checkCharter(example.replace(re, "$1"));
      assert.equal(r.ok, false, `${id} left blank must fail`);
    }
  });
  test("an assessment Charter with no data classification line at all is refused", () => {
    const r = checkCharter(example.replace(/- \*\*C4\.D[^\n]*\n/, ""));
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /C4\.D/.test(e)));
  });
  test("what an assessment may never do is fixed in the template, and the example keeps it", () => {
    const flat = (t) => t.replace(/\n>\s?/g, " ");
    for (const must of [/\*\*C5\.0\*\* None/, /\*\*C8\.3 Irreversible actions allowed \(rules 1 to 3\):\*\* none/, /Do not open a pull request on the target repository/, /never "certified" or "compliant"/, /must pass before the report is trusted/]) {
      assert.match(flat(template), must);
      assert.match(flat(example), must);
    }
  });
  test("the example and the template do not drift in structure", () => {
    const ids = (t) => [...t.matchAll(/\*\*(C\d\.[\w]+)/g)].map((m) => m[1]);
    const t = new Set(ids(template));
    for (const id of ids(example)) assert.ok(t.has(id) || id === "C3.R", `${id} in the example but not the template`);
  });
});
