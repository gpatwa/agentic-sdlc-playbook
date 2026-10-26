import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkCharter } from "../charter-check.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, "..", "..", "templates", "CHARTER_TEMPLATE.md"), "utf8");

const complete = `# Charter: demo-slice

> Header text.

## 1. Scope
- **C1.1 Intent:** \`runs/demo/intent.md\`, sha256 \`abc\`
- **C1.2 Plan:** \`runs/demo/00-slice-plan.md\`, sha256 \`def\`
- **C1.3 Non-goals:** no drafting, no deploy

## 2. Budget (unit: peak context summed per spawn)
- **C2.1 Plan total:** 2100k
- **C2.2 Ceiling:** 2700k. Above it the run continues and sends a notice.
- **C2.3 Hard cap:** 3100k. Above it the run stops.

## 3. Models (rule 5)
- **C3.1** judge: \`claude-sonnet-5-5\`, effort high, the operator's session
- **C3.R Review rescore:** unchanged since the last rescore on 2026-10-17

## 4. Data processors (rule 6)
- **C4.0** None beyond those already approved: APPROVAL_RECORD-3, APPROVAL_RECORD-6.

## 5. Safety controls (rule 4)
- **C5.1** \`.agentic/SAFETY_INVARIANTS.md\` INV-5: may gain one sentence naming what the operator's session sends, as measured; nothing removed
- **C5.2** \`.claude/agents/judge.md\`: may only add names to \`disallowedTools\`, ending in \`mcp__*\`

## 6. Prerequisites (set once in the setup phase, each with its dry run)
| id | What | Why | Dry run that proves it |
|---|---|---|---|
| C6.P | allow rules in \`.claude/settings.local.json\`: \`Bash(uv run pytest *)\`, \`Bash(git push origin slice/demo)\` | every stage | each run once in setup, no prompt |
| C6.1 | folder shortcut to the worktree | stage 5 | ls the shortcut, expect the agents dir |

## 7. Depth (may not be lowered)
- **C7.1** Security Review: adversarial
- **C7.2** Release Gate tier: 3

## 8. Outcomes decided now
- **C8.1 If a pre-registered check fails:** close as not releasable and stop
- **C8.2 At the end of a passing run:** push the branch and open a pull request; never merge, never deploy, never send
- **C8.3 Irreversible actions allowed (rules 1 to 3):** none
- **C8.4 Human review of a Low-risk change at the end:** review

## 9. Stops (the only reasons the run asks)
1. An action not covered by a line above.
`;

describe("charter-check", () => {
  test("a complete charter passes and reports its sha256", () => {
    const r = checkCharter(complete);
    assert.deepEqual(r.errors, []);
    assert.equal(r.ok, true);
    assert.match(r.sha256, /^[0-9a-f]{64}$/);
  });

  test("the unfilled template fails on placeholders", () => {
    const r = checkCharter(template);
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /placeholder/.test(e)));
  });

  test("a missing section fails", () => {
    const r = checkCharter(complete.replace(/## 7\. Depth[\s\S]*?## 8\./, "## 8."));
    assert.ok(r.errors.some((e) => /section 7 \(Depth\) is missing/.test(e)));
  });

  test("a blank field fails", () => {
    const r = checkCharter(complete.replace("- **C8.3 Irreversible actions allowed (rules 1 to 3):** none", "- **C8.3 Irreversible actions allowed (rules 1 to 3):**"));
    assert.ok(r.errors.some((e) => /C8\.3 has no value/.test(e)));
  });

  test("a budget out of order fails", () => {
    const r = checkCharter(complete.replace("**C2.3 Hard cap:** 3100k", "**C2.3 Hard cap:** 2500k"));
    assert.ok(r.errors.some((e) => /budget out of order/.test(e)));
  });

  test("an open-ended grant fails", () => {
    const r = checkCharter(complete.replace("may only add names to", "may change any file including"));
    assert.ok(r.errors.some((e) => /open-ended grant/.test(e)), r.errors.join("; "));
    const r2 = checkCharter(complete.replace("C4.0** None beyond those already approved: APPROVAL_RECORD-3, APPROVAL_RECORD-6.", "C4.1** Anthropic, receives: issue text, etc."));
    assert.ok(r2.errors.some((e) => /open-ended grant/.test(e)), r2.errors.join("; "));
  });

  test("mcp__* inside a deny-list direction is not treated as a wildcard grant", () => {
    assert.equal(checkCharter(complete).errors.filter((e) => /open-ended/.test(e)).length, 0);
  });

  test("C8.4 (human review of a Low-risk change) is required and is exactly review or skip", () => {
    assert.ok(checkCharter(complete.replace(/- \*\*C8\.4[^\n]*\n/, "")).errors.some((e) => /no C8\.4 line/.test(e)));
    assert.ok(checkCharter(complete.replace("at the end:** review", "at the end:** maybe")).errors.some((e) => /C8\.4 must be exactly/.test(e)));
    assert.equal(checkCharter(complete.replace("at the end:** review", "at the end:** skip")).errors.length, 0);
  });

  test("C6.P must target the gitignored local settings file, not the tracked one", () => {
    const r = checkCharter(complete.replace("settings.local.json", "settings.json"));
    assert.ok(r.errors.some((e) => /settings\.local\.json/.test(e)), r.errors.join("; "));
  });

  test("C6.P (how app permission prompts are prevented) is required", () => {
    const r = checkCharter(complete.replace(/\| C6\.P \|[^\n]*\n/, ""));
    assert.ok(r.errors.some((e) => /no C6\.P row/.test(e)), r.errors.join("; "));
  });

  test("a permission rule with a wildcard before or inside the command is refused; a trailing one is fine", () => {
    const bad = checkCharter(complete.replace("\`Bash(uv run pytest *)\`", "\`Bash(uv run -q --project * python * seen_payload.py *)\`"));
    assert.ok(bad.errors.some((e) => /permission rule allows any command/.test(e)), bad.errors.join("; "));
    assert.equal(checkCharter(complete).errors.filter((e) => /permission rule/.test(e)).length, 0);
  });

  test("with --plan, a model or invariant the plan names must be in the charter", () => {
    const plan = "Stage 3 uses claude-opus-5-5 and edits INV-4 and INV-5.";
    const r = checkCharter(complete, plan);
    assert.ok(r.errors.some((e) => /claude-opus-5-5/.test(e)));
    assert.ok(r.errors.some((e) => /INV-4/.test(e)));
    assert.ok(!r.errors.some((e) => /INV-5/.test(e)));
  });

  test("pack v25: every model line states an effort level, and C3.R (review rescore) is required", () => {
    const noEffort = checkCharter(complete.replace(", effort high", ""));
    assert.ok(noEffort.errors.some((e) => /no effort level/.test(e)), noEffort.errors.join("; "));
    const badEffort = checkCharter(complete.replace("effort high", "effort thorough"));
    assert.ok(badEffort.errors.some((e) => /no effort level/.test(e)));
    const noR = checkCharter(complete.replace(/- \*\*C3\.R[^\n]*\n/, ""));
    assert.ok(noR.errors.some((e) => /C3\.R/.test(e)), noR.errors.join("; "));
    assert.equal(checkCharter(complete).errors.length, 0);
  });

  test("pack v29: with --plan, C6.P needs an Agent(<role>) allow rule for every role the plan's stage table spawns", () => {
    const plan = [
      "| # | Stage | Owner | Depth |",
      "|---|---|---|---|",
      "| 1 | Scope | Engineering Manager | standard |",
      "| 2 | Spec | Software Architect | high |",
      "| 3 | Sec | Security & Privacy | standard |",
      "| 4 | Deploy and verify | Orchestrator, Production Verification | standard |",
      "| 5 | Sign-off | Human | - |",
      "",
    ].join("\n");
    const bare = checkCharter(complete, plan);
    for (const slug of ["engineering-manager", "software-architect", "security-privacy", "production-verification"]) {
      assert.ok(bare.errors.some((e) => e.includes(`Agent(${slug})`)), `${slug}: ${bare.errors.join("; ")}`);
    }
    assert.ok(!bare.errors.some((e) => /Agent\((orchestrator|human)/.test(e)), "the Orchestrator and Human are not spawned");
    const rules = ["engineering-manager", "software-architect", "security-privacy", "production-verification"].map((r) => `\`Agent(${r})\``).join(", ");
    const withRules = complete.replace("`Bash(uv run pytest *)`,", `\`Bash(uv run pytest *)\`, ${rules},`);
    const ok = checkCharter(withRules, plan);
    assert.ok(!ok.errors.some((e) => /Agent\(/.test(e)), ok.errors.join("; "));
  });

  test("a plan with no stage table, or only unknown owners, asks for no Agent rule; Agent(*) is refused", () => {
    assert.ok(!checkCharter(complete, "Stage 3 uses claude-sonnet-5-5.").errors.some((e) => /Agent\(/.test(e)));
    const odd = "| # | Stage | Owner |\n|---|---|---|\n| 1 | x | the vendor |\n";
    assert.ok(!checkCharter(complete, odd).errors.some((e) => /Agent\(/.test(e)));
    const wild = complete.replace("`Bash(uv run pytest *)`,", "`Bash(uv run pytest *)`, `Agent(*)`,");
    assert.ok(checkCharter(wild).errors.some((e) => /permission rule allows any command/.test(e)));
  });
});
