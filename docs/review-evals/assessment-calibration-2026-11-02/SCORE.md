# Calibration: calibration

**Recall: 6 of 6 planted bugs found (100%).** With 6 seeds one miss moves recall by 17%; treat it as indicative, not a measurement.

| By | Found | Planted |
|---|---|---|
| class: authz | 1 | 1 |
| class: concurrency | 1 | 1 |
| class: errors | 1 | 1 |
| class: injection | 1 | 1 |
| class: logic | 1 | 1 |
| class: tenant | 1 | 1 |
| severity: P0 | 2 | 2 |
| severity: P1 | 3 | 3 |
| severity: P2 | 1 | 1 |

**Precision: 33% to 100%** of 18 finding(s). Lower bound counts every unjudged finding that matches no seed as false; upper bound counts them as true. Only 6 finding(s) are judged, so **the plan's bar (70% on a sample of 30) is not measured.**

Findings awaiting the owner's disposition (they match no seed, so they are real finds or false positives): F-01-1, F-01-2, F-01-3, F-01-4, F-03-3, F-03-4, F-03-5, F-03-6, F-04-3, F-04-4, F-05-1, F-05-2.

**Cost:** 234,172 tokens over 3,837 lines = 610,300 tokens per 10,000 lines (the figure supplied; see the record for what it counts).

