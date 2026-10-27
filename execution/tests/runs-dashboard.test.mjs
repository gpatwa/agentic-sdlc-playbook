// The run dashboard reads records and renders a page. It must never invent a figure, never carry a script,
// and never let a record's text become markup.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { tokens, parseState, parseEndReview, parseEvents, collect, render } from "../runs-dashboard.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "runs-dashboard.mjs");
const SHA = "a".repeat(40);
const NOW = "2026-10-27T12:00:00Z";

const fixture = (runs) => {
  const root = mkdtempSync(join(tmpdir(), "runs-dash-"));
  for (const [slice, files] of Object.entries(runs)) {
    mkdirSync(join(root, "runs", slice), { recursive: true });
    for (const [f, c] of Object.entries(files)) writeFileSync(join(root, "runs", slice, f), c);
  }
  return root;
};
const hash = "b".repeat(64);
const done = {
  "STATE.md": "# S\n\n- **Status:** done (pull request 7 merged 2026-10-20)\n- **Budget:** 400k tokens  ·  **Depth:** standard\n- **Hard cap:** 800k\n- **Spent:** 581k (73% of the hard cap)\n",
  "trace.json": JSON.stringify({ tier: 3, started: "2026-10-27", telemetrySource: "self-reported", stages: [{}, {}] }),
  "END_REVIEW.md": `# End\n\nCharter sha256 \`${hash}\`, approved by A Person 2026-10-26T20:08Z.\n\n## OPEN items for the owner\n1. one\n2. two\n\n## Questions asked of the human after the Charter: 0\n`,
  "events-verify-output.txt": "/x/y.jsonl: chain intact; 1,043 lines; head f3bb\n",
};

describe("parsers", () => {
  test("tokens reads k, M and thousands separators", () => {
    assert.equal(tokens("2,773k"), 2773000);
    assert.equal(tokens("0.6M"), 600000);
    assert.equal(tokens("1130k tokens"), 1130000);
    assert.equal(tokens("n/a"), null);
  });
  test("state: status word, note, budget, ceiling, hard cap, spent", () => {
    const s = parseState("- **Status:** done (PR opened; owner merges)\n- **Budget:** 2600k plan · ceiling 3400k (stop)\n- **Hard cap:** 800k\n- **Spent:** 2,773k (82%)\n");
    assert.deepEqual([s.status, s.note, s.budget, s.ceiling, s.hardCap, s.spent], ["done", "PR opened; owner merges", 2600000, 3400000, 800000, 2773000]);
  });
  test("a state file with nothing recognisable gives nulls, not guesses", () => {
    const s = parseState("# nothing here");
    assert.deepEqual([s.status, s.budget, s.spent, s.hardCap], [null, null, null, null]);
  });
  test("end review: full and abbreviated hash, approval date, pull request, asked, open items", () => {
    const e = parseEndReview(`sha256 \`${hash}\`, approved by X 2026-10-26T20:00Z\nsee https://github.com/o/r/pull/12\n## Questions asked of the human after the Charter: 2\n## OPEN items\n1. a\n2. b\n3. c\n## Next\n1. not counted\n`);
    assert.deepEqual([e.charter, e.approved, e.pr, e.asked, e.open], [hash, "2026-10-26", "12", 2, 3]);
    assert.equal(parseEndReview("sha256 `afc984d1…aefe4`, approved 2026-10-23T07:18Z").charter, "afc984d1");
  });
  test("asked can sit in the first line of the section body", () => {
    assert.equal(parseEndReview("## Questions asked of the human after the Charter\n**0 that I know of.** note\n").asked, 0);
  });
  test("events: intact with a line count; a break or tamper word is not intact", () => {
    assert.deepEqual(parseEvents("x: chain intact; 1,043 lines; head f3"), { ok: true, lines: "1,043" });
    assert.equal(parseEvents("x: chain BROKEN at line 4").ok, false);
    assert.equal(parseEvents(null), null);
  });
});

describe("collect and render", () => {
  test("a slice dir with no STATE.md is skipped; a missing runs/ dir is an error", () => {
    const root = fixture({ a: done, noState: { "x.md": "x" } });
    assert.deepEqual(collect(root).map((r) => r.slice), ["a"]);
    assert.throws(() => collect(mkdtempSync(join(tmpdir(), "runs-empty-"))), /no runs\/ directory/);
    rmSync(root, { recursive: true, force: true });
  });

  test("the page shows what the records state and 'not recorded' for what they do not", () => {
    const root = fixture({ full: done, bare: { "STATE.md": "# S\n\n- **Status:** in-progress\n" } });
    const html = render(collect(root), { repo: "o/r", sha: SHA, now: NOW });
    assert.match(html, /<title>Aveto runs/);
    assert.match(html, /581k of 400k/);
    assert.match(html, /145% of plan/);
    assert.match(html, /800k <span class="muted">hard cap/);
    assert.match(html, new RegExp(`<code>${hash.slice(0, 12)}</code>`));
    assert.match(html, /intact · 1,043 lines/);
    assert.match(html, /href="https:\/\/github\.com\/o\/r\/pull\/7">#7/);
    assert.match(html, /tree\/a{40}\/runs\/full/);
    const bare = html.split("<tr>").find((r) => r.includes("runs/bare"));
    assert.ok((bare.match(/not recorded/g) || []).length >= 6, "a run with no records shows not recorded, never a guess");
    assert.match(bare, /no event log/);
    assert.match(html, /generated 2026-10-27/);
    rmSync(root, { recursive: true, force: true });
  });

  test("no script, no external resource, no form: a read-only page", () => {
    const root = fixture({ full: done });
    const html = render(collect(root), { repo: "o/r", sha: SHA, now: NOW });
    assert.doesNotMatch(html, /<script|<form|<iframe|<input|<button|\son[a-z]+\s*=|src=|@import|url\(/i);
    assert.doesNotMatch(html, /https?:\/\/(?!github\.com\/o\/r)/, "only links into the repo");
    rmSync(root, { recursive: true, force: true });
  });

  test("record text cannot become markup", () => {
    const evil = { ...done, "STATE.md": '# S\n\n- **Status:** done (<img src=x onerror=alert(1)>)\n- **Budget:** 100k\n- **Spent:** 50k\n' };
    const root = fixture({ "x<script>y": evil });
    const html = render(collect(root), { repo: "o/r", sha: SHA, now: NOW });
    assert.doesNotMatch(html, /<img src=x|<script>y/);
    assert.match(html, /&lt;img src=x/);
    rmSync(root, { recursive: true, force: true });
  });

  test("a broken event chain is shown as not intact, in red", () => {
    const root = fixture({ r: { ...done, "events-verify-output.txt": "x: chain BROKEN at line 9\n" } });
    assert.match(render(collect(root), { repo: "o/r", sha: SHA, now: NOW }), /chain not intact/);
    rmSync(root, { recursive: true, force: true });
  });

  test("the same input renders the same bytes", () => {
    const root = fixture({ a: done });
    const a = render(collect(root), { repo: "o/r", sha: SHA, now: NOW });
    const b = render(collect(root), { repo: "o/r", sha: SHA, now: NOW });
    assert.equal(a, b);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("command line", () => {
  test("writes the page with --out and refuses to run without --repo", () => {
    const root = fixture({ a: done });
    const out = join(root, "page.html");
    execFileSync("node", [cli, root, "--repo", "o/r", "--sha", SHA, "--now", NOW, "--out", out], { stdio: "pipe" });
    assert.match(execFileSync("cat", [out], { encoding: "utf8" }), /Every run, read from its own records/);
    assert.throws(() => execFileSync("node", [cli, root], { stdio: "pipe" }), /usage/);
    rmSync(root, { recursive: true, force: true });
  });
});
