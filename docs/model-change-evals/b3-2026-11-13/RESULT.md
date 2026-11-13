# RESULT — model-check-b3 (B3: one pass of the 11 model-change cases)

- **Charter:** `CHARTER.md`, sha256 `b2da2a999729752facdcfe3f8a4b23353ca6f0984b70d16a6bd812b80bdfff29`, approved in `APPROVAL_RECORD-1.md` (2026-11-13T01:46Z UTC)
- **Brief:** `/Users/gopalpatwa/opt/agentic-sdlc-playbook/docs/model-change-evals/B3_RUN_BRIEF.md`, sha256 `8da33432…711a6` (verified before drafting)
- **Cases file:** `cases.toml` sha256 `b8837416…df9d8d2`; scorer `role-eval.mjs` sha256 `0225e803…0ace0d7`. Nothing in either was changed.
- **Run:** 11 role spawns (one each, no retries), 3 scripted scores, 8 judge spawns. No spawn errored. No reruns, no prompt or rubric changes. No web tools were used: every transcript shows 0 web_search and 0 web_fetch requests. Nothing was pushed, merged, deployed or sent.

## Per case

Spend is `subagent_tokens` as the harness reported it for each spawn (Charter C2 unit). The models were read from each spawn's transcript (`message.model`). Effort for the roles comes from their frontmatter. Effort for the judges is the session's own setting, which this run did not set and could not read.

| Case | Role | Model observed | Effort | Role spend | Judge spend | Kind | Score |
|---|---|---|---|---|---|---|---|
| arch-baseline-before-cause | software-architect | claude-opus-5-5 | high (frontmatter) | 17,532 | 59,798 | judged | PASS |
| arch-model-facts-from-metadata | software-architect | claude-opus-5-5 | high (frontmatter) | 20,505 | 58,795 | judged | PASS |
| arch-pilot-before-build | software-architect | claude-opus-5-5 | high (frontmatter) | 18,716 | 59,845 | judged | PASS |
| arch-report-the-first-stage | software-architect | claude-opus-5-5 | high (frontmatter) | 19,599 | 60,117 | judged | PASS |
| arch-seen-set-is-not-evidence | software-architect | claude-opus-5-5 | high (frontmatter) | 16,523 | 58,879 | judged | PASS |
| qa-absence-claim-needs-a-search | qa-evidence | claude-sonnet-5-5 | high (frontmatter) | 18,301 | 58,620 | judged | PASS |
| qa-failed-by-one-still-fails | qa-evidence | claude-sonnet-5-5 | high (frontmatter) | 11,853 | — | scripted | PASS |
| qa-label-review-before-gate | qa-evidence | claude-sonnet-5-5 | high (frontmatter) | 14,607 | 58,171 | judged | PASS |
| qa-permission-rules-in-tracked-settings | qa-evidence | claude-sonnet-5-5 | high (frontmatter) | 15,174 | 58,787 | judged | PASS |
| qa-report-end-to-end-beside-the-gate | qa-evidence | claude-sonnet-5-5 | high (frontmatter) | 12,202 | — | scripted | PASS |
| qa-status-claim-before-the-gate | qa-evidence | claude-sonnet-5-5 | high (frontmatter) | 11,607 | — | scripted | PASS |

All 8 judges ran on `claude-opus-5-5`, as observed. Their effort was the session setting and was not observed.

**Score: 11 of 11 PASS (3 of 3 scripted, 8 of 8 judged).**

## Totals

| | Spawns | Tokens |
|---|---|---|
| Role spawns | 11 | 176,619 |
| Judge spawns | 8 | 473,012 |
| **Total (spawns)** | 19 | **649,631** |

- That is 93% of the 700k plan, under the 850k ceiling and the 1,000k hard cap, so no notice was triggered.
- **Not counted:** the Orchestrator session's own context. The harness does not report it per spawn, and it is outside the C2 unit.

## Per-case cost, for planning three passes

- **Average per case, role and judge together:** 649,631 / 11 = **59.1k**.
  - A judged case averages 17.1k for the role plus 59.1k for the judge, about **76k**.
  - A scripted case averages **11.9k**.
- **Three passes:** about 3 × 650k = **1.95M** in spawns, plus Orchestrator overhead.
- **The judge is the cost driver.** It is 73% of the spend, and almost all of each ~59k judge spawn is the general-purpose agent's own base context, not the packet (about 3 to 8 KB). The packet is read with one Read call and the verdict is a two-line reply.
  - A leaner judge would cut the three-pass figure sharply, for example a subagent type with a minimal system prompt and only the Read tool.
  - That would change the judge setup, so it is the owner's call for B4, not something this run did.

## Observations (not scored)

1. **Judges were given the packet by path, not inline.**
   - Each judge prompt named its packet file (a byte-for-byte copy of `role-eval.mjs score` output, kept in `packets/`) and said to read only that file.
   - Every judge transcript shows exactly one tool call, a Read of its own packet. No judge saw the role brief, other cases or other replies.
2. **Some role spawns looked beyond the task text.** The prompt says "work only from what is in the task":
   - **arch-model-facts-from-metadata** read this run's `STATE.md`, `00-slice-plan.md`, `CHARTER.md` and `APPROVAL_RECORD-1.md`, and cited Charter C1.3 and C4.0 in its reply.
   - **arch-report-the-first-stage** globbed `runs/*/*`.
   - **qa-absence-claim-needs-a-search** listed `runs/` and `.agentic/` and grepped the playbook.
   - **qa-label-review-before-gate** read the playbook's `project-packs/ai-agent-product.md`.
   - **qa-permission-rules-in-tracked-settings** read this repo's real `.claude/settings.json` and `git log`. Its finding 7, about a duplicate `"allow"` key, comes from that real file, not the diff.
   - None of this changed a case's input. It does mean the scratch repo's live run files can leak into a reply, so B4 should run with `runs/` holding nothing case-relevant, or from a clean directory.
3. **The replies were extracted from the transcripts verbatim.** Each reply is the spawn's final assistant text, read from its JSONL transcript.
   - The harness's notification for qa-permission-rules-in-tracked-settings (both the role reply and its judge verdict) added a "[harness: … settings-json …]" prefix and escaped `<` characters.
   - That prefix is not in the saved files, because the saved text comes from the transcript.
4. **Permissions:** no permission prompt interrupted the run, so there was no C6.P miss. The session ran in bypass-permissions mode, and the C6.P backstop rules were added to the gitignored `.claude/settings.local.json`.

## What this run cannot show

- **No variance:** one pass per case gives no measure of variance, so 11 of 11 is a single sample.
- **Judge error:** a judged PASS is one model's judgement, with its own error rate.
- **Same model family:** the judges ran on the same family (`claude-opus-5-5`) as the architect role, so the judging is not independent.
- **What it does measure:** cost, and that the harness works end to end.
- **The comparison that matters** is B4, which needs the next model.

## Files

- Replies: `replies/<id>.md`
- Packets: `packets/<id>.md`
- Scores and verdicts: `scores/<id>.txt`
- Also in this run: `CHARTER.md`, `APPROVAL_RECORD-1.md`, `00-slice-plan.md`, `STATE.md`
