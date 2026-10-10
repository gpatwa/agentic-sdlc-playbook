#!/usr/bin/env node
// Scores a results.jsonl from run.mjs against the sealed answer keys, by the
// bars the pilots registered: at least 80% (rounded up) of the unanswerable
// questions flagged NOT_ANSWERABLE, and at least 80% (rounded up) of the answerable
// questions whose right file retrieval put in the top five answered ANSWERABLE.
// An error or an unparseable reply counts against the judge (fail closed).
//
//   node score.mjs --results results.jsonl --key-seen K1.json --key-hn K2.json --key-fp K3.json
//
// The key files are held by the support session, not shipped with the runner.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const need = (n) => Math.ceil(n * 0.8);

export function scoreSet(key, verdicts) {
  const unans = key.filter((k) => k.label === "unanswerable");
  const hit = key.filter((k) => k.label === "answerable" && k.in_top5 === "1");
  const b1 = unans.filter((k) => verdicts.get(k.id) === "NOT_ANSWERABLE");
  const b2 = hit.filter((k) => verdicts.get(k.id) === "ANSWERABLE");
  return {
    bar1: { got: b1.length, of: unans.length, need: need(unans.length) },
    bar2: { got: b2.length, of: hit.length, need: need(hit.length) },
    wrongUnanswerable: unans.filter((k) => verdicts.get(k.id) !== "NOT_ANSWERABLE").map((k) => k.uid ?? k.id),
    wrongAnswerable: hit.filter((k) => verdicts.get(k.id) !== "ANSWERABLE").map((k) => k.uid ?? k.id),
    missing: key.filter((k) => !verdicts.has(k.id)).map((k) => k.id),
  };
}

export function loadVerdicts(path) {
  const verdicts = new Map();
  let calls = 0, tokens = 0, latency = 0, errors = 0, unparsed = 0;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    calls += r.attempts ?? 1; tokens += r.total_tokens ?? 0; latency += r.latency_ms ?? 0;
    if (r.status === "error") errors++;
    if (r.status === "unparsed") unparsed++;
    verdicts.set(r.id, r.status === "ok" ? r.verdict : r.status.toUpperCase());
  }
  return { verdicts, calls, tokens, latency, errors, unparsed };
}

function main(argv) {
  const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const results = arg("--results");
  if (!results) { console.log("usage: score.mjs --results results.jsonl --key-seen F --key-hn F --key-fp F"); return 2; }
  const { verdicts, calls, tokens, latency, errors, unparsed } = loadVerdicts(results);
  console.log(`calls ${calls}, tokens ${tokens}, mean latency ${verdicts.size ? Math.round(latency / verdicts.size) : 0} ms, errors ${errors}, unparsed ${unparsed}`);
  for (const [name, flag] of [["seen sets", "--key-seen"], ["hard negatives", "--key-hn"], ["false premises", "--key-fp"]]) {
    const f = arg(flag); if (!f) continue;
    const s = scoreSet(JSON.parse(readFileSync(f, "utf8")), verdicts);
    const ok1 = s.bar1.got >= s.bar1.need, ok2 = s.bar2.got >= s.bar2.need;
    console.log(`\n${name}: Bar 1 ${s.bar1.got}/${s.bar1.of} (need ${s.bar1.need}) ${ok1 ? "PASS" : "FAIL"}   Bar 2 ${s.bar2.got}/${s.bar2.of} (need ${s.bar2.need}) ${ok2 ? "PASS" : "FAIL"}`);
    if (s.wrongUnanswerable.length) console.log(`  unanswerable not flagged: ${s.wrongUnanswerable.join(", ")}`);
    if (s.wrongAnswerable.length) console.log(`  answerable not answered:  ${s.wrongAnswerable.join(", ")}`);
    if (s.missing.length) console.log(`  no result for: ${s.missing.join(", ")}`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
