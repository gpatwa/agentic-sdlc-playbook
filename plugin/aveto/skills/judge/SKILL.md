---
name: judge
description: Judge a random sample of an assessment's open findings with a model from a different family than the reviewer. Verdicts are provisional; the owner's dispositions outrank them.
disable-model-invocation: true
argument-hint: <records-dir> --judge codex|claude [--n 30]
---

# /aveto:judge

Judges a seeded random sample of the open findings in an assessment's `reviews/FINDINGS.md`. The judge must be a **different model family** from the reviewer that wrote the findings (the script refuses otherwise unless `--allow-same-family`, which is recorded; do not pass it without asking the user).

```bash
node "${CLAUDE_PLUGIN_ROOT}/execution/assess-judge.mjs" <records-dir> --judge <codex|claude> --n 30 --seed <number>
```

Pass the user's values as separate arguments, never inside a quoted shell string. Use `--dry-run` first to show how many findings would be judged.

Report: how many were judged, the counts of confirmed, rejected, intentional and unclear, and that **these are a model's opinions, not the owner's dispositions**. Say that a judge which never rejects may be lenient. Do not edit `FINDINGS.md` yourself.
