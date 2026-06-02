# Incident Review — <incident name / ID>

> Owner: Site Reliability Engineer Agent
> Status: <draft / in review / published>
> Severity: <SEV1 / SEV2 / SEV3>
> Draft due: within 72h of resolution. Published: within 7–14 days.

This is a **blameless** postmortem. It explains the system conditions that
allowed the incident, not who acted. Assume everyone involved had good
intentions and acted on the best information available at the time.

## Summary

Two or three sentences: what broke, who was affected, how it was resolved.

## Impact (quantified)

- **Users affected:** <count / %>
- **Duration:** <start UTC> → <end UTC> (<elapsed>)
- **Error rate / degradation:** <peak, with metric>
- **Error budget consumed:** <% of the SLO's budget for the period>
- **Business / customer effect:** <revenue, missed SLA, support load>

## Timeline (UTC)

Chronological, from first signal to full resolution.

| Time (UTC) | Event |
|------------|-------|
| <ts> | <what happened — alert fired, action taken, state observed> |
| <ts> | ... |

## Detection

- How was it detected (alert / customer report / manual)?
- Time from onset to detection. If a customer found it before an alert
  did, that's an action item.

## Contributing factors (systemic, blameless)

Two to five conditions that combined to cause the incident. Frame each as
a system property, not a human error.

- <factor>
- <factor>

## What went well

- <thing that limited the blast radius or sped resolution>

## Action items

Specific, owned, dated. Separate mitigative (stop it recurring the same
way) from preventative (remove the class of failure).

| Action | Type (mitigative / preventative) | Owner | Due |
|--------|----------------------------------|-------|-----|
| <action> | <type> | <owner> | <date> |

At least one preventative item is required.

## SLO / error-budget follow-up

- Does this incident change an SLO target? <yes / no — rationale>
- Does the error budget policy trigger a feature freeze? <yes / no>

## Follow-up slices

Action items that are real product/engineering work get filed as slices
via the Orchestrator.

- <one-line slice description>

## Hand off

To Post-Launch Learning (carry-forward) and the Orchestrator (slices).
