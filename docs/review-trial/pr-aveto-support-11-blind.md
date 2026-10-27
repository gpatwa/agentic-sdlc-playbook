# External review: gpatwa/aveto-support#11 (polished chat), Codex blind, new chat

Mode: blind. Path: A.

Source: a pasted review (not posted to GitHub). Collected 2026-10-27. Disposition `open` means nobody has judged it yet: set each to `fixed <ref>`, `accepted <issue>` (the finding is correct and is filed to fix later), `intentional <reason>` (the finding is correct and the behaviour is deliberate), `rejected <reason>`, or `duplicate of <record>` (the same defect already counted). "Also in our local review?" is a heuristic (same file, within 15 lines); a person confirms it.

| id | P | file:line | claim | disposition | also in our local review? |
|---|---|---|---|---|---|
| c01 | P2 | aveto_service/pipeline.py:333 | Failed warm-ups retry without any limit. , Only successful retrievals are cached. If retrieval keeps failing, every anonymous POST /warm retries it, bypassing /ask's retrieval allowance. Each attempt holds the shared retrieval lock, so repeated requests can co | intentional deferred by the owner 2026-10-26: P2, known as security-review advisory A1, matters only when retrieval is already failing; fix (cache failures briefly or rate-limit /warm) is small and not filed | yes (security review A1; code-review F2 adjacent) |
