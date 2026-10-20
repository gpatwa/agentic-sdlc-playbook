# Draft: a hero that says what you can do (not applied)

> **Draft for the owner's approval; nothing here is live.** The owner's critique
> (2026-10-19) of the current headline, "Approve once. Review once. The record
> covers the rest.": it describes our mechanism, not what a person can do with
> Aveto, unlike Devin ("delegate a task, get a pull request") or Kiro ("prompts become
> executable specs; plan to PR"). That is right. The mechanism is our difference;
> it belongs in the second line, not the first.

## What the others lead with (read 2026-10-19)

- **Kiro** (kiro.dev): *"Move beyond AI coding to agentic engineering."* Then three
  verbs a person does: specs from prompts, correctness checks, plan to PR.
- **Devin** (secondary sources; its own site returned an error): an AI software
  engineer you give a task and a plan, and it works in a sandbox.
- The pattern: **a verb and an outcome first** (describe, delegate, get a pull
  request), the differentiator second.

## The rule for our headline

It must say what someone can **do**, be true on the evidence we hold today, and make
the differentiator the reason to believe it. Not "you approve once"; rather "you get a
pull request that was reviewed, and here is the record that proves it."

## The category line (owner, 2026-10-19: "find something similar to Kiro's 'Move beyond AI coding to agentic engineering'")

Kiro names a shift: from what everyone does now (AI coding) to what it offers
(agentic engineering). Ours should name the shift people actually feel. The
pain, in Anthropic's own words about their engineers, is "an army of Claudes, with
every one asking for my attention": humans are the bottleneck. A web search found
no homepage using these phrases (2026-10-19; a loose check, not a trademark search).

| # | Line | Verdict |
|---|------|---------|
| 1 | **Move beyond supervising agents to reviewing outcomes.** | **Recommended.** Names the felt pain; says what the person does instead; the evidence is owner touches per run |
| 2 | Move beyond vibe coding to reviewed software. | Vivid and current; "vibe coding" may date, and "reviewed" is a smaller claim than the product's record |
| 3 | Move beyond AI coding to accountable engineering. | Closest to Kiro's shape and ours (accountable); abstract, so it needs the headline under it |
| 4 | Move beyond prompting to approving a plan. | Accurate to the Charter; sounds like less work, not more value |
| 5 | Stop babysitting your agents. | Punchy; negative framing, and "babysitting" is flip |
| 6 | Move beyond agent supervision to agent accountability. | Precise; reads as governance jargon the vocabulary rules avoid |

**Used together (recommended):** the line is a small kicker above the headline, as
Kiro does, and the headline says what you get:

> *Move beyond supervising agents to reviewing outcomes.*
> **Describe it. Get a reviewed pull request.**

## Headline options (pick one)

1. **Describe it. Get a reviewed pull request.** *(recommended)*
   Sub: *Aveto turns a paragraph into a tested, security-reviewed pull request,
   run by 28 specialist agents in your own Claude Code session on the plan you
   already pay for. You approve one Charter at the start and review the result at the
   end; the record shows who decided what in between.*
2. **From one paragraph to a pull request you can verify.**
   Same sub. Slightly more specific; "verify" points at the record.
3. **Hand it a task. Get back a reviewed pull request and the proof.**
   Closest to Devin's framing ("hand it a task"); the weakest on what is different.

Share card / `og:description` for option 1: *Describe it. Get a reviewed pull
request, with the record to prove it.*

## Exact replacement, hero (option 1)

`<h1>Describe it. Get a reviewed <span class="em">pull request.</span></h1>`

`<p class="hero-sub">Aveto turns a paragraph into a tested, security-reviewed pull request, run by 28 specialist agents in your own Claude Code session on the plan you already pay for &mdash; not a metered API bill. You approve one Charter at the start and review the result at the end; the record shows who decided what in between. At FAANG scale, nothing reaches production until an architect, an independent reviewer, security and a release gate have all signed off. Aveto hands you that process. The agent that verifies never wrote the code, gates fail closed, and every run is costed against a budget before it spends, so long work finishes instead of stalling out and starting over.</p>`

(The FAANG sentence stays as the owner decided on 2026-10-18; it is the
description of how large organisations work, kept because it carries trust.)

## New section, directly under the hero: "What you can do with it"

Each card says what a person does, then the evidence, then the limit. The status
tag (`shown`, `shown once`, `planned`) is in the card, in the same colour as the
honest-limits marks.

```html
<section id="use">
  <p class="sec-eyebrow">What you can do</p>
  <h2>Five things, and how far each is proven.</h2>
  <div class="holds">
    <div class="hold"><div class="hold-mark">01</div><div>
      <h4>Turn one paragraph into a working service.</h4>
      <p>StreakKeeper was built from a one-paragraph brief, from discovery through a tested, shipped service, with every stage independently reviewed. <strong>Shown once.</strong> One small app.</p>
    </div></div>
    <div class="hold"><div class="hold-mark">02</div><div>
      <h4>Add a feature and get it back reviewed, tested and security-checked.</h4>
      <p>Every run ends in a pull request after independent QA, a security pass and a release gate. Seven traced slices across two apps, and nine more on a third built in public. <strong>Shown repeatedly.</strong> The merge stays yours.</p>
    </div></div>
    <div class="hold"><div class="hold-mark">03</div><div>
      <h4>Ship an AI feature with the bar set before the test.</h4>
      <p>Our own support agent&rsquo;s judge refused 24 of 24 questions the docs do not answer and kept 16 of 19 that they do, on a set it had never seen. Four earlier checks failed and are on the record. <strong>Shown once, narrowly:</strong> the second bar passed by one question, and it is an attended, internal feature.</p>
    </div></div>
    <div class="hold"><div class="hold-mark">04</div><div>
      <h4>Stop watching the agent.</h4>
      <p>You approve one Charter by its hash, get a notice at each stage, and review at the end. Nothing outside the Charter happens without asking. <strong>Shown twice.</strong> A person still starts each run.</p>
    </div></div>
    <div class="hold"><div class="hold-mark">05</div><div>
      <h4>Find the risk in a codebase you did not build.</h4>
      <p>Review mode reads and reports and changes nothing, with its success bars declared before any run. <strong>Planned, not built.</strong></p>
    </div></div>
  </div>
</section>
```

## Also

- A secondary button beside "Install the pack": **See a real run**, linking to
  `github.com/gpatwa/streak-seed/tree/main/runs/health-version` (a Charter run, end to end).
- `MESSAGING.md` section 3 (the headline row) and section 8 (add claim C13, "a
  greenfield app from one paragraph", evidence `docs/VALIDATION_MATRIX.md`) change
  with it.
- The `<title>` keeps "the AI-native SDLC you can install" for search.

## What would make this wrong

Claim 01 rests on one app, and claim 03 on a one-question margin. They are worded
that way on purpose. If the owner would rather lead with only the strongest two
(02 and 04) and keep 01 and 03 for the evidence section, the hero is unchanged and
the section shrinks to two cards.
