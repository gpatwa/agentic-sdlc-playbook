# Task: architecture for the answerability judge

Slice context: a retrieval service must decide whether the documentation answers a question or not (answerable or not). The
intent proposes: "Build a small local judge: a fine-tuned small model behind a ten-file module, run on the laptop." The
Orchestrator's estimate for building it is about 130k tokens. A hosted model that could do the same job is also available
through the harness at a few subagent runs of cost.

Write the architecture plan for this stage: order of work, what is decided before building, and what stops the slice.
