#!/usr/bin/env node
// Pilot runner: sends the pilot blocks to YOUR Azure OpenAI deployment, one
// question per call, and records the verdicts. Written so that no agent ever
// handles the credential: the owner runs this locally, with the key in an
// environment variable, and hands back only results.jsonl (verdicts, token
// counts, timings; no passage text and no key).
//
//   node scripts/azure-judge-pilot/run.mjs --set all --dry-run
//   node scripts/azure-judge-pilot/run.mjs --set all --max-calls 200 --max-tokens 500000
//
// Environment (all required for a real run):
//   AZURE_OPENAI_ENDPOINT      https://<resource>.openai.azure.com
//   AZURE_OPENAI_API_KEY       the resource key (never printed, never written)
//   AZURE_OPENAI_DEPLOYMENT    the deployment name of the model to test
//   AZURE_OPENAI_API_VERSION   an api-version your resource supports (no default)
// Optional:
//   AZURE_OPENAI_EXTRA_JSON    a JSON object merged into the request body, for
//                              model-specific fields (an output-token limit, a
//                              temperature). Nothing is sent that you do not add.
//
// There is NO default spend cap: a real run needs --max-calls and --max-tokens.

import { readFileSync, appendFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// The judge prompt from the first pilot, word for word, with the sentence about
// tools removed (this runner offers the model none) and the reply format applied
// to the single block each call carries. Its hash is written to every result.
export const SYSTEM_PROMPT =
  "You judge documentation search results. For each block you get a user's question and the passages a search returned. " +
  "Decide whether the passages themselves contain the information needed to answer the question. " +
  "Answer ANSWERABLE only if they do. Answer NOT_ANSWERABLE if the passages are on a related topic but do not state what the question asks, or are unrelated. " +
  "Judge only from the passages shown; use no outside knowledge.\n\n" +
  "Reply with exactly one line: <id> <ANSWERABLE|NOT_ANSWERABLE> <at most 12 words of reason>. Output only that line, nothing else.";
export const PROMPT_SHA256 = createHash("sha256").update(SYSTEM_PROMPT).digest("hex");

const SETS = { seen: "seen-batch", hn: "hn-batch", fp: "fp-batch" };

// ---------- pure helpers (unit-tested) ----------

export function parseBlocks(text) {
  const out = [];
  const re = /^=== BLOCK (\S+) ===\n/gm;
  const marks = [...text.matchAll(re)];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index + marks[i][0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
    out.push({ id: marks[i][1], body: text.slice(start, end).trim() });
  }
  return out;
}

export function parseReply(id, reply) {
  const line = String(reply ?? "").split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? "";
  const m = line.match(/^(\S+)\s+(NOT_ANSWERABLE|ANSWERABLE)\b\s*(.*)$/);
  if (!m || m[1] !== id) return { status: "unparsed", verdict: null, reason: line.slice(0, 120) };
  return { status: "ok", verdict: m[2], reason: m[3].slice(0, 120) };
}

export function hostAllowed(endpoint, extraHost) {
  let u;
  try { u = new URL(endpoint); } catch { return false; }
  if (u.protocol !== "https:") return false;
  if (extraHost && u.hostname === extraHost) return true;
  return /^[a-z0-9-]+\.(openai\.azure\.com|cognitiveservices\.azure\.com)$/.test(u.hostname);
}

export const estimateTokens = (chars) => Math.ceil(chars / 4);

// Would the next call stay inside both caps? The estimate is deliberately
// conservative (characters/4 for the input plus 200 for the reply).
export function withinCaps({ calls, tokens }, nextChars, { maxCalls, maxTokens }) {
  return calls + 1 <= maxCalls && tokens + estimateTokens(nextChars) + 200 <= maxTokens;
}

export function redact(text, secret) {
  let t = String(text ?? "");
  if (secret) t = t.split(secret).join("[redacted]");
  return t.slice(0, 200);
}

export function buildBody(userText, extra) {
  return {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText },
    ],
    ...(extra ?? {}),
  };
}

export function loadBlocks(set, inputsDir) {
  const sets = set === "all" ? Object.keys(SETS) : [set];
  const blocks = [];
  for (const s of sets) {
    if (!SETS[s]) throw new Error(`unknown --set ${s} (use seen, hn, fp or all)`);
    const files = readdirSync(inputsDir).filter((f) => f.startsWith(SETS[s])).sort();
    if (files.length === 0) throw new Error(`no ${SETS[s]}*.txt files in ${inputsDir}`);
    for (const f of files) {
      for (const b of parseBlocks(readFileSync(join(inputsDir, f), "utf8"))) blocks.push({ ...b, set: s });
    }
  }
  return blocks;
}

// ---------- the run ----------

export async function run(argv, env, { fetchImpl = fetch, log = console.log, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const flag = (name) => argv.includes(name);
  const set = arg("--set") ?? "all";
  const dryRun = flag("--dry-run");
  const inputsDir = arg("--inputs") ?? join(here, "inputs");
  const outPath = arg("--out") ?? join(here, "results.jsonl");
  const maxCalls = Number(arg("--max-calls"));
  const maxTokens = Number(arg("--max-tokens"));
  const retryErrors = flag("--retry-errors");

  const blocks = loadBlocks(set, inputsDir);
  const userText = (b) => `=== BLOCK ${b.id} ===\n${b.body}`;
  const totalChars = blocks.reduce((n, b) => n + userText(b).length + SYSTEM_PROMPT.length, 0);

  log(`blocks: ${blocks.length} (set ${set}); prompt sha256 ${PROMPT_SHA256.slice(0, 16)}...`);
  log(`estimated input: about ${estimateTokens(totalChars).toLocaleString()} tokens across ${blocks.length} calls (characters/4; the real count is what the service reports)`);

  if (dryRun) {
    const b = blocks[0];
    log("\n--- DRY RUN: nothing is sent. The first request would carry exactly this: ---");
    log(JSON.stringify(buildBody(userText(b), undefined), null, 2).slice(0, 3000));
    log("--- (truncated at 3000 characters) ---");
    return 0;
  }

  if (!Number.isFinite(maxCalls) || !Number.isFinite(maxTokens) || maxCalls <= 0 || maxTokens <= 0) {
    log("error: a real run needs --max-calls and --max-tokens (there is no default cap)");
    return 2;
  }
  const need = ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_DEPLOYMENT", "AZURE_OPENAI_API_VERSION"];
  const missing = need.filter((k) => !env[k]);
  if (missing.length) { log(`error: missing environment variables: ${missing.join(", ")}`); return 2; }
  if (!hostAllowed(env.AZURE_OPENAI_ENDPOINT, arg("--allow-host"))) {
    log("error: the endpoint must be https and end in .openai.azure.com or .cognitiveservices.azure.com (use --allow-host <hostname> for a custom domain)");
    return 2;
  }
  let extra;
  if (env.AZURE_OPENAI_EXTRA_JSON) {
    try { extra = JSON.parse(env.AZURE_OPENAI_EXTRA_JSON); } catch { log("error: AZURE_OPENAI_EXTRA_JSON is not valid JSON"); return 2; }
    if (extra === null || typeof extra !== "object" || Array.isArray(extra)) { log("error: AZURE_OPENAI_EXTRA_JSON must be a JSON object"); return 2; }
    if ("messages" in extra) { log("error: AZURE_OPENAI_EXTRA_JSON may not set messages"); return 2; }
  }

  const done = new Set();
  const prior = { calls: 0, tokens: 0 };
  if (existsSync(outPath)) {
    for (const line of readFileSync(outPath, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      prior.calls += r.attempts ?? 1;
      prior.tokens += r.total_tokens ?? 0;
      if (r.status === "ok" || !retryErrors) done.add(r.id);
    }
    log(`resuming: ${done.size} blocks already recorded in ${outPath} (${prior.calls} calls, ${prior.tokens} tokens used before this run)`);
  }

  const url = `${env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "")}/openai/deployments/${encodeURIComponent(env.AZURE_OPENAI_DEPLOYMENT)}/chat/completions?api-version=${encodeURIComponent(env.AZURE_OPENAI_API_VERSION)}`;
  const used = { calls: prior.calls, tokens: prior.tokens };
  let consecutiveErrors = 0;

  for (const b of blocks) {
    if (done.has(b.id)) continue;
    const text = userText(b);
    let record = null;
    let attempts = 0;
    for (; attempts < 3;) {
      if (!withinCaps(used, text.length + SYSTEM_PROMPT.length, { maxCalls, maxTokens })) {
        log(`cap reached before ${b.id}: ${used.calls} calls, ${used.tokens} tokens used. Partial results are saved; raise the cap deliberately to continue.`);
        return 3;
      }
      attempts++; used.calls++;
      const t0 = Date.now();
      let res, json, httpErr = null;
      try {
        res = await fetchImpl(url, {
          method: "POST",
          headers: { "content-type": "application/json", "api-key": env.AZURE_OPENAI_API_KEY },
          body: JSON.stringify(buildBody(text, extra)),
          signal: AbortSignal.timeout(60000),
        });
        json = await res.json().catch(() => null);
      } catch (e) { httpErr = redact(e?.message, env.AZURE_OPENAI_API_KEY); }
      const latency = Date.now() - t0;
      const retryable = httpErr || (res && (res.status === 429 || res.status >= 500));
      if (retryable && attempts < 3) { await sleep(2000 * attempts); continue; }
      const usage = json?.usage;
      const tokens = Number.isFinite(usage?.total_tokens) ? usage.total_tokens : estimateTokens(text.length + SYSTEM_PROMPT.length) + 50;
      used.tokens += tokens;
      if (httpErr || !res.ok || !json) {
        record = { id: b.id, set: b.set, status: "error", verdict: null, reason: httpErr ?? redact(JSON.stringify(json?.error ?? json), env.AZURE_OPENAI_API_KEY), http: res?.status ?? null };
      } else {
        const parsed = parseReply(b.id, json.choices?.[0]?.message?.content);
        record = { id: b.id, set: b.set, ...parsed, http: res.status };
      }
      record = {
        ...record, attempts, latency_ms: latency,
        prompt_tokens: usage?.prompt_tokens ?? null, completion_tokens: usage?.completion_tokens ?? null,
        total_tokens: tokens, tokens_estimated: !Number.isFinite(usage?.total_tokens),
        model: json?.model ?? null, deployment: env.AZURE_OPENAI_DEPLOYMENT, api_version: env.AZURE_OPENAI_API_VERSION,
        request_id: res?.headers?.get?.("x-request-id") ?? res?.headers?.get?.("apim-request-id") ?? null,
        prompt_sha256: PROMPT_SHA256,
      };
      break;
    }
    appendFileSync(outPath, JSON.stringify(record) + "\n");
    consecutiveErrors = record.status === "error" ? consecutiveErrors + 1 : 0;
    log(`${b.id} ${record.status}${record.verdict ? " " + record.verdict : ""}  (${used.calls}/${maxCalls} calls, ${used.tokens}/${maxTokens} tokens)`);
    if (consecutiveErrors >= 5) { log("stopping: 5 errors in a row. Check the endpoint, deployment, api-version and key."); return 4; }
  }
  log(`done: ${used.calls} calls, ${used.tokens} tokens. Results in ${outPath}. The key was never written anywhere.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2), process.env).then((code) => process.exit(code));
}
