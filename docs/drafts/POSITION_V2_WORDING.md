# Public wording for Process v2 (applied 2026-10-16, on the owner's "apply both")

> **Applied to `README.md` and `site/index.html` on 2026-10-16** after the owner chose "apply both" over the recommendation (README now, site after a second run). Kept as the record of the exact replacements. Process v2 (pack v20)
> replaces "a human approves each risky action" with "a human approves a bounded
> Charter at the start and reviews the result at the end". The README and the
> site promised the old model. These are the exact replacements. Applying
> them changes what Aveto publicly claims, and the site deploys from `main`, so
> the owner approves the words before anything is committed.
>
> Evidence the new claim rests on: the `streak-seed` dry run on 2026-10-16
> (`runs/health-version/` there): one typed approval of the Charter by hash, then
> implementation, QA, Security, Release and an end review with no further
> question, in about seven minutes. One run on a small slice is all the evidence
> there is; the wording says so.

## README.md

**Line 16 — before**
> closed, and the run pauses for a **named human** at the actions that can't be
> undone.

**After**
> closed, and a **named human** approves one bounded Charter before the run
> starts (the models, data, safety changes and end actions it may use) and
> reviews the result at the end; nothing outside the Charter happens without
> asking.

**Line 201 — before**
> **pausing for human approval** where the rules require it.

**After**
> asking for **one approval at the start**, a Charter checked for completeness
> and approved by its hash, and stopping only for an action the Charter does not
> name.

**Lines 211–212 — before**
> - **Human approval where it matters.** Agents never send, submit, post,
>   publish, push to main, deploy, or destroy without explicit approval.

**After**
> - **Human approval where it matters, given once.** Agents never send, submit,
>   post, publish, push to main, deploy, or destroy unless a line of the
>   approved Charter names that exact action; the default Charter allows none of
>   them. Anything the Charter does not name still stops and asks.

## site/index.html

**Line 1394 (the "governs whether the work can be trusted" paragraph) — before**
> A named human approves what can't be undone, and an approval typed in another
> session doesn't count.

**After**
> A named human approves one Charter before the run, by its hash, and reviews the
> result after it; the run acts only within that Charter, and an approval typed
> in another session still doesn't count.

**Line 1091 (workflow diagram, under "Release gate") — before:** `hard stop`
**After:** `fails closed`

**Line 1419 (footer link) — before:** "The six categories a human must approve, always"
**After:** "The six categories a human must approve, and how one Charter covers them"

## Not changed

The approver-as-identity passage (line 1171), "verification by an agent that did
not write the code", the held-out evidence rule and the budget-before-spend
claim all still hold under v2 and stay as they are.

## What would make this premature

One dry run on a 120k slice. The owner may prefer to wait for a second run on a
real slice (for example the next reference-app intent) before changing the
public claim. The recommendation is to apply the README now, since it describes
the pack as shipped, and the site after a second run.
