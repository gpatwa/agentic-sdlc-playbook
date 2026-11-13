import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildDocs, parseStages, pendingApproval, openItems } from "../board-doc.mjs";

const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "board-doc.mjs");
const NOW = new Date("2026-11-13T10:00:00Z");

const STATE = (status, extra = "") => `# Slice State — s1

- **Ask:** make the thing correct (issues 1, 2)
- **Current stage:** 3 Build
- **Status:** ${status}
- **Started:** 2026-11-13T08:00Z  ·  **Updated:** 2026-11-13T09:30Z

## Stages

| Stage | Owner | Status | Artefact | Gate |
|-------|-------|--------|----------|------|
| Intake | Orchestrator | done | runs/s1/00-slice-plan.md | n/a |
| 1 Scope | Engineering Manager | done: one slice accepted, about 11 files | — | — |
| 2 Build | Backend Architect | in-progress | — | — |
| ... | ... | pending | — | — |

## Approvals

| Action | Rule | Requested | Decision | Approver | When (UTC) | Record |
|--------|------|-----------|----------|----------|-----------|--------|
| Charter | 3 | yes | approved | A | 2026-11-13T08:10Z | runs/s1/APPROVAL_RECORD-1.md |
${extra}
## Budget

- **Budget:** 400k tokens  ·  **Depth:** standard
- **Hard cap:** 800k tokens
- **Spent:** 120k (30%)  ·  **Remaining:** 280k
`;

describe("board-doc", () => {
  test("stages: the table under ## Stages, one-phrase verdicts, no placeholder rows", () => {
    const s = parseStages(STATE("in-progress"));
    assert.deepEqual(s.map((x) => x.name), ["Intake", "1 Scope", "2 Build"]);
    assert.equal(s[1].verdict, "done", "the sentence after the colon is dropped");
    assert.equal(s[2].verdict, "in-progress");
  });

  test("a running slice: numbers from the Budget block, nothing waiting", () => {
    const { run, session } = buildDocs({ slice: "s1", state: STATE("in-progress"), track: "improve", repo: "r", now: NOW });
    assert.equal(run.result, "running");
    assert.equal(run.spent, 120000);
    assert.equal(run.plan, 400000);
    assert.equal(run.cap, 800000);
    assert.equal(run.waiting, undefined);
    assert.equal(run.updatedAt, "2026-11-13T09:30:00.000Z");
    assert.equal(session.state, "running");
    assert.equal(session.status, "Stage: 3 Build");
    assert.equal(run.records, "runs/s1");
  });

  test("a hard cap written as prose is still read", () => {
    const state = STATE("in-progress").replace("- **Hard cap:** 800k tokens\n", "Ceiling 700k (C2.2); hard cap 1,200k (C2.3).\n");
    assert.equal(buildDocs({ slice: "s1", state, track: "built", repo: "r", now: NOW }).run.cap, 1200000);
  });

  test("blocked on approval: names the pending action, points at the session, posts no approval words", () => {
    const row = "| Deploy to production | 3 | yes | PENDING | — | — | — |\n";
    const state = STATE("blocked-on-approval", row);
    assert.equal(pendingApproval(state), "Deploy to production (rule 3)");
    const { run, session } = buildDocs({ slice: "s1", state, track: "built", repo: "r", now: NOW });
    assert.equal(run.result, "waiting on you");
    assert.match(run.waiting, /Approval pending: Deploy to production \(rule 3\)\. Answer it in the session/);
    assert.equal(session.state, "waiting");
    assert.ok(!JSON.stringify([run, session]).includes("APPROVAL_RECORD"), "no approval record text is posted");
  });

  test("done with an end review: counts the numbered items, and says some may be closed", () => {
    const er = "# End review\n\n## Blocked on you (decisions)\n\n1. one\n2. two\n3. three\n\n## Misses\n\n1. not counted\n";
    assert.equal(openItems(er), 3);
    const { run, session } = buildDocs({ slice: "s1", state: STATE("done"), endReview: er, track: "built", repo: "r", now: NOW });
    assert.equal(run.result, "done");
    assert.match(run.waiting, /lists 3 items for you; some may already be closed/);
    assert.equal(session.state, "to-check");
  });

  test("never copies contents, commands or secrets: only the fields the protocol lists", () => {
    const state = STATE("in-progress") + "\nsk-ant-api03-SECRETVALUE `rm -rf /`\n";
    const text = JSON.stringify(buildDocs({ slice: "s1", state, track: "improve", repo: "r", now: NOW }));
    assert.ok(!text.includes("SECRETVALUE") && !text.includes("rm -rf"));
    const { run } = buildDocs({ slice: "s1", state, track: "improve", repo: "r", now: NOW });
    assert.deepEqual(Object.keys(run).sort(), ["cap", "name", "plan", "records", "repo", "result", "spent", "stages", "summary", "track", "updatedAt"]);
  });

  test("the command line writes the two files and refuses a bad track or a missing state file", () => {
    const d = mkdtempSync(join(tmpdir(), "board-")); const run = join(d, "runs", "s1"); mkdirSync(run, { recursive: true });
    writeFileSync(join(run, "STATE.md"), STATE("in-progress"));
    const ok = spawnSync(process.execPath, [cli, run, "--track", "built", "--repo", "r", "--records-url", "https://example.test/s1"], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stderr);
    assert.equal(JSON.parse(readFileSync(join(run, "BOARD_RUN.json"), "utf8")).recordsUrl, "https://example.test/s1");
    assert.equal(JSON.parse(readFileSync(join(run, "BOARD_SESSION.json"), "utf8")).kind, "run");
    assert.equal(spawnSync(process.execPath, [cli, run, "--track", "nope", "--repo", "r"], { encoding: "utf8" }).status, 2);
    assert.equal(spawnSync(process.execPath, [cli, join(d, "missing"), "--track", "built", "--repo", "r"], { encoding: "utf8" }).status, 2);
    rmSync(d, { recursive: true, force: true });
  });
});
