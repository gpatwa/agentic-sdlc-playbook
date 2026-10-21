import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { checkStanding, checkFits } from "../standing-charter.mjs";
import { pickIntent } from "../pick-intent.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, "..", "..", "templates", "STANDING_CHARTER_TEMPLATE.md"), "utf8");
const today = new Date("2026-10-21T00:00:00Z");

const standing = `# Standing Charter: streak-seed small changes

> Header.

## 1. Class
- **S1.1 Repository:** \`streak-seed\`
- **S1.2 Intents:** \`intents/ready/\`
- **S1.3 Release tiers:** 1, 2

## 2. Budget (unit: peak context summed per spawn)
- **S2.1 Per run, hard cap:** 800k
- **S2.2 Per week, hard cap across all routine runs:** 2400k. Above it, routine runs stop.

## 3. Models
- **S3.1** all stages: \`claude-sonnet-5-5\`, effort high
- **S3.2** security review: \`claude-opus-5-5\`, effort high

## 4. Paths a routine run may change
- **S4.1** \`src/\`
- **S4.2** \`tests/\`
- **S4.3** \`docs/\`

## 5. End actions
- **S5.1 End action:** pull request
- **S5.2 Auto-merge:** tier 1
- **S5.3 Permission rules:** written to \`.claude/settings.local.json\`: \`Bash(npm test *)\`, \`Bash(gh pr create *)\`, \`Bash(gh pr merge *)\`

## 6. Validity
- **S6.1 Approved on:** 2026-10-20
- **S6.2 Expires on:** 2026-11-19
- **S6.3 Maximum runs:** 10
- **S6.4 Revocation:** deleting or renaming this file stops routine runs at the next stage boundary.

## 7. Never covered
1. Sends or submits anything on a user's behalf.
2. Deletes or overwrites shared state.
3. Deploys or releases anything with an external effect.
4. Changes a safety control: \`.agentic/SAFETY_INVARIANTS.md\`, hooks, permissions, deny lists, \`.claude/\`, CI.
5. Puts a model into a path that was deterministic, or adds a model.
6. Adds a data processor or a data commitment.
`;

const plan = `# Slice plan: streak label

Release tier: 1. Plan total: 400k.

## Files changed
- \`src/streak.js\`
- \`tests/streak.test.js\`

## Non-goals
- Deploy, posting, or any new model.

Never deploy, never send. INV-1 to INV-3 unchanged.
`;

describe("standing Charter: check", () => {
  test("the template itself is refused (placeholders)", () => {
    assert.ok(checkStanding(template, today).errors.some((e) => /placeholder/.test(e)));
  });
  test("a complete standing Charter passes", () => {
    assert.deepEqual(checkStanding(standing, today).errors, []);
  });
  test("tier 3 is refused", () => {
    assert.ok(checkStanding(standing.replace("tiers:** 1, 2", "tiers:** 1, 2, 3"), today).errors.some((e) => /tier 3/.test(e)));
  });
  test("an end action other than a pull request is refused", () => {
    assert.ok(checkStanding(standing.replace("End action:** pull request", "End action:** merge and deploy"), today).errors.some((e) => /S5\.1/.test(e)));
  });
  test("a path that reaches a safety control, permissions or CI is refused, and so is an open path", () => {
    for (const bad of [".claude/", ".github/workflows/", ".agentic/", "hooks/", "."]) {
      const r = checkStanding(standing.replace("**S4.3** `docs/`", `**S4.3** \`${bad}\``), today);
      assert.ok(r.errors.some((e) => /S4 path/.test(e)), `${bad}: ${r.errors.join("; ")}`);
    }
  });
  test("a model without an effort level is refused", () => {
    assert.ok(checkStanding(standing.replace("`claude-opus-5-5`, effort high", "`claude-opus-5-5`"), today).errors.some((e) => /no effort level/.test(e)));
  });
  test("expiry must exist, follow approval, be at most 90 days out, and not be past", () => {
    assert.ok(checkStanding(standing.replace("2026-11-19", "2027-06-01"), today).errors.some((e) => /at most 90/.test(e)));
    assert.ok(checkStanding(standing.replace("2026-11-19", "2026-10-01"), today).errors.some((e) => /not after/.test(e)));
    assert.ok(checkStanding(standing, new Date("2026-12-01T00:00:00Z")).errors.some((e) => /expired/.test(e)));
  });
  test("an edited Never covered list is refused", () => {
    assert.ok(checkStanding(standing.replace("3. Deploys or releases anything with an external effect.\n", ""), today).errors.some((e) => /item 3/.test(e)));
  });
  test("permission rules go to the local file and allow no wildcard inside a command", () => {
    assert.ok(checkStanding(standing.replace("settings.local.json", "settings.json"), today).errors.some((e) => /S5\.3 must/.test(e)));
    assert.ok(checkStanding(standing.replace("`Bash(npm test *)`", "`Bash(npm * x)`"), today).errors.some((e) => /allows any command/.test(e)));
  });
  test("auto-merge tier 1 needs tier 1 in the class", () => {
    assert.ok(checkStanding(standing.replace("tiers:** 1, 2", "tiers:** 2"), today).errors.some((e) => /S5\.2/.test(e)));
  });
});

describe("standing Charter: fits", () => {
  test("a plan inside the class fits, negated mentions (never deploy, INV unchanged, Non-goals) included", () => {
    const r = checkFits(standing, plan, { today });
    assert.equal(r.fits, true, r.reasons.join("; "));
  });
  test("an affirmative deploy, send, invariant change or processor does not fit", () => {
    for (const [extra, re] of [
      ["Deploy to production after merge.", /deploy/],
      ["Post the summary to the issue.", /sending/],
      ["Tighten INV-2 wording.", /safety invariant/],
      ["Add a new data processor for analytics.", /data processor/],
      ["Deploy it; this is not risky.", /deploy/],
    ]) {
      const r = checkFits(standing, plan.replace("Release tier: 1.", `Release tier: 1. ${extra}`), { today });
      assert.ok(r.reasons.some((x) => re.test(x)), `${extra}: ${r.reasons.join("; ")}`);
    }
  });
  test("a model the class does not list, a tier outside it, or a path outside it does not fit", () => {
    assert.ok(checkFits(standing, plan + "\nUses claude-haiku-5-5.", { today }).reasons.some((x) => /claude-haiku/.test(x)));
    assert.ok(checkFits(standing, plan.replace("Release tier: 1", "Release tier: 3"), { today }).reasons.some((x) => /tier 3/.test(x)));
    assert.ok(checkFits(standing, plan.replace("`tests/streak.test.js`", "`.github/workflows/ci.yml`"), { today }).reasons.some((x) => /outside the class/.test(x)));
  });
  test("a plan with no tier or no plan total does not fit (fail closed)", () => {
    assert.ok(checkFits(standing, plan.replace("Release tier: 1. ", ""), { today }).reasons.some((x) => /release tier/.test(x)));
    assert.ok(checkFits(standing, plan.replace("Plan total: 400k.", ""), { today }).reasons.some((x) => /plan total/.test(x)));
  });
  test("a plan above the per-run cap, or a class at its run cap, does not fit", () => {
    assert.ok(checkFits(standing, plan.replace("400k", "900k"), { today }).reasons.some((x) => /per-run cap/.test(x)));
    assert.ok(checkFits(standing, plan, { today, runsUsed: 10 }).reasons.some((x) => /run cap reached/.test(x)));
  });
  test("an expired or edited standing Charter means nothing fits", () => {
    assert.equal(checkFits(standing, plan, { today: new Date("2026-12-01T00:00:00Z") }).fits, false);
    assert.equal(checkFits(standing.replace("tiers:** 1, 2", "tiers:** 1, 2, 3"), plan, { today }).fits, false);
  });
});

describe("pick-intent", () => {
  const repo = () => {
    const d = mkdtempSync(join(tmpdir(), "pick-"));
    mkdirSync(join(d, "intents", "ready"), { recursive: true });
    mkdirSync(join(d, "runs"), { recursive: true });
    return d;
  };
  test("picks the first ready intent that has no run folder", () => {
    const d = repo();
    writeFileSync(join(d, "intents", "ready", "b-second.md"), "# b");
    writeFileSync(join(d, "intents", "ready", "a-first.md"), "# a");
    mkdirSync(join(d, "runs", "a-first"));
    writeFileSync(join(d, "runs", "a-first", "STATE.md"), "- **Status:** done\n");
    const r = pickIntent(d);
    assert.equal(r.status, "picked");
    assert.equal(r.slice, "b-second");
    rmSync(d, { recursive: true });
  });
  test("refuses to start a second run while one is open", () => {
    const d = repo();
    writeFileSync(join(d, "intents", "ready", "x.md"), "# x");
    mkdirSync(join(d, "runs", "older"));
    writeFileSync(join(d, "runs", "older", "STATE.md"), "- **Status:** in-progress\n");
    assert.equal(pickIntent(d).status, "open");
    rmSync(d, { recursive: true });
  });
  test("nothing ready is reported, and runs already used under a standing Charter are counted by its sha256", () => {
    const d = repo();
    const sha = createHash("sha256").update(standing).digest("hex");
    for (const [name, first] of [["r1", sha], ["r2", sha], ["r3", "another"]]) {
      mkdirSync(join(d, "runs", name));
      writeFileSync(join(d, "runs", name, "STATE.md"), "- **Status:** done\n");
      writeFileSync(join(d, "runs", name, "STANDING_FIT.md"), `${first}\nfits\n`);
    }
    const r = pickIntent(d, standing);
    assert.equal(r.status, "none");
    assert.equal(r.runsUsed, 2);
    rmSync(d, { recursive: true });
  });
});
