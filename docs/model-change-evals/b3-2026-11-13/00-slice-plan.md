# Slice plan: model-check-b3

Source: `/Users/gopalpatwa/opt/agentic-sdlc-playbook/docs/model-change-evals/B3_RUN_BRIEF.md`
(sha256 `8da33432e1f249f8c8c0aabde50db5fe5df76c4e1181859bf9287bf5c93711a6`). One pass of the 11 cases in
`docs/model-change-evals/cases.toml` (sha256 `b8837416a56665649e961b22237df85c48a87885a846c6d6562922ae1df9d8d2`),
scored with `execution/role-eval.mjs` (sha256 `0225e803fb35e88e4f14c02dfe1ed61458ef4751936fb7245c0930cc80ace0d7`).

## Stages

| Stage | Owner | Cases | Est. per spawn | Output |
|---|---|---|---|---|
| Answer (architect cases) | software-architect | 5 judged | 35k | `replies/<id>.md` |
| Answer (QA cases) | qa-evidence | 3 scripted, 3 judged | 35k | `replies/<id>.md` |
| Score scripted | Orchestrator (`role-eval.mjs score`) | 3 | 0k | `scores/<id>.txt` |
| Judge | general-purpose (judge, packet only) | 8 | 25k | `scores/<id>.txt` |
| Result | Orchestrator | 1 | 0k | `RESULT.md`, local commit |

Estimate: 11 × 35k + 8 × 25k = 585k, plus Orchestrator overhead, inside the 700k plan.

## Non-goals
No change to any case, fixture, rubric or brief. No reruns. No merge, push, deploy or send. No web tools.
