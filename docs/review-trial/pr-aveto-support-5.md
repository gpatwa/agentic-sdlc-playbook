# External review: gpatwa/aveto-support#5 (Codex, run in the Codex app; not posted to GitHub)

Source: a pasted review (not posted to GitHub). Collected 2026-10-23. Disposition `open` means nobody has judged it yet: set each to `fixed <ref>`, `intentional <reason>` (the finding is correct and the behaviour is deliberate) or `rejected <reason>`. "Also in our local review?" is a heuristic (same file, within 15 lines); a person confirms it.

| id | P | file:line | claim | disposition | also in our local review? |
|---|---|---|---|---|---|
| c01 | P2 | pipeline.py:254 | Reserve budget for retries before sending them. reserves one attempt, but the adapter can make two. Settlement then charges both, allowing spend beyond the daily cap. A deterministic reproduction with a $0.030000 cap settled $0.039342. Reserve both attempts up | accepted https://github.com/gpatwa/aveto-support/issues/6 | no |
## Support session's reading (2026-10-23)

- **Checked against the code, not reproduced.** In `aveto_service/pipeline.py` the reservation is one `amount` (reserved at about line 254); `aveto_service/anthropic_judge.py` has `MAX_ATTEMPTS = 2`; settlement charges `(attempts - 1) * amount` on top (about line 286). So a retried question can settle above what was reserved, and the day's in-service cap can be overshot by up to one reservation per retried request. Codex's reproduced figure ($0.039342 against a $0.030000 cap) was not re-run here.
- **Not in our local review or the security review.** CR-2 (`code-review.md`) covers how a failed or retried call is *charged*; neither it nor `14-security-review.md` says retries are not *reserved*. My reading is that this is a distinct defect, so the last column should become `no` once a person confirms it. The heuristic shows `possible (CR-2)` because the lines are 15 apart.
- **Impact is bounded, not zero.** The in-service daily cap is already documented as not durable (decision D1); the $10 console limit is the real cap. The overshoot is about one reservation ($0.012 to $0.048 at the measured cost) per retried request.
- **Severity P2** as Codex labels it. A fix is small (reserve both attempts up front and refund the unused part), but it changes code after the release gate and the live service runs the current image, so it needs its own Charter and a redeploy. That is the owner's call.

## Disposition (2026-10-23, the owner)

**Accepted and filed as [aveto-support#6](https://github.com/gpatwa/aveto-support/issues/6), labelled `bug` and `P2`,** on the owner's instruction: "just file issue in github as P2, we will prioritize as needed." Not fixed; a fix needs its own Charter and a redeploy. The owner confirmed on 2026-10-23 ("it's new") that this is a distinct defect from CR-2, so the last column reads `no` and the finding counts toward the "new value" bar.
