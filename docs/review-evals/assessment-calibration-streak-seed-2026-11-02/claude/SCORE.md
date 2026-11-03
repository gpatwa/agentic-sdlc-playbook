# Calibration: calibration

**Recall: 3 of 6 planted bugs found (50%).** With 6 seeds one miss moves recall by 17%; treat it as indicative, not a measurement.

| By | Found | Planted |
|---|---|---|
| class: authz | 1 | 1 |
| class: error-handling-fails-open | 1 | 1 |
| class: injection | 0 | 1 |
| class: input-validation | 0 | 1 |
| class: logic | 1 | 1 |
| class: race-resource | 0 | 1 |
| severity: P0 | 1 | 1 |
| severity: P1 | 1 | 2 |
| severity: P2 | 1 | 3 |

**Missed:**
- S2 (input-validation, P2) `src/server.js:327`: Habit name length limit is counted in code points instead of UTF-16 units/bytes, so names up to roughly twice the intended 200 limit are accepted.
- S4 (injection, P1) `src/client/dom.js:37`: The href allowlist only checks that '#/' appears somewhere in the value rather than at the start, so a javascript: URL containing '#/' passes validation and can be set as a link.
- S6 (race-resource, P2) `src/server.js:155`: When the body cap is exceeded the data/end/error listeners are not removed, so they stay attached to the request for the remainder of the oversized upload.

**Precision: 31% to 87%** of 45 finding(s). Lower bound counts every unjudged finding that matches no seed as false; upper bound counts them as true. Only 20 finding(s) are judged, so **the plan's bar (70% on a sample of 30) is not measured.**

Findings awaiting the owner's disposition (they match no seed, so they are real finds or false positives): F-01-1, F-01-2, F-01-5, F-01-7, F-01-8, F-01-9, F-01-10, F-02-1, F-02-4, F-02-5, F-02-6, F-02-7, F-02-8, F-02-9, F-02-10, F-03-1, F-03-2, F-03-3, F-03-4, F-03-5, F-05-1, F-05-2, F-06-5, F-08-3, F-08-4.

Judged false: F-04-1, F-04-2, F-04-3, F-04-4, F-07-2, F-07-3.

**Cost:** not supplied.

