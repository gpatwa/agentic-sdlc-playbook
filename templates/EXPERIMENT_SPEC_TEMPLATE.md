# Experiment Spec — <slice name>

> Owner: Data Analyst Agent (with PM)
> Status: <draft / pre-registered / running / read-out>
> Source PRD: <path>

## Hypothesis

One sentence. Of the form: "If we change X, then primary metric Y will
move by at least Z, because <mechanism>."

The mechanism matters: it's what tells you whether the result generalises
or was a fluke.

## Decision the experiment informs

What will we do differently depending on the outcome? If the answer is
"nothing", don't run the experiment.

- **If primary metric moves ≥ MDE in the right direction:** <action>
- **If it doesn't move, or moves the wrong way:** <action>
- **If guardrails breach:** <action>

## Primary metric

- **Name:** <metric — link to the Analytics Engineer's definition>
- **Direction:** <up is good / down is good>
- **MDE (minimum detectable effect):** <absolute or relative>
- **Why this MDE:** <smaller wouldn't change the decision; larger would
  miss meaningful effects>

## Guardrail metrics

Metrics that, if they move the wrong way, kill the change regardless of
what the primary does.

- <metric>: <threshold that triggers a kill>
- <metric>: <threshold>

## Population

- **Eligible:** <who is included — filter conditions>
- **Excluded:** <who is excluded and why>
- **Unit of randomisation:** <user / session / account>
- **Allocation:** <e.g. 50/50, 90/10>

## Sample size and duration

- **Required sample per arm:** <n, derived from MDE, baseline, and
  power assumption>
- **Expected duration:** <days/weeks at current traffic>
- **Pre-registered stop:** <date or sample size, whichever first>
- **Early-stopping rule (if any):** <explicit, or "none — no peeking">

## Variants

- **Control:** <what users in control see / experience>
- **Treatment:** <what users in treatment see / experience>
- (If multi-arm) **Treatment B:** <…>

## Risks

- **What could confound this read?** <seasonality, concurrent launches,
  selection effects>
- **Mitigations:** <CUPED, blocking, exclusion windows, etc.>

## Readout plan

- **Who reads out:** Data Analyst.
- **When:** at pre-registered stop.
- **Format:** experiment readout following the Data Analyst's quality
  bar — primary, guardrails, decision, anti-findings.

## Hand off

Pre-launch: to the Release Manager (so the experiment is gated behind
a flag and the kill-switch is tested) and to the engineers implementing
the variants.

Post-stop: to the Data Analyst for readout, then to the PM and Release
Manager for the ship decision.
