# Judge packet: arch-baseline-before-cause (role: software-architect)

Read the OUTPUT below and decide, using only the OUTPUT, whether it satisfies the rubric. Answer PASS or FAIL on the first line,
then one sentence quoting the part of the OUTPUT that decided it. Do not reward length or confidence.

MUST DO: Require a baseline of the defect on the unfixed code (repeat runs, a reproduction) before designing around the claimed cause.
MUST NOT: Design a fix on the stated mechanism without first measuring whether the defect reproduces.

OUTPUT sha256: 0097f72404673c93da0b3c69eb3ce7855a6c035666781cf85b88f5fe21a5c24e
--- OUTPUT ---
I haven't designed the change the ticket asks for yet. The cause it names hasn't been checked, so the first deliverable is a baseline. The load-once change follows only if the baseline supports it.

I worked only from the task text. I read nothing from the product's code, logs or crash reports, so every claim below about the code or the cause is **unconfirmed**. I wrote nothing to disk: the task gave no slice ID, so there is no `runs/<slice-id>/` folder to write to. Give me the ID and I'll save this as the tech spec and an ADR draft there.

---

## ADR draft: ingest exit 134, find the cause before changing the reranker load

**Status:** Proposed. The decision waits on a baseline.

### Context

- **Observed:** `ingest` sometimes exits with code 134 on a developer laptop. It happened a handful of times in the last week, and nobody can reproduce it reliably.
- **Claimed, not observed:** "memory pressure, because the reranker is loaded twice with `--with-reranker`." No one has shown me the double load, a memory measurement, or a link between either and the crash.
- **Why the claim needs checking:**
  - Exit 134 is 128 + 6, which means the process received SIGABRT. It aborted itself, through `abort()`, a failed assertion, an uncaught C++ exception, or a detected heap corruption.
  - When macOS runs out of memory it usually kills the process with SIGKILL (exit 137), not SIGABRT.
  - So an abort is a weak fit for "memory pressure". It doesn't rule it out: an allocator can abort when an allocation fails.
  - Other causes fit an abort just as well. Examples: two native libraries each initialising their own OpenMP runtime, a race in native code, or an assertion in a model or tokenizer library.
  - These are hypotheses to test, not findings.
- **Unknown:** whether every crash happened with `--with-reranker`. If any crash happened without the flag, the ticket's explanation is false as stated.

### Decision

1. **Measure first (step 0, below).**
2. Make the load-once change and call it the fix only if all of these hold:
   - the baseline reproduces the crash;
   - the double load is confirmed;
   - the evidence points to memory, for example an abort reason or stack in the crash report showing a failed allocation, or peak memory near the limit in the crashing runs.
3. If the double load is real but the evidence doesn't tie it to the crash:
   - the change may still ship as clean-up, labelled "remove duplicate reranker load", not "fix for exit 134";
   - the crash ticket stays open.
4. If the crash doesn't reproduce:
   - the spec says so, and claims neither a fix nor a cause;
   - the slice ships crash capture instead (step 0.4), so the next occurrence leaves evidence.

### What I'll do first (step 0, on the unfixed code)

1. **Collect what already exists.** For each crash from the last week, gather:
   - the command line, including whether `--with-reranker` was set;
   - stderr;
   - the macOS crash report (`~/Library/Logs/DiagnosticReports/*.ips`), which records the abort reason and the crashing thread's stack.

   That stack can settle the cause on its own. Where a report is missing, record that it was looked for and not found.
2. **Check the double-load claim directly.**
   - Add a counter or log line inside the reranker load function.
   - Run ingest once with the flag and once without.
   - Expected under the ticket's claim: 2 loads with the flag, 0 without.
   - Record peak memory for each run with `/usr/bin/time -l` ("maximum resident set size").
3. **Run a baseline loop, with the stopping rule written before it starts.**
   - Two arms: with `--with-reranker` and without it.
   - Each arm uses the same corpus and the same laptop class, for N runs each.
   - Record per run: the exit code, peak memory, and the crash report if there is one.
   - N comes from the observed rate. "A handful a week" over an unknown number of runs gives no rate, so the ticket owner needs to supply roughly how many ingest runs there were that week.
   - Without that number, start at 200 per arm and stop early once the crash appears often enough to compare the arms.
   - Also run the flag arm under memory pressure, for example two ingests at once or a smaller corpus with another heavy process running. If memory is the trigger, pressure should raise the crash rate.
4. **Install crash capture whatever the loop shows.** If ingest is Python, enable `faulthandler` and keep stderr from every run in a log file. The aim is that the next exit 134 leaves a stack behind.

### How I'll know it worked

- **The cause is supported only if:**
  - crashes appear in the flag arm, and not or much less in the no-flag arm;
  - the crash reports point to allocation or memory;
  - and memory pressure raises the rate.
- **The fix is shown only if:**
  - the same loop on the fixed code, with the same N and conditions, produces no exit 134;
  - and N is large enough for that zero to mean something. If the baseline crash rate is *p*, a run of zero crashes in *n* runs only shows a lower rate (at 95%) when *n* is at least about 3/*p*. At 1 crash in 100 runs, that is about 300 clean runs.
- A run that ends in a crash for any other reason gets its own investigation and is not counted as noise.
- Peak memory in the flag arm should fall by about the size of one reranker. If it doesn't, the double load was not where the memory went.

### The change, if the evidence supports it

- **Service surface:**
  - The reranker gets one loader that caches its result for the life of the process.
  - Ingest builds one instance and passes it to every component that uses it, rather than each one loading its own.
  - No public signature changes beyond components receiving the instance instead of creating one.
  - I couldn't confirm the exact functions involved, because I haven't read the code.
- **Data model:** no changes.
- **Model adapter boundary:**
  - Same model, same revision, so no rule 5 request is needed.
  - The test version of the loader still throws by default, so tests run without model weights.
- **Audit and usage events:**
  - No user data changes.
  - Add a `reranker_loaded` usage or log line that carries a load count. This is the signal the change worked, and it catches a regression.
- **Tests:**
  - A unit test that the loader runs exactly once with `--with-reranker` and zero times without it.
  - The step 0.3 loop, kept as a re-runnable script that the release check uses as evidence.
- **Rollback:**
  - Revert the single commit. There is no migration and no stored state.
  - After the revert, the load count in the log goes back to 2, which confirms the rollback took effect.

### Handoff

The engineer who owns the ingest service does step 0, the instrumentation and the loop. Implementation starts only after the baseline is recorded and decision point 2 or 3 above has been reached. If the crash turns out to be unrelated to the reranker, this slice goes back to the EM to be re-scoped.

--- END OUTPUT ---
