# Worked Examples

Each example traces **one real slice** through the playbook end to end, so
you can see how the artefacts chain and where the gates fire — not just
read the templates in the abstract.

An example is a paper run: every artefact is filled as the owning agent
would fill it, with the handoffs intact. No code is executed; the point is
to validate that the *process* composes and the briefs carry enough context
from one stage to the next.

## Examples

| Example | Archetype | Slice | What it exercises |
|---------|-----------|-------|-------------------|
| [`saved-items-bulk-delete/`](saved-items-bulk-delete/) | B2C SaaS | Bulk-delete saved items with confirmation + audit | Stage compression, a product safety invariant (destructive action → confirm + soft-delete + audit), the QA/security/release gates |

## How to read one

1. Start with the example's `README.md` — it states the ask and records
   which stages ran, which were compressed, and why.
2. Read `.agentic/` — the product-side context every agent reads first.
   This is also a concrete sample of what a product repo's `.agentic/`
   folder looks like.
3. Walk `artefacts/` in numeric order. Each is the output of one stage and
   the input to the next.

## Adding an example

Copy the structure: a slice `README.md`, a minimal `.agentic/`, and an
`artefacts/` folder numbered by lifecycle stage. Keep the slice small —
one focused change — so the chain stays readable.
