# Azure judge pilot

Tests whether the model deployed in **your** Azure OpenAI resource separates
"the shown passages answer this question" from "they do not", on the same 165
questions the Claude pilots used (`docs/pilots/2026-10-llm-answerability-pilot.md`).
It exists because those pilots tested Anthropic's models, not yours.

**No agent handles your key.** You run this on your machine with the key in an
environment variable. The results file holds verdicts, token counts and timings;
it never holds the key or any passage text. You give the results file back to the
support session, which scores it against the answer key you cannot see here.

## Before you run it

1. Decide the cap. **There is no default**; a real run refuses to start without
   `--max-calls` and `--max-tokens`. The full set is 165 calls and about 421,000
   input tokens (`--dry-run` prints the estimate for your copy; the service's own
   count is what is recorded). The runner stops *before* the call that would pass
   a cap and keeps what it has saved.
2. Choose the deployment and an `api-version` your resource supports. The runner
   builds `https://<resource>.openai.azure.com/openai/deployments/<name>/chat/completions?api-version=<v>`
   with an `api-key` header, as Microsoft's REST reference describes.
3. Some models want extra request fields (an output-token limit, a temperature,
   a different token parameter). Put them, if you need them, in
   `AZURE_OPENAI_EXTRA_JSON`; nothing is sent that you do not add. Check your
   model's documentation for the parameter names; this runner does not guess them.

## Run it

```bash
export AZURE_OPENAI_ENDPOINT="https://<your-resource>.openai.azure.com"
export AZURE_OPENAI_DEPLOYMENT="<deployment name>"
export AZURE_OPENAI_API_VERSION="<an api-version your resource supports>"
read -rs AZURE_OPENAI_API_KEY && export AZURE_OPENAI_API_KEY   # type the key, then Enter; it is not echoed
```

See exactly what would be sent first (sends nothing, needs no key):

```bash
node scripts/azure-judge-pilot/run.mjs --set all --dry-run
```

A three-call smoke test (it stops on purpose at the cap, exit code 3):

```bash
node scripts/azure-judge-pilot/run.mjs --set fp --max-calls 3 --max-tokens 20000
```

The full run, with the cap you chose:

```bash
node scripts/azure-judge-pilot/run.mjs --set all --max-calls 200 --max-tokens 500000
```

It is safe to stop and rerun: finished questions are skipped. `--retry-errors`
redoes only the ones that failed.

## What it does not do

- It does not retry more than twice, does not continue after five errors in a
  row, and does not send to any host that is not an Azure OpenAI endpoint
  (use `--allow-host <hostname>` for a custom domain).
- It does not print or store the key, and it redacts the key from any error text
  the service echoes.
- It is a pilot, not the product's judge: one question per call, the prompt of
  the Claude pilots (hash printed), no retrieval, no fifth-set questions.

## Then

Hand `scripts/azure-judge-pilot/results.jsonl` to the support session. It scores
the file with `score.mjs` against the sealed keys and reports the same two bars
as before, plus the cost and latency you measured.
