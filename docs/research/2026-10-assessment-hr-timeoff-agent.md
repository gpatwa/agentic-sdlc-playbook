# Manual assessment: hr-timeoff-agent (a trial of assessment mode)

> **Assessed against Aveto's gates on 2026-10-30. This is an assessment, not a certification.** It records what one reviewer
> found in the parts listed below. It does not say the code is secure or compliant.
> **Target:** `~/opt/hr-timeoff-agent`, commit `5c4098f884fc85b586a1a8f0e68706adb68a3853` (main), clean working tree before and after
> (`git status` empty, HEAD unchanged). Tests ran in a throwaway clone, not in the target.
> **Reviewer:** one (Claude, the support session). **No independent second reviewer ran**, which `docs/REVIEW_MODE_PLAN.md` requires
> for a real assessment (Codex is meant to be the independent one). Treat this as a first pass.
> **Not a full-tree review.** Time was spent on the trust boundaries. The list of what was and was not read is at the end.

## Was it built by Aveto?

The repo shows no sign of it: no Charter, no `runs/` folder, no `.agentic/` folder, no event log, and no mention of Aveto in
README, CONTEXT or HANDOFF. It has 133 tracked files, about 7,600 lines of Python, 36 pull requests by one author over 2026-09-21 to
2026-10-04, and a CI with import-boundary checks. So the findings below are about a repo **Aveto did not govern**, which is
the situation assessment mode is meant for. If it was built with Aveto, the records are not in this repository.

## What is good (checked in the code)

- **Approval is bound to the signed-in person.** `Workspace.decide` takes the approver from the session, never a form field, and the
  graph suspends until a named manager resumes it (`agent/workspace.py:404-442`, `services/web/app.py` `decide`). The test script
  `tests/test_guarantees.py` passes in the clone.
- **OIDC checks are complete.** RS256 only, issuer, audience, expiry, required claims, tenant, verified email that maps to exactly one
  worker (`adapters/oidc.py`). The web flow adds PKCE, state, nonce, and cookies sealed with a purpose and an expiry
  (`services/web/identity.py`).
- **SQL is parameterised** in the three adapters I grepped; templates use Jinja's default escaping (no `|safe`).
- **Secrets are files** (`*_FILE` variables, a `secrets/` folder git ignores), and the tool server sits behind a bearer guard with
  DNS-rebinding protection.
- **Five of the repo's own check scripts pass** in the clone: golden CLI/MCP contract, ports, contracts, docs, guarantees.

## Findings

Severity follows the owner's triage rule: P0 and P1 are filed; below that they are recorded and deferred. Nothing here was
reproduced by running an attack; each is from reading the code.

| # | Sev | Finding | Evidence | Suggested fix |
|---|---|---|---|---|
| 1 | **P1** | **Sign-in fails open to a demo mode.** If `HR_OIDC_ISSUER` is unset (a typo, a missing variable), the app silently serves a person picker: anyone chooses any worker, an admin included, with no password. The same unset variable makes the A2A agents accept bearer tokens that anyone holding `HR_WEB_SECRET` can mint. Admin can then change policy or reset the tenant. | `services/web/identity.py` `identity_from_env`; `adapters/oidc.py` docstring ("Unset, the app keeps its demo persona picker"); `services/web/app.py` `signin`; `services/a2a/common.py` `BearerTokens.derive` | Require an explicit `HR_AUTH_MODE=demo` to enable the picker; refuse to start in demo mode on a non-loopback host; log the mode at startup. |
| 2 | P2 | `POST /admin/reset` wipes the tenant to the seeded state and is available in OIDC mode, behind only the admin flag. | `services/web/app.py` `admin_reset`; `workspace.py:157` | Disable it unless demo mode is explicit. |
| 3 | P2 | CI has no `permissions:` block (so the default token scope applies), and actions are pinned by tag (`@v4`, `@v5`), not commit sha. | `.github/workflows/ci.yml` (no `permissions`), `uses:` lines | Add `permissions: contents: read`; pin by sha. |
| 4 | P2 | The compose "stack" runs Keycloak with `start-dev`, and the committed realm sets `sslRequired: none`. Ports are published on all interfaces. | `docker-compose.yml:68,74`; `deploy/keycloak/hr-realm.json` | Label the stack as local-only at the top of the file, or add a production profile. |
| 5 | P3 | The committed development realm holds literal client secrets and demo passwords (I checked their shape, not their values). The README says it is for local use only. | `deploy/keycloak/hr-realm.json`; README line 246 | Use the rendered `secrets/hr-realm.json` path for every compose file. |
| 6 | P3 | `/readyz` is unauthenticated and returns exception class names; the 404 handler echoes the missing key. | `services/web/app.py` | Return only pass or fail. |
| 7 | P3 | Sessions are stateless cookies: logout deletes the cookie but cannot revoke it before its 8-hour expiry. | `services/web/identity.py` | Accept, or add a server-side session id. |
| 8 | note | The worker's free-text note goes into the model's prompt (`agent/graph.py:75`). The effect is bounded because policy is code and a human decides, but prompt injection into the advisory text was **not tested**. | `agent/graph.py` | Add an eval case with an injected note. |

**Worth filing now:** finding 1. Findings 2 and 3 are cheap and would travel with it. 4 to 7 are recorded and deferred.

## What was and was not examined

- **Read:** `services/web/identity.py`, `services/web/app.py`, `adapters/oidc.py`, `Workspace.decide` and `reset`,
  `services/a2a/common.py` (auth parts), `hr_tools/server.py`, the MCP section of `cli.py`, `docker-compose*.yml`, the shape of
  `deploy/keycloak/hr-realm.json`, `.github/workflows/*.yml`, `CODEOWNERS`; grep checks of SQL and template escaping.
- **Run (in a clone, not the target):** `tests/test_golden.py`, `test_ports.py`, `test_contracts.py`, `test_docs.py`,
  `test_guarantees.py`: all pass.
- **Not read:** `agent/graph.py` beyond one line, `agentloop.py`, `agents.py`, `adapters/llm.py`, `retrieval.py`, `storage.py` beyond
  the grep, `policy.py` rules, the A2A server logic, `telemetry.py`, the eval harness, the templates' content, the data files.
- **Not run:** the Postgres and Docker CI jobs, the live-model evals, any dependency or secret scanner, any attack.
- **Secrets:** the names in `secrets/` were listed and no file in it was read. I also opened `CONTEXT.md` by mistake: it is personal
  and git-excluded, was out of scope, and nothing from it is used here.

## What this trial says about assessment mode

1. A single read-only pass over the trust boundaries found one finding worth filing in about a dozen files. That is a useful
   result, but one repo and one reviewer cannot test precision or recall; the plan's bars still need the pilots.
2. The plan's mechanical read-only check is needed: reading in place is easy to get wrong, and I used a clone for anything that
   writes. M1 should build that into the runner.
3. The report format held up: severity, file and line, what was not examined. The "built by Aveto?" question needs an answer
   from records, so the repo map (M2) should look for Charter and run records first.
4. An independent reviewer (Codex) and the owner's sample of findings are the missing evidence. Without them this stays a trial.
