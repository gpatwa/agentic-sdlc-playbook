# Protocol: Run Inventory

`runs/INDEX.md` is the fleet view — every slice in the repo at a glance, so
"what's in flight, what's blocked, what shipped" is one file, not a
directory walk. It is the control-plane inventory for a single product repo.

## Rules

- The Orchestrator adds a row when a slice starts, and updates its status
  when a stage advances or the slice blocks / lands.
- It is derived from each slice's `runs/<slice-id>/STATE.md` — if the two
  disagree, `STATE.md` wins and the index is corrected.
- `/agentic-status` with no argument reads and prints it.

## Template

    # Run Index

    | Slice | Tier | Status | Stage | Updated (UTC) |
    |-------|------|--------|-------|---------------|
    | <slice-id> | <1/2/3> | <in-progress / blocked-on-approval / blocked-on-failure / done> | <current stage> | <ts> |

## Why it's flat

One product repo's slices fit in one table. Cross-repo fleet inventory (many
products, many runs) is a control-plane concern *above* the pack — an
aggregator reads each repo's `runs/INDEX.md`; the pack's job is just to keep
each repo's index honest against its `STATE.md` files.
