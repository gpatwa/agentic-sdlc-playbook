import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, chmodSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parsePasted, parseGithubComment, localFindings, matchLocal, renderRecord, parseRecord, tally, recordMode } from "../external-review.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "external-review.mjs");

// The first real input: Codex's review of aveto-support pull request 5 (2026-10-22), pasted by the owner.
const CODEX_PR5 = `Found one actionable issue in PR #5:

* [P2] Reserve budget for retries before sending them. [pipeline.py, line 254](https://github.com/gpatwa/aveto-support/pull/5/files) reserves one attempt, but the adapter can make two. Settlement then charges both, allowing spend beyond the daily cap. A deterministic reproduction with a $0.030000 cap settled $0.039342. Reserve both attempts upfront and refund unused capacity, or require budget admission before retrying.

Validation: 637 passed, 12 deselected. No live model calls made; review not posted to GitHub.
`;

const LOCAL = `# code review
| id | severity | file:line | what | disposition |
|---|---|---|---|---|
| CR-1 | Important | aveto_service/limits.py:180 | reserve closes the day | fixed |
| CR-2 | Important | aveto_service/pipeline.py:269 | failed call keeps the full reservation | fixed |
| CR-8 | Nit | aveto_service/app.py:154 | health | intentional |
`;

describe("external review collector", () => {
  test("parses the real Codex review of PR 5", () => {
    const f = parsePasted(CODEX_PR5);
    assert.equal(f.length, 1);
    assert.equal(f[0].p, "P2");
    assert.equal(f[0].file, "pipeline.py");
    assert.equal(f[0].line, "254");
    assert.match(f[0].claim, /Reserve budget for retries/);
    assert.match(f[0].claim, /\$0\.039342/);
    assert.ok(!f[0].claim.includes("|"));
  });

  test("parses several findings, continuation lines and a missing line number", () => {
    const f = parsePasted("* [P0] First. [a.py, line 3](u) body one\n  continues here\n- [P1] Second. [docs/x.md](u) body two\n\nValidation: fine\n");
    assert.equal(f.length, 2);
    assert.match(f[0].claim, /continues here/);
    assert.deepEqual([f[1].file, f[1].line], ["docs/x.md", ""]);
    assert.deepEqual(parsePasted("Found no actionable issues."), []);
  });

  test("reads a GitHub comment: priority from the first P0-P3, P? when none, inline location", () => {
    assert.deepEqual(parseGithubComment({ body: "**P1** Null deref in handler\nmore", path: "src/a.js", line: 12 }), { p: "P1", file: "src/a.js", line: "12", claim: "P1 Null deref in handler more" });
    assert.equal(parseGithubComment({ body: "looks risky" }).p, "P?");
    assert.equal(parseGithubComment({ body: "P2 x", path: "a", original_line: 7 }).line, "7");
  });

  test("the local-review match is by file and nearby line, and is marked as a heuristic", () => {
    const local = localFindings(LOCAL);
    assert.equal(local.length, 3);
    // CR-2 is at :269. Codex's finding is at :254, 15 lines away, so it is "possible": a person
    // decides whether it is the same defect (here it is not: CR-2 is how retries are charged,
    // Codex's is that they are not reserved), and changes the cell to `no`.
    assert.equal(matchLocal({ file: "pipeline.py", line: "254" }, local), "possible (CR-2)");
    assert.equal(matchLocal({ file: "pipeline.py", line: "260" }, local), "possible (CR-2)");
    assert.equal(matchLocal({ file: "pipeline.py", line: "300" }, local), "no");
    assert.equal(matchLocal({ file: "other.py", line: "1" }, local), "no");
    assert.equal(matchLocal({ file: "pipeline.py", line: "260" }, null), "unknown");
  });

  test("a record round-trips, and an empty review says 0 findings", () => {
    const text = renderRecord({ pr: "gpatwa/aveto-support#5", source: "a pasted review", date: "2026-10-22", findings: parsePasted(CODEX_PR5), local: localFindings(LOCAL) });
    const rows = parseRecord(text);
    assert.equal(rows.length, 1);
    assert.deepEqual([rows[0].p, rows[0].disposition, rows[0].alsoLocal], ["P2", "open", "possible (cr-2)"]);
    assert.match(renderRecord({ pr: "x", source: "s", date: "d", findings: [] }), /0 findings\./);
  });

  test("the tally applies the bars: real = fixed or intentional; precision over judged; wrong must-fix = P0/P1 rejected", () => {
    const rec = (rows) => ({ name: "r.md", text: `${"| id | P | file:line | claim | disposition | also |\n|---|---|---|---|---|---|\n"}${rows.join("\n")}\n` });
    const row = (id, p, disp, local) => `| ${id} | ${p} | a.py:1 | claim | ${disp} | ${local} |`;
    // nothing judged yet: precision unknown, bars provisional
    let t = tally([rec([row("c01", "P2", "open", "no")])]);
    assert.equal(t.judged, 0);
    assert.equal(t.bars[1][1], false);
    // one real new, one rejected P2: precision 50% fails, no wrong must-fix, new value met
    t = tally([rec([row("c01", "P2", "fixed abc123", "no"), row("c02", "P2", "rejected not a bug", "no")])]);
    assert.deepEqual([t.real, t.newValue, t.wrongMustFix], [1, 1, 0]);
    assert.equal(t.bars[0][1], true);
    assert.equal(t.bars[1][1], false);
    // 3 of 4 real = 75%: precision met; a rejected P1 is a wrong must-fix
    t = tally([rec([row("c01", "P1", "fixed x", "no"), row("c02", "P2", "intentional y", "possible (CR-1)"), row("c03", "P2", "fixed z", "no"), row("c04", "P1", "rejected w", "no")])]);
    assert.equal(t.bars[1][1], true);
    assert.equal(t.bars[2][1], false);
    // accepted (correct, filed to fix later) counts as real
    t = tally([rec([row("c01", "P2", "accepted https://github.com/o/r/issues/6", "no")])]);
    assert.deepEqual([t.real, t.newValue], [1, 1]);
    // an intentional finding the local review also had is real but not new
    t = tally([rec([row("c01", "P2", "intentional y", "possible (CR-1)")])]);
    assert.equal(t.newValue, 0);
    assert.equal(t.bars[0][1], false);
    // incidents break the discipline bar
    assert.equal(tally([rec([])], { incidents: 1 }).bars[3][1], false);
  });

  test("a record carries its mode and path, and the tally reports the independence bar and findings by mode", () => {
    const mk = (mode, rows) => ({ name: `${mode}.md`, text: renderRecord({ pr: "o/r#1", source: "s", date: "d", findings: rows, mode, path: "A" }) });
    const f = [{ p: "P2", file: "a.py", line: "1", claim: "x" }];
    assert.equal(recordMode(mk("blind", f).text), "blind");
    assert.equal(recordMode(mk("informed", f).text), "informed");
    assert.equal(recordMode("no mode line here"), "unspecified");
    assert.match(mk("blind", f).text, /Mode: blind\. Path: A\./);
    let t = tally([mk("informed", f)]);
    assert.equal(t.bars[4][1], false); // no blind review yet
    assert.deepEqual(t.byMode, { informed: 1 });
    t = tally([mk("informed", f), mk("blind", f)]);
    assert.equal(t.bars[4][1], true);
    assert.deepEqual(t.byMode, { informed: 1, blind: 1 });
  });

  test("parses the numbered format Codex used on 2026-10-23 (the second review of PR 5)", () => {
    const text = [
      "Reviewed local head `dbc8b81`. **96 existing tests passed.**",
      "",
      "1. **P1 — Restarting bypasses both spend and visitor limits.** [aveto_service/pipeline.py:181](/Users/x/aveto_service/pipeline.py:181), with scale-to-zero configured at [infra/main.bicep:220](/Users/x/infra/main.bicep:220). Each process creates fresh rate limiters.",
      "",
      "2. **P2 — Retries spend beyond the admitted reservation.** [aveto_service/pipeline.py:254](/Users/x/aveto_service/pipeline.py:254), [aveto_service/anthropic_judge.py:136](/Users/x/a.py:136). Admission reserves one attempt.",
    ].join("\n");
    const f = parsePasted(text);
    assert.equal(f.length, 2);
    assert.deepEqual([f[0].p, f[0].file, f[0].line], ["P1", "aveto_service/pipeline.py", "181"]);
    assert.match(f[0].claim, /Restarting bypasses both spend and visitor limits/);
    assert.deepEqual([f[1].p, f[1].file, f[1].line], ["P2", "aveto_service/pipeline.py", "254"]);
    assert.ok(!f[0].claim.includes("|"));
  });

  test("a duplicate is neither judged nor real, so a repeat finding does not inflate precision", () => {
    const rec = (rows) => ({ name: "r.md", text: `Mode: informed. Path: A.\n\n| id | P | file:line | claim | disposition | also |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n` });
    const row = (id, p, disp, local) => `| ${id} | ${p} | a.py:1 | claim | ${disp} | ${local} |`;
    const first = rec([row("c01", "P2", "accepted https://x/6", "no")]);
    const second = rec([row("c01", "P1", "intentional CR-3", "yes (CR-3)"), row("c02", "P2", "duplicate of first (x/6)", "no")]);
    const t = tally([first, second]);
    assert.deepEqual([t.total, t.judged, t.real, t.duplicates, t.open], [3, 2, 2, 1, 0]);
    assert.equal(t.precision, 1);
    assert.equal(t.newValue, 1); // the duplicate is not counted again
  });

  test("the command line: parse writes a record, tally reads it, and neither needs the network", () => {
    const d = mkdtempSync(join(tmpdir(), "extrev-"));
    writeFileSync(join(d, "codex.md"), CODEX_PR5);
    const out = join(d, "record.md");
    const p = spawnSync(process.execPath, [cli, "parse", join(d, "codex.md"), "--pr", "aveto-support#5", "--out", out]);
    assert.equal(p.status, 0, p.stderr.toString());
    const t = spawnSync(process.execPath, [cli, "tally", out]);
    assert.equal(t.status, 0);
    assert.match(t.stdout.toString(), /findings 1 \(1 open, 0 judged, 0 real, 0 duplicate\)/);
    assert.match(t.stdout.toString(), /provisional/);
    assert.equal(spawnSync(process.execPath, [cli]).status, 2);
    rmSync(d, { recursive: true });
  });

  test("draft reads a pull request through gh, keeps only the bot's comments, and never writes to GitHub", () => {
    const d = mkdtempSync(join(tmpdir(), "extrev-gh-"));
    const bin = join(d, "bin"), fx = join(d, "fx");
    mkdirSync(bin); mkdirSync(fx);
    copyFileSync(join(here, "fixtures", "fake-gh"), join(bin, "gh")); chmodSync(join(bin, "gh"), 0o755);
    const put = (slug, v) => writeFileSync(join(fx, `${slug}.json`), JSON.stringify(v));
    put("repos_o_r_pulls_5_reviews", [{ user: { login: "chatgpt-codex-connector[bot]" }, body: "Found issues" }, { user: { login: "someone" }, body: "P1 not the bot" }]);
    put("repos_o_r_pulls_5_comments", [{ user: { login: "chatgpt-codex-connector[bot]" }, body: "P1 Badge: leaks a token", path: "src/a.js", line: 9 }, { user: { login: "human" }, body: "P0 ignore" }]);
    put("repos_o_r_issues_5_comments", []);
    const r = spawnSync(process.execPath, [cli, "draft", "o/r", "5"], { env: { ...process.env, PATH: `${bin}:${dirname(process.execPath)}:${process.env.PATH}`, FAKE_GH_FIXTURES: fx } });
    assert.equal(r.status, 0, r.stderr.toString());
    const text = r.stdout.toString();
    assert.match(text, /src\/a\.js:9/);
    assert.match(text, /leaks a token/);
    assert.ok(!text.includes("ignore") && !text.includes("not the bot"));
    rmSync(d, { recursive: true });
  });
});
