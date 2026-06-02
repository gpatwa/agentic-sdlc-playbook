# Model Card — <model name> v<n>

> Owner: ML Engineer Agent
> Status: <draft / in shadow / canary / live / deprecated>
> Source tech spec: <path>

## Intended use

What this model is for, in product terms. One paragraph.

- **Predicts:** <target>
- **Used by:** <which product surface, which decision>
- **Action taken on prediction:** <what the system does — surface a
  suggestion, sort a list, gate an action>

## Out-of-scope use

What this model is **not** for. Concrete cases the team has
considered and rejected.

- <use case>: <why it's out of scope>
- <use case>: <why>

## Training data

- **Source(s):** <where the data came from, with consent / licence
  basis>
- **Size:** <rows / examples>
- **Time window:** <date range>
- **Sampling rules:** <how examples were selected>
- **Exclusions:** <what was filtered out and why>
- **Known biases / gaps:** <segments under-represented, label noise,
  collection artefacts>
- **Refresh cadence:** <how often retrained, on what trigger>

## Evaluation

- **Held-out set:** <name, size, frozen on date>
- **Headline metric(s):** <metric: value (CI or n)>
- **Slice metrics:** <segment: metric — and the floor that has to hold>

| Segment | Metric | Value | n | Note |
|---------|--------|-------|---|------|
| <seg>   | <m>    | <v>   |<n>| <…> |
| <seg>   | <m>    | <v>   |<n>| <…> |

- **Comparison to incumbent:** <incumbent name — heuristic, prior
  model version, "do nothing"; metric values; whether new model wins
  on the metric that matters>

## Fairness checks

If the prediction can affect outcomes for users in protected or
sensitive segments, list the checks run and the result. If not
applicable, say why explicitly — don't leave blank.

- <check>: <result>

## Limitations

What the model gets wrong, where, and how badly. Be specific.

- <failure mode>: <when it triggers, what the user sees>
- <failure mode>: <…>

## Monitoring

- **Drift signals:** <feature drift, prediction drift, label drift —
  what's tracked, threshold, what fires>
- **Skew check:** <training vs. serving — how compared, frequency>
- **Calibration:** <if probabilities are exposed — how monitored>
- **Latency / cost:** <SLO and what alerts>
- **Auto-rollback rule:** <named threshold + named action>

## Rollback

- **Previous version:** <name + how to switch back, in one command>
- **Tested on:** <date — actual rollback drill, not assumed>

## Reproducibility

- **Training code:** <commit SHA / path>
- **Config:** <path>
- **Seeds:** <list>
- **Compute:** <hardware / runtime needed to re-train>

## Approvals

- [ ] ML Engineer
- [ ] Security & Privacy (data, PII, retention)
- [ ] Release Manager (rollback drill verified)
- [ ] Human (per `docs/HUMAN_APPROVAL_RULES.md` if the prediction
      affects a user-visible decision)
