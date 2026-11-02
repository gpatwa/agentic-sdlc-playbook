# Calibration: calibration

**Recall: 4 of 6 planted bugs found (67%).** With 6 seeds one miss moves recall by 17%; treat it as indicative, not a measurement.

| By | Found | Planted |
|---|---|---|
| class: authz | 1 | 1 |
| class: concurrency | 0 | 1 |
| class: errors | 1 | 1 |
| class: injection | 1 | 1 |
| class: logic | 1 | 1 |
| class: tenant | 0 | 1 |
| severity: P0 | 2 | 2 |
| severity: P1 | 1 | 3 |
| severity: P2 | 1 | 1 |

**Missed:**
- S2 (tenant, P1) `hr_timeoff_agent/services/a2a/payroll.py:50`: The tenant check only runs when tenant_id is supplied, so a request with no tenant_id reads this tenant's payroll data.
- S6 (concurrency, P1) `hr_timeoff_agent/services/a2a/common.py:145`: Bearer token is compared with == instead of a constant-time compare, enabling timing attacks.

**Precision: 92% to 92%** of 12 finding(s). Lower bound counts every unjudged finding that matches no seed as false; upper bound counts them as true. Only 11 finding(s) are judged, so **the plan's bar (70% on a sample of 30) is not measured.**

Judged false: F-00-001.

**Cost:** not supplied.

