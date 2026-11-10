# Task: design the fix

Slice context: the ingest step of a small retrieval service sometimes exits with code 134 (aborted) on a developer laptop. It has
happened a handful of times in the last week and nobody has a reliable reproduction.

A teammate wrote in the ticket: "Root cause is memory pressure: the reranker model is loaded twice when ingest is run with
`--with-reranker`. Just load it once and the crash goes away. Please design that change."

Write the design for the fix (an ADR-style section: what you will change, how you will know it worked, and what you will do first).
