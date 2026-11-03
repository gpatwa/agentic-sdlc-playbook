# Assessment report: microblog-seeded

**Assessed against Aveto's gates on 2026-11-03. This is an assessment, not a certification.** It records what the reviewers found in the parts listed below. It does not say the code is secure or compliant, and a finding's absence is not evidence of safety.

|  |  |
|---|---|
| Commit | `9348fd8d4c777f3e920d5219d243d7e4e718a338` |
| Reviewers | claude (anthropic) |
| Independent second reviewer | **no**: one model family reviewed this. Treat it as a first pass. |
| Built under Aveto | no records found |
| Read-only check | passed: the target's HEAD and working tree were unchanged, and the review copy differed from the commit only by the recorded removals |
| Source reviewed | about 24,946 of 24,946 reviewable tokens (estimate: bytes / 4) |

## Summary

7 finding(s): 1 P0, 2 P1, 2 P2, 2 P3, 0 note. 7 are still open; the owner sets each disposition.

## Risk map

| Tier | Files | Approx. tokens |
|---|---|---|
| high | 13 | 2,489 |
| medium | 53 | 21,610 |
| low | 6 | 847 |

High-risk files (13): `Dockerfile`, `app/api/auth.py`, `app/api/tokens.py`, `app/auth/__init__.py`, `app/auth/email.py`, `app/auth/forms.py`, `app/auth/routes.py`, `app/templates/auth/login.html`, `app/templates/auth/register.html`, `app/templates/auth/reset_password.html`, `app/templates/auth/reset_password_request.html`, `app/templates/email/reset_password.html`, `migrations/versions/834b1a697901_user_tokens.py`.

## Findings

### P0

**F-01-1** · `app/api/users.py:64-79` · claude · open

`PUT /api/users/<id>` has no ownership check. Any holder of a valid API token can edit any other user's `username`, `email` and `about_me`. Registration is open (`POST /api/users` has no auth), so anyone can get a token. An attacker changes the victim's email to their own, then uses the password-reset flow to take over the account. `abort` is imported but never used, so the 403 guard looks to have been removed.

*Evidence:* `@bp.route('/users/<int:id>', methods=['PUT'])` / `@token_auth.login_required` / `def update_user(id):` / `user = db.get_or_404(User, id)` … `user.from_dict(data, new_user=False)` / `db.session.commit()` (no comparison with `token_auth.current_user().id`; `from flask import request, url_for, abort` imports `abort` but nothing uses it)

### P1

**F-01-2** · `app/models.py:264` · claude · open

The API bearer token is `md5(f'{self.id}{now.timestamp():.0f}')`. Its only inputs are the user id and the issue time in whole seconds, so it can be guessed. An attacker who knows a user id and roughly when they logged in can try a few thousand candidates against any `token_auth` endpoint. Combined with finding 1, that gives full account takeover. `secrets` is imported at line 4 but never used, so a CSPRNG token was probably replaced.

*Evidence:* `self.token = md5(f'{self.id}{now.timestamp():.0f}'.encode()).hexdigest()` (line 4: `import secrets`, no other use in the file)

**F-01-3** · `app/auth/routes.py:27` · claude · open

Open redirect after login. `next_page.startswith('/')` accepts protocol-relative URLs. `/auth/login?next=//evil.example` (or `/\evil.example`) passes the check and the user is redirected to the attacker's site right after authenticating, which allows phishing. `urlsplit` is imported at line 2 but never used, so the netloc check appears to have been dropped.

*Evidence:* `next_page = request.args.get('next')` / `if not next_page or not next_page.startswith('/'):` / `next_page = url_for('main.index')` / `return redirect(next_page)` (line 2: `from urllib.parse import urlsplit`, unused)

### P2

**F-01-4** · `config.py:9` · claude · open

The `SECRET_KEY` falls back to a public hard-coded string. The Docker image and `boot.sh` never set it. A deployment without the env var signs sessions and password-reset JWTs (`get_reset_password_token`, HS256) with a known key. An attacker can then forge `{'reset_password': <id>, 'exp': …}` for any user id and reset any password, or forge session cookies. Fail closed outside dev/test.

*Evidence:* `SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'` (used at app/models.py:184 and :189 for `jwt.encode` / `jwt.decode`)

**F-01-5** · `Dockerfile:1-16` · claude · open

The container runs as root. There is no `USER` directive, and gunicorn (internet-facing, port 5000) and the DB migrations both run as uid 0. Any RCE in the app or its dependencies gets root in the container. Create an unprivileged user and `chown` the app files before `ENTRYPOINT`.

*Evidence:* `FROM python:slim` … `RUN chmod a+x boot.sh` … `ENTRYPOINT ["./boot.sh"]` (no `USER` anywhere)

### P3

**F-01-6** · `app/models.py:279-282` · claude · open

`check_token` fails open. If `token_expiration` is NULL while `token` is set, `.replace` raises `AttributeError`, which is swallowed and sets `expired = False`. The token then never expires. The columns are nullable (`migrations/versions/834b1a697901_user_tokens.py:21-22`). It cannot happen through `get_token`, but it can after a manual or partial DB edit. Treat a missing expiration as expired.

*Evidence:* `except AttributeError:` / `expired = False`

**F-01-7** · `.flaskenv:2` · claude · open

`FLASK_DEBUG=1` is committed. Any `flask run` or `flask` CLI use in a deployed checkout (the `Procfile` runs `flask db upgrade`) loads it and turns on debug mode. If `flask run` is used on a reachable host such as the Vagrant VM at 192.168.56.10, that exposes the Werkzeug debugger, which allows RCE. It also makes `create_app` skip the mail and file log handlers (`if not app.debug`). Keep it out of the committed file.

*Evidence:* `FLASK_DEBUG=1`

## What was not reviewed, and why

- 1 file(s) vendored, binary, lock or minified.

## Tests and CI

**No tests found.** No test, lint or build command was detected from the manifests.

No CI files found.

## Proposed backlog

Nothing below has been done. Each item is an intent the owner can turn into a Charter; none changes anything until the owner picks it.

- **Intent (F-01-1, P0):** Fix the issue at `app/api/users.py:64-79`: `PUT /api/users/<id>` has no ownership check. Any holder of a valid API token can edit any other user's `username`, `email` and `about_me`. Registration is open (`POST /api/users` has no auth), so anyone can get a token. An attacker changes the victim's email to their own, then uses the password-reset flow to take over the account. `abort` is imported but never used, so the 403 guard looks to have been removed. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-2, P1):** Fix the issue at `app/models.py:264`: The API bearer token is `md5(f'{self.id}{now.timestamp():.0f}')`. Its only inputs are the user id and the issue time in whole seconds, so it can be guessed. An attacker who knows a user id and roughly when they logged in can try a few thousand candidates against any `token_auth` endpoint. Combined with finding 1, that gives full account takeover. `secrets` is imported at line 4 but never used, so a CSPRNG token was probably replaced. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-3, P1):** Fix the issue at `app/auth/routes.py:27`: Open redirect after login. `next_page.startswith('/')` accepts protocol-relative URLs. `/auth/login?next=//evil.example` (or `/\evil.example`) passes the check and the user is redirected to the attacker's site right after authenticating, which allows phishing. `urlsplit` is imported at line 2 but never used, so the netloc check appears to have been dropped. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.

**Recorded and deferred** (below P1; filing them is the owner's call):
- F-01-4 (P2) `config.py:9`: The `SECRET_KEY` falls back to a public hard-coded string. The Docker image and `boot.sh` never set it. A deployment without the env var signs sessions and password-reset JWTs (`get_reset_password_token`, HS256) with a known key. An attacker can then forge `{'reset_password': <id>, 'exp': …}` for any user id and reset any password, or forge session cookies. Fail closed outside dev/test.
- F-01-5 (P2) `Dockerfile:1-16`: The container runs as root. There is no `USER` directive, and gunicorn (internet-facing, port 5000) and the DB migrations both run as uid 0. Any RCE in the app or its dependencies gets root in the container. Create an unprivileged user and `chown` the app files before `ENTRYPOINT`.
- F-01-6 (P3) `app/models.py:279-282`: `check_token` fails open. If `token_expiration` is NULL while `token` is set, `.replace` raises `AttributeError`, which is swallowed and sets `expired = False`. The token then never expires. The columns are nullable (`migrations/versions/834b1a697901_user_tokens.py:21-22`). It cannot happen through `get_token`, but it can after a manual or partial DB edit. Treat a missing expiration as expired.
- F-01-7 (P3) `.flaskenv:2`: `FLASK_DEBUG=1` is committed. Any `flask run` or `flask` CLI use in a deployed checkout (the `Procfile` runs `flask db upgrade`) loads it and turns on debug mode. If `flask run` is used on a reachable host such as the Vagrant VM at 192.168.56.10, that exposes the Werkzeug debugger, which allows RCE. It also makes `create_app` skip the mail and file log handlers (`if not app.debug`). Keep it out of the committed file.

## Method and limits

- Files were mapped and tiered by a script from names, manifests and git history; reviewers read areas in order of risk until the cap.
- Reviewers worked in a copy with write tools, pushes and secret reads denied; the read-only check above is the evidence, not the instruction.
- Findings are from reading. None was reproduced unless its evidence says so.
- Recall and precision of this reviewer are reported in the calibration record, not here; a repo's report is only as good as that record.
