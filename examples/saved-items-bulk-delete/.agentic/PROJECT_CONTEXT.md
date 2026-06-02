# Project Context — Stash

> Sample `.agentic/` for the worked example. In a real product this lives
> in the product repo, never inside the playbook.

## What Stash is

A B2C SaaS for saving and organising items — links, notes, and clips — into
lists. Think "a tidier bookmarks app". Individuals are the buyers; there is
no team / admin concept yet.

## Who it serves

People who save a lot of things and lose track of them. The core job is
"find the thing I saved" and "keep my lists from becoming junk drawers".

## Current focus

The MVP is live with a small user base. Current focus is **list hygiene** —
helping users keep their saved items manageable. Single-item delete exists;
power users have asked for a way to clear out many items at once.

## Applicable project pack

`project-packs/b2c-saas.md` — individual buyer, low-friction, the user
needs to accomplish a task fast, not read a manual.

## Tech shape (for agents)

- TypeScript / Node service layer; React front end.
- A `SavedItem` record per user (`userId`, `itemId`, content fields,
  `deletedAt` nullable for soft delete).
- An append-only `audit_events` table.
- LLM features go through a placeholder adapter that throws by default
  (no live model in the build).

## Out of scope right now

- Teams, sharing, RBAC (not an enterprise product yet).
- Anything that sends or posts on the user's behalf.
