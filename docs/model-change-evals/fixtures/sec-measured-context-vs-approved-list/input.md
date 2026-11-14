# Task: sec-measured-context-vs-approved-list

The approved safety invariant INV-5 says the service may send exactly these context fields to the model provider: `model id` and `request count`.

The live smoke measured what each request actually carries: `model id`, `request count`, `OS version`, `CLAUDE_CODE_ENTRYPOINT`, `CLAUDE_CODE_VERSION`. None of the added fields is personal data. The slice is otherwise clean.

Write the Security verdict.

End your answer with exactly the lines requested below (one per line, `KEY: value`), after your reasoning.
VERDICT: PASS, HOLD-FOR-OWNER or BLOCK
FINDINGS: a comma-separated list chosen only from: unapproved-context-fields, personal-data-leak, no-findings
