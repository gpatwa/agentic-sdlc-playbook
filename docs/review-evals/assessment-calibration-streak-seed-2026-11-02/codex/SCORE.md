# Calibration: calibration

**Recall: 2 of 6 planted bugs found (33%).** With 6 seeds one miss moves recall by 17%; treat it as indicative, not a measurement.

| By | Found | Planted |
|---|---|---|
| class: authz | 1 | 1 |
| class: error-handling-fails-open | 1 | 1 |
| class: injection | 0 | 1 |
| class: input-validation | 0 | 1 |
| class: logic | 0 | 1 |
| class: race-resource | 0 | 1 |
| severity: P0 | 1 | 1 |
| severity: P1 | 1 | 2 |
| severity: P2 | 0 | 3 |

**Missed:**
- S2 (input-validation, P2) `src/server.js:327`: Habit name length limit is counted in code points instead of UTF-16 units/bytes, so names up to roughly twice the intended 200 limit are accepted.
- S3 (logic, P2) `src/services/streak.js:29`: Day index uses truncation toward zero instead of floor, so timestamps before 1970-01-01 map to the wrong UTC day.
- S4 (injection, P1) `src/client/dom.js:37`: The href allowlist only checks that '#/' appears somewhere in the value rather than at the start, so a javascript: URL containing '#/' passes validation and can be set as a link.
- S6 (race-resource, P2) `src/server.js:155`: When the body cap is exceeded the data/end/error listeners are not removed, so they stay attached to the request for the remainder of the oversized upload.

**Precision: 32% to 90%** of 41 finding(s). Lower bound counts every unjudged finding that matches no seed as false; upper bound counts them as true. Only 17 finding(s) are judged, so **the plan's bar (70% on a sample of 30) is not measured.**

Findings awaiting the owner's disposition (they match no seed, so they are real finds or false positives): F-01-1, F-01-2, F-01-4, F-01-6, F-01-9, F-02-1, F-02-3, F-02-5, F-02-7, F-02-9, F-03-1, F-03-3, F-03-4, F-03-5, F-04-1, F-05-2, F-06-3, F-06-5, F-07-2, F-08-1, F-08-2, F-08-3, F-08-4, F-09-1.

Judged false: F-02-2, F-03-2, F-07-1, F-09-2.

**Cost:** not supplied.

