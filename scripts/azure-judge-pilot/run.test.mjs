import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseBlocks, parseReply, hostAllowed, withinCaps, redact, buildBody, run, SYSTEM_PROMPT } from "./run.mjs";
import { scoreSet, need } from "./score.mjs";

const fixture = "=== BLOCK Q000 ===\nQUESTION: a?\n\nSEARCH RESULT:\nx\n\n=== BLOCK Q001 ===\nQUESTION: b?\n\nSEARCH RESULT:\ny\n";

const dirWith = () => {
  const d = mkdtempSync(join(tmpdir(), "ajp-"));
  writeFileSync(join(d, "seen-batch0.txt"), fixture);
  return d;
};
const okFetch = (replies) => async (_url, init) => {
  const id = JSON.parse(init.body).messages[1].content.match(/BLOCK (\S+)/)[1];
  const reply = replies[id] ?? `${id} NOT_ANSWERABLE test`;
  return { ok: true, status: 200, headers: new Map(), json: async () => ({ model: "m", usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }, choices: [{ message: { content: reply } }] }) };
};
const env = { AZURE_OPENAI_ENDPOINT: "https://r.openai.azure.com", AZURE_OPENAI_API_KEY: "SECRETKEY", AZURE_OPENAI_DEPLOYMENT: "d", AZURE_OPENAI_API_VERSION: "2024-10-21" };

test("parseBlocks splits blocks and keeps their ids", () => {
  const b = parseBlocks(fixture);
  assert.deepEqual(b.map((x) => x.id), ["Q000", "Q001"]);
  assert.match(b[0].body, /^QUESTION: a\?/);
});

test("parseReply accepts exactly one verdict line for the right id and rejects the rest", () => {
  assert.equal(parseReply("Q000", "Q000 ANSWERABLE it says so").verdict, "ANSWERABLE");
  assert.equal(parseReply("Q000", "Q000 NOT_ANSWERABLE nope").verdict, "NOT_ANSWERABLE");
  assert.equal(parseReply("Q000", "Q001 ANSWERABLE wrong id").status, "unparsed");
  assert.equal(parseReply("Q000", "I think it is answerable").status, "unparsed");
  assert.equal(parseReply("Q000", "").status, "unparsed");
});

test("only https Azure hosts are allowed unless one is named", () => {
  assert.equal(hostAllowed("https://r.openai.azure.com"), true);
  assert.equal(hostAllowed("http://r.openai.azure.com"), false);
  assert.equal(hostAllowed("https://evil.example.com"), false);
  assert.equal(hostAllowed("https://ai.example.com", "ai.example.com"), true);
});

test("caps stop a run before the call that would pass them", () => {
  assert.equal(withinCaps({ calls: 0, tokens: 0 }, 4000, { maxCalls: 1, maxTokens: 5000 }), true);
  assert.equal(withinCaps({ calls: 1, tokens: 0 }, 4000, { maxCalls: 1, maxTokens: 5000 }), false);
  assert.equal(withinCaps({ calls: 0, tokens: 4500 }, 4000, { maxCalls: 9, maxTokens: 5000 }), false);
});

test("the key is redacted from anything echoed back", () => {
  assert.equal(redact("bad key SECRETKEY here", "SECRETKEY").includes("SECRETKEY"), false);
});

test("extra body fields are merged but cannot replace the prompt", () => {
  const b = buildBody("hi", { temperature: 0 });
  assert.equal(b.temperature, 0);
  assert.equal(b.messages[0].content, SYSTEM_PROMPT);
});

test("a dry run sends nothing and needs no key", async () => {
  const d = dirWith();
  let called = false;
  const code = await run(["--set", "seen", "--dry-run", "--inputs", d], {}, { fetchImpl: async () => { called = true; }, log: () => {} });
  assert.equal(code, 0); assert.equal(called, false);
});

test("a real run without both caps refuses to start", async () => {
  const d = dirWith();
  const code = await run(["--set", "seen", "--inputs", d, "--out", join(d, "o.jsonl")], env, { fetchImpl: okFetch({}), log: () => {} });
  assert.equal(code, 2);
});

test("a real run records verdicts, never the key and never passage text, and resumes without repeating", async () => {
  const d = dirWith(); const out = join(d, "o.jsonl");
  const args = ["--set", "seen", "--inputs", d, "--out", out, "--max-calls", "10", "--max-tokens", "100000"];
  assert.equal(await run(args, env, { fetchImpl: okFetch({ Q001: "Q001 ANSWERABLE yes" }), log: () => {} }), 0);
  const text = readFileSync(out, "utf8");
  assert.equal(text.includes("SECRETKEY"), false);
  assert.equal(text.includes("SEARCH RESULT"), false);
  const rows = text.trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => r.verdict), ["NOT_ANSWERABLE", "ANSWERABLE"]);
  let calls = 0;
  assert.equal(await run(args, env, { fetchImpl: async (...a) => { calls++; return okFetch({})(...a); }, log: () => {} }), 0);
  assert.equal(calls, 0);
});

test("the call cap stops the run and keeps what was saved", async () => {
  const d = dirWith(); const out = join(d, "o.jsonl");
  const code = await run(["--set", "seen", "--inputs", d, "--out", out, "--max-calls", "1", "--max-tokens", "100000"], env, { fetchImpl: okFetch({}), log: () => {} });
  assert.equal(code, 3);
  assert.equal(readFileSync(out, "utf8").trim().split("\n").length, 1);
});

test("an unparseable reply is recorded as unparsed, not as a verdict", async () => {
  const d = dirWith(); const out = join(d, "o.jsonl");
  await run(["--set", "seen", "--inputs", d, "--out", out, "--max-calls", "5", "--max-tokens", "100000"], env, { fetchImpl: okFetch({ Q000: "sure thing" }), log: () => {} });
  assert.equal(JSON.parse(readFileSync(out, "utf8").split("\n")[0]).status, "unparsed");
});

test("scoring uses 80% rounded up, counts non-verdicts against the judge, and ignores controls the retrieval missed", () => {
  assert.equal(need(24), 20); assert.equal(need(56), 45); assert.equal(need(20), 16);
  const key = [
    { id: "a", label: "unanswerable", in_top5: "0" }, { id: "b", label: "unanswerable", in_top5: "0" },
    { id: "c", label: "answerable", in_top5: "1" }, { id: "d", label: "answerable", in_top5: "0" },
  ];
  const s = scoreSet(key, new Map([["a", "NOT_ANSWERABLE"], ["b", "UNPARSED"], ["c", "ANSWERABLE"], ["d", "NOT_ANSWERABLE"]]));
  assert.deepEqual([s.bar1.got, s.bar1.of, s.bar2.got, s.bar2.of], [1, 2, 1, 1]);
});

test("the inputs and results are not tracked by git", () => {
  const ig = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8");
  assert.match(ig, /scripts\/azure-judge-pilot\/inputs\//);
  assert.match(ig, /scripts\/azure-judge-pilot\/results\*\.jsonl/);
});
