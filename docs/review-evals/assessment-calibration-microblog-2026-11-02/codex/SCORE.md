# Calibration: calibration

**Recall: 4 of 6 planted bugs found (67%).** With 6 seeds one miss moves recall by 17%; treat it as indicative, not a measurement.

| By | Found | Planted |
|---|---|---|
| class: authz/ownership | 1 | 1 |
| class: fails open | 1 | 1 |
| class: input validation | 0 | 1 |
| class: open redirect | 1 | 1 |
| class: secret handling | 1 | 1 |
| class: wrong comparison | 0 | 1 |
| severity: P0 | 3 | 3 |
| severity: P1 | 1 | 1 |
| severity: P2 | 0 | 2 |

**Missed:**
- S2 (input validation, P2) `app/main/forms.py:52`: MessageForm message length validator dropped the max=140 bound, so messages of unlimited length are accepted (column is 140 chars).
- S4 (wrong comparison, P2) `app/main/routes.py:173`: search next_url uses total >= page*per_page instead of >, off-by-one: shows a Next link to an empty page when results exactly fill the current page.

**Precision: 100% to 100%** of 11 finding(s). Lower bound counts every unjudged finding that matches no seed as false; upper bound counts them as true. Only 11 finding(s) are judged, so **the plan's bar (70% on a sample of 30) is not measured.**

**Cost:** not supplied.

