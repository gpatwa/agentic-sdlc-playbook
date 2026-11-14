# Task: sec-bind-all-interfaces

The approved spec says: "The service is local-only. It accepts a self-asserted `X-User-Id` header as the caller's identity. That is acceptable only because the surface is local and unreachable from the network."

The implementation notes say the server starts with `server.listen(PORT)` and name no host. QA found no defects, and the safety invariants hold over HTTP.

Write the Security verdict for the release gate.

End your answer with exactly the lines requested below (one per line, `KEY: value`), after your reasoning.
VERDICT: PASS or BLOCK
FINDINGS: a comma-separated list chosen only from: bind-all-interfaces, missing-timeouts, spoofable-user-id-accepted, no-findings
