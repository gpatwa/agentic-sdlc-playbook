// The role-eval scorer must tell a known-good output from a known-bad one, or a model-change check measures nothing.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { EVAL_DIR, caseIds, loadCase, specIds, checkFixtures, scoreScripted, judgePacket, footerOf, promptFor } from "../role-eval.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "role-eval.mjs");

describe("role-eval: fixtures", () => {
  test("every case in cases.toml has a fixture, and the reverse", () => {
    assert.deepEqual(caseIds(), specIds());
    assert.equal(caseIds().length, 11);
    assert.deepEqual(checkFixtures(), []);
  });
  test("five architect cases and six QA cases; three scripted, eight judged", () => {
    const rs = caseIds().map((i) => loadCase(i).rubric);
    assert.equal(rs.filter((r) => r.role === "software-architect").length, 5);
    assert.equal(rs.filter((r) => r.role === "qa-evidence").length, 6);
    assert.equal(rs.filter((r) => r.check === "scripted").length, 3);
    assert.equal(rs.filter((r) => r.check === "judged").length, 8);
  });
  test("a broken fixture directory is caught: missing spec case, orphan fixture, an input that never asks for its footer line", () => {
    const d = mkdtempSync(join(tmpdir(), "role-eval-"));
    const mk = (id, rubric, input, extra = {}) => { mkdirSync(join(d, id), { recursive: true }); writeFileSync(join(d, id, "rubric.json"), JSON.stringify(rubric)); writeFileSync(join(d, id, "input.md"), input); for (const [f, t] of Object.entries(extra)) writeFileSync(join(d, id, f), t); };
    mk("scripted-no-ask", { id: "scripted-no-ask", role: "qa-evidence", check: "scripted", footer: { VERDICT: { equals: "FAIL" } } }, "Decide the result.", { "sample-good.md": "x", "sample-bad.md": "y" });
    mk("orphan", { id: "orphan", role: "qa-evidence", check: "judged" }, "Task");
    const p = checkFixtures({ fixDir: d, spec: ["scripted-no-ask", "only-in-spec"] }).join("\n");
    rmSync(d, { recursive: true });
    assert.match(p, /spec case "only-in-spec" has no fixture/);
    assert.match(p, /fixture "orphan" is not in cases\.toml/);
    assert.match(p, /input never asks for the VERDICT footer line/);
  });
});

describe("role-eval: scripted cases separate known-good from known-bad", () => {
  for (const id of ["qa-failed-by-one-still-fails", "qa-report-end-to-end-beside-the-gate", "qa-status-claim-before-the-gate"]) {
    test(id, () => {
      const c = loadCase(id);
      const good = readFileSync(join(c.dir, "sample-good.md"), "utf8");
      const bad = readFileSync(join(c.dir, "sample-bad.md"), "utf8");
      assert.equal(scoreScripted(c.rubric, good).pass, true, scoreScripted(c.rubric, good).reasons.join("; "));
      const b = scoreScripted(c.rubric, bad);
      assert.equal(b.pass, false);
      assert.ok(b.reasons.length > 0);
    });
  }
  test("a missing footer line fails, and the last footer line wins", () => {
    const c = loadCase("qa-failed-by-one-still-fails");
    assert.equal(scoreScripted(c.rubric, "no footer at all").pass, false);
    assert.deepEqual(footerOf("VERDICT: PASS\nthinking again\nVERDICT: FAIL"), { VERDICT: "FAIL" });
    assert.equal(scoreScripted(c.rubric, "VERDICT: PASS\nACTIONS: stop\nVERDICT: FAIL\nACTIONS: stop, record-near-miss").pass, true);
  });
  test("an excluded action fails the case even when the verdict is right", () => {
    const c = loadCase("qa-failed-by-one-still-fails");
    const r = scoreScripted(c.rubric, "VERDICT: FAIL\nACTIONS: stop, record-near-miss, rerun");
    assert.equal(r.pass, false);
    assert.match(r.reasons.join(";"), /must not contain "rerun"/);
  });
  test("the end-to-end case needs the figure in the text, not only the footer", () => {
    const c = loadCase("qa-report-end-to-end-beside-the-gate");
    assert.equal(scoreScripted(c.rubric, "Gates met.\nREPORTED: gate-result, end-to-end-figure").pass, false);
    assert.equal(scoreScripted(c.rubric, "Gates met; recall 79.2%.\nREPORTED: gate-result, end-to-end-figure").pass, true);
  });
});

describe("role-eval: judged cases and the command line", () => {
  test("a judged case yields a packet with the rubric and the output's hash, and exit code 3", () => {
    const r = spawnSync("node", [cli, "score", "arch-baseline-before-cause", join(EVAL_DIR, "fixtures", "qa-failed-by-one-still-fails", "sample-good.md")], { encoding: "utf8" });
    assert.equal(r.status, 3);
    assert.match(r.stdout, /MUST DO: Require a baseline/);
    assert.match(r.stdout, /OUTPUT sha256: [0-9a-f]{64}/);
    assert.match(judgePacket({ id: "x", role: "r", must_do: "a", must_not: "b" }, "text"), /--- OUTPUT ---\ntext\n--- END OUTPUT ---/);
  });
  test("score exits 0 on a pass and 1 on a fail; check passes; list shows eleven rows; prompt names the role's brief", () => {
    const d = join(EVAL_DIR, "fixtures", "qa-status-claim-before-the-gate");
    assert.equal(spawnSync("node", [cli, "score", "qa-status-claim-before-the-gate", join(d, "sample-good.md")]).status, 0);
    assert.equal(spawnSync("node", [cli, "score", "qa-status-claim-before-the-gate", join(d, "sample-bad.md")]).status, 1);
    assert.match(execFileSync("node", [cli, "check"], { encoding: "utf8" }), /^ok: 11 cases/);
    assert.equal(execFileSync("node", [cli, "list"], { encoding: "utf8" }).trim().split("\n").length, 11);
    assert.match(promptFor(loadCase("arch-seen-set-is-not-evidence")), /agents\/software-architect\.md/);
    assert.equal(spawnSync("node", [cli, "score", "no-such-case", "x"]).status, 2);
  });
  test("the tool never calls a model or the network", () => {
    const src = readFileSync(cli, "utf8");
    assert.ok(!/\bfetch\(|node:https?|node:net|child_process/.test(src));
  });
});
