# Assessment report: microblog-seeded

**Assessed against Aveto's gates on 2026-11-03. This is an assessment, not a certification.** It records what the reviewers found in the parts listed below. It does not say the code is secure or compliant, and a finding's absence is not evidence of safety.

|  |  |
|---|---|
| Commit | `9348fd8d4c777f3e920d5219d243d7e4e718a338` |
| Reviewers | codex (openai) |
| Independent second reviewer | **no**: one model family reviewed this. Treat it as a first pass. |
| Built under Aveto | no records found |
| Read-only check | passed: the target's HEAD and working tree were unchanged, and the review copy differed from the commit only by the recorded removals |
| Source reviewed | about 24,946 of 24,946 reviewable tokens (estimate: bytes / 4) |

## Summary

11 finding(s): 0 P0, 4 P1, 7 P2, 0 P3, 0 note. 11 are still open; the owner sets each disposition.

## Risk map

| Tier | Files | Approx. tokens |
|---|---|---|
| high | 13 | 2,489 |
| medium | 53 | 21,610 |
| low | 6 | 847 |

High-risk files (13): `Dockerfile`, `app/api/auth.py`, `app/api/tokens.py`, `app/auth/__init__.py`, `app/auth/email.py`, `app/auth/forms.py`, `app/auth/routes.py`, `app/templates/auth/login.html`, `app/templates/auth/register.html`, `app/templates/auth/reset_password.html`, `app/templates/auth/reset_password_request.html`, `app/templates/email/reset_password.html`, `migrations/versions/834b1a697901_user_tokens.py`.

## Findings

### P1

**F-01-1** · `app/api/users.py:67` · codex · open

Any authenticated API user can update any user ID; changing a victim’s email and then requesting a password reset enables account takeover. Require `id == token_auth.current_user().id` or an explicit administrative permission before loading/updating the target.

*Evidence:* evidence: `user = db.get_or_404(User, id)` followed by `user.from_dict(data, new_user=False)`; no ownership check is performed

**F-01-2** · `config.py:9` · codex · open

When `SECRET_KEY` is unset, every deployment uses a publicly known signing key, allowing attackers to forge Flask sessions and password-reset JWTs. Fail startup unless a strong secret is supplied.

*Evidence:* evidence: `SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'`

**F-01-3** · `app/models.py:264` · codex · open

API bearer tokens are deterministically derived from the public user ID and issuance time rounded to one second. An attacker who knows the approximate issuance window can enumerate candidate tokens and impersonate the user. Generate tokens with a cryptographically secure random source such as `secrets.token_urlsafe()`.

*Evidence:* evidence: `self.token = md5(f'{self.id}{now.timestamp():.0f}'.encode()).hexdigest()`

**F-01-5** · `app/templates/email/reset_password.html:7` · codex · open

Reset links are generated from the request’s external URL while nginx accepts arbitrary hosts, preserves `$host`, proxies over HTTP, and supplies no trusted external scheme. A crafted Host header can place the token in an attacker-controlled URL, and ordinary links can be emitted as HTTP, exposing reset tokens. Generate links from a configured canonical HTTPS origin and validate trusted hosts/proxy headers.

*Evidence:* evidence: `url_for('auth.reset_password', token=token, _external=True)`; deployment code reads `proxy_pass http://localhost:8000;` and `proxy_set_header Host $host;`

### P2

**F-01-4** · `app/models.py:278` · codex · open

A record with a non-null token but null expiration is deliberately treated as unexpired, making that bearer token valid indefinitely. Reject missing expirations and enforce a database constraint tying tokens to valid expiration values.

*Evidence:* evidence: `except AttributeError:` followed by `expired = False` and then `return user`

**F-01-6** · `app/auth/routes.py:27` · codex · open

The post-login redirect accepts protocol-relative URLs such as `//evil.example`, so a successful login can redirect users to an attacker-controlled site. Reject any target with a scheme or network location, or allow only locally generated paths.

*Evidence:* evidence: `if not next_page or not next_page.startswith('/'):` followed by `return redirect(next_page)`

**F-01-7** · `app/auth/routes.py:76` · codex · open

Password-reset tokens remain reusable until their ten-minute JWT expiry, even after a successful password change. Anyone retaining the link can reset the account again. Store and atomically consume a one-time reset nonce, or bind the token to password state that changes after use.

*Evidence:* evidence: `user = User.verify_reset_password_token(token)` followed by `user.set_password(form.password.data)` and `db.session.commit()`; no token state is invalidated

**F-01-8** · `app/translate.py:14` · codex · open

The synchronous translator request has no timeout. A stalled upstream connection can hold a Gunicorn worker indefinitely; repeated authenticated requests can exhaust all workers. Set bounded connect/read timeouts and handle timeout exceptions.

*Evidence:* evidence: `r = requests.post(` with `headers=auth, json=[{'Text': text}])` and no `timeout` argument

**F-01-9** · `Dockerfile:16` · codex · open

The image never switches away from the base image’s root user, so the public web process and migration entrypoint run as root inside the container. Create an unprivileged account, grant only required file access, and select it with `USER`.

*Evidence:* evidence: `ENTRYPOINT ["./boot.sh"]` appears after all build steps with no preceding `USER` instruction

**F-01-10** · `app/main/routes.py:219` · codex · open

A state-changing export job is launched through a GET endpoint, allowing a cross-site navigation or embedded request to enqueue work and send the victim an export email. Change it to POST and require a valid CSRF token.

*Evidence:* evidence: `@bp.route('/export_posts')` followed by `current_user.launch_task('export_posts', _('Exporting posts...'))`

**F-01-11** · `app/templates/messages.html:11` · codex · open

Message pagination never uses the `prev_url` and `next_url` computed by the route, so users cannot navigate beyond the current page of private messages. Bind the links to those URL variables.

*Evidence:* evidence: both pagination anchors use `href="#"`

## What was not reviewed, and why

- 1 file(s) vendored, binary, lock or minified.

## Tests and CI

**No tests found.** No test, lint or build command was detected from the manifests.

No CI files found.

## Proposed backlog

Nothing below has been done. Each item is an intent the owner can turn into a Charter; none changes anything until the owner picks it.

- **Intent (F-01-1, P1):** Fix the issue at `app/api/users.py:67`: Any authenticated API user can update any user ID; changing a victim’s email and then requesting a password reset enables account takeover. Require `id == token_auth.current_user().id` or an explicit administrative permission before loading/updating the target. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-2, P1):** Fix the issue at `config.py:9`: When `SECRET_KEY` is unset, every deployment uses a publicly known signing key, allowing attackers to forge Flask sessions and password-reset JWTs. Fail startup unless a strong secret is supplied. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-3, P1):** Fix the issue at `app/models.py:264`: API bearer tokens are deterministically derived from the public user ID and issuance time rounded to one second. An attacker who knows the approximate issuance window can enumerate candidate tokens and impersonate the user. Generate tokens with a cryptographically secure random source such as `secrets.token_urlsafe()`. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-5, P1):** Fix the issue at `app/templates/email/reset_password.html:7`: Reset links are generated from the request’s external URL while nginx accepts arbitrary hosts, preserves `$host`, proxies over HTTP, and supplies no trusted external scheme. A crafted Host header can place the token in an attacker-controlled URL, and ordinary links can be emitted as HTTP, exposing reset tokens. Generate links from a configured canonical HTTPS origin and validate trusted hosts/proxy headers. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.

**Recorded and deferred** (below P1; filing them is the owner's call):
- F-01-4 (P2) `app/models.py:278`: A record with a non-null token but null expiration is deliberately treated as unexpired, making that bearer token valid indefinitely. Reject missing expirations and enforce a database constraint tying tokens to valid expiration values.
- F-01-6 (P2) `app/auth/routes.py:27`: The post-login redirect accepts protocol-relative URLs such as `//evil.example`, so a successful login can redirect users to an attacker-controlled site. Reject any target with a scheme or network location, or allow only locally generated paths.
- F-01-7 (P2) `app/auth/routes.py:76`: Password-reset tokens remain reusable until their ten-minute JWT expiry, even after a successful password change. Anyone retaining the link can reset the account again. Store and atomically consume a one-time reset nonce, or bind the token to password state that changes after use.
- F-01-8 (P2) `app/translate.py:14`: The synchronous translator request has no timeout. A stalled upstream connection can hold a Gunicorn worker indefinitely; repeated authenticated requests can exhaust all workers. Set bounded connect/read timeouts and handle timeout exceptions.
- F-01-9 (P2) `Dockerfile:16`: The image never switches away from the base image’s root user, so the public web process and migration entrypoint run as root inside the container. Create an unprivileged account, grant only required file access, and select it with `USER`.
- F-01-10 (P2) `app/main/routes.py:219`: A state-changing export job is launched through a GET endpoint, allowing a cross-site navigation or embedded request to enqueue work and send the victim an export email. Change it to POST and require a valid CSRF token.
- F-01-11 (P2) `app/templates/messages.html:11`: Message pagination never uses the `prev_url` and `next_url` computed by the route, so users cannot navigate beyond the current page of private messages. Bind the links to those URL variables.

## Method and limits

- Files were mapped and tiered by a script from names, manifests and git history; reviewers read areas in order of risk until the cap.
- Reviewers worked in a copy with write tools, pushes and secret reads denied; the read-only check above is the evidence, not the instruction.
- Findings are from reading. None was reproduced unless its evidence says so.
- Recall and precision of this reviewer are reported in the calibration record, not here; a repo's report is only as good as that record.
