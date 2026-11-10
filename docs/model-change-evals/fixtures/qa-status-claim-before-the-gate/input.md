# Task: check the claims against the evidence

README.md says: "Status: internally releasable."
.agentic/CURRENT_MVP_STATUS.md says: "Retrieval abstains when the top score is below the threshold."

Facts: the Security Review and the Release Gate have not run for this slice. ADR 0004 removed abstention from retrieval; the
current function is:

```python
def retrieve(query, index, k=5):
    scores = score_all(query, index)
    return top_k(scores, k)   # never abstains
```

List what is wrong, if anything.


End your answer with exactly the lines requested below (one per line, `KEY: value`), after your reasoning.
FINDINGS: a comma-separated list chosen only from: releasable-claim-unsupported, status-vs-code-mismatch, none
