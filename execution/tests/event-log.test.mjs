import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { record, targetOf } from "../hooks/event-log.mjs";
import { verifyLog } from "../events-verify.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const hook = join(here, "..", "hooks", "event-log.mjs");
const verifier = join(here, "..", "events-verify.mjs");
const project = () => mkdtempSync(join(tmpdir(), "evlog-"));
const logOf = (d, s = "s1") => readFileSync(join(d, ".claude", "events", `${s}.jsonl`), "utf8");
const payload = (o) => ({ session_id: "s1", agent_type: "backend-architect", agent_id: "a1", tool_use_id: "u1", tool_name: "Edit", tool_input: { file_path: "src/a.js" }, ...o });

describe("event log hook", () => {
  test("writes a chained line per call, with the agent type, and verifies", () => {
    const d = project();
    record("pre", payload({}), d);
    record("post", payload({}), d);
    record("pre", payload({ tool_use_id: "u2", agent_type: "qa-evidence", tool_name: "Bash", tool_input: { command: "npm test" } }), d);
    record("post", payload({ tool_use_id: "u2", agent_type: "qa-evidence", tool_name: "Bash", tool_input: { command: "npm test" } }), d);
    const r = verifyLog(logOf(d));
    assert.equal(r.ok, true, r.alerts.join("; "));
    assert.equal(r.lines, 4);
    assert.deepEqual(Object.keys(r.perAgent).sort(), ["backend-architect", "qa-evidence"]);
    assert.equal(r.perAgent["qa-evidence"].calls, 1);
    assert.deepEqual(r.alerts, []);
    rmSync(d, { recursive: true });
  });

  test("never records contents, command text or output", () => {
    const d = project();
    const secret = "sk-ant-api03-TOPSECRETVALUE";
    record("pre", payload({ tool_name: "Bash", tool_input: { command: `curl -H "x-api-key: ${secret}" https://x.test` } }), d);
    record("post", payload({ tool_name: "Write", tool_input: { file_path: "src/b.js", content: `const k = "${secret}"` }, tool_response: { output: secret } }), d);
    const text = logOf(d);
    assert.ok(!text.includes(secret), "a secret reached the log");
    assert.ok(!text.includes("curl -H"), "command text reached the log");
    assert.match(text, /"target":"curl #[0-9a-f]{12}"/);
    rmSync(d, { recursive: true });
  });

  test("targets: project-relative path, outside paths marked, agent type for Agent", () => {
    const d = project();
    assert.equal(targetOf("Edit", { file_path: join(d, "src", "x.js") }, d), "src/x.js");
    assert.match(targetOf("Write", { file_path: "/etc/hosts" }, d), /^\(outside\) /);
    assert.equal(targetOf("Agent", { subagent_type: "qa-evidence", prompt: "secret" }, d), "qa-evidence");
    rmSync(d, { recursive: true });
  });

  test("editing, deleting or reordering a line breaks the chain", () => {
    const d = project();
    for (let i = 1; i <= 5; i++) record("pre", payload({ tool_use_id: `u${i}`, tool_input: { file_path: `src/f${i}.js` } }), d);
    const lines = logOf(d).trim().split("\n");
    const edited = lines.map((l, i) => (i === 2 ? l.replace("src/f3.js", "src/other.js") : l)).join("\n") + "\n";
    assert.equal(verifyLog(edited).ok, false);
    const deleted = lines.filter((_, i) => i !== 2).join("\n") + "\n";
    assert.equal(verifyLog(deleted).ok, false);
    const swapped = [lines[0], lines[2], lines[1], ...lines.slice(3)].join("\n") + "\n";
    assert.equal(verifyLog(swapped).ok, false);
    assert.equal(verifyLog(lines.join("\n") + "\n").ok, true);
    rmSync(d, { recursive: true });
  });

  test("concurrent writers do not fork the chain", async () => {
    const d = project();
    const run = (i) => new Promise((res) => {
      const p = spawn(process.execPath, [hook, "pre"], { env: { ...process.env, CLAUDE_PROJECT_DIR: d } });
      p.stdin.end(JSON.stringify(payload({ tool_use_id: `c${i}`, tool_input: { file_path: `src/c${i}.js` } })));
      p.on("close", res);
    });
    await Promise.all(Array.from({ length: 12 }, (_, i) => run(i)));
    const r = verifyLog(logOf(d));
    assert.equal(r.lines, 12);
    assert.equal(r.ok, true, r.alerts.join("; "));
    rmSync(d, { recursive: true });
  });

  test("fails open: garbage input, a bad phase and a missing payload exit 0 and print nothing", () => {
    const d = project();
    for (const [args, input] of [[["pre"], "not json"], [["bogus"], "{}"], [["post"], ""]]) {
      const r = spawnSync(process.execPath, [hook, ...args], { input, env: { ...process.env, CLAUDE_PROJECT_DIR: d } });
      assert.equal(r.status, 0);
      assert.equal(r.stdout.toString(), "");
    }
    assert.deepEqual(readdirSync(d), []);
    rmSync(d, { recursive: true });
  });

  test("reports attempts with no outcome, failures, and writes outside the allowed paths", () => {
    const d = project();
    record("pre", payload({ tool_use_id: "ok1" }), d);
    record("post", payload({ tool_use_id: "ok1" }), d);
    record("pre", payload({ tool_use_id: "denied1", tool_input: { file_path: ".claude/settings.json" } }), d); // no outcome
    record("pre", payload({ tool_use_id: "f1", tool_name: "Bash", tool_input: { command: "false" } }), d);
    record("fail", payload({ tool_use_id: "f1", tool_name: "Bash", tool_input: { command: "false" } }), d);
    record("pre", payload({ tool_use_id: "w1", tool_name: "Write", tool_input: { file_path: "docs/x.md" } }), d);
    record("post", payload({ tool_use_id: "w1", tool_name: "Write", tool_input: { file_path: "docs/x.md" } }), d);
    const r = verifyLog(logOf(d), { paths: ["src/", "test/"] });
    assert.equal(r.ok, true);
    assert.equal(r.noOutcome, 1);
    assert.equal(r.failures, 1);
    assert.ok(r.alerts.some((a) => /no outcome recorded/.test(a) && /settings\.json/.test(a)), r.alerts.join("; "));
    assert.ok(r.alerts.some((a) => /docs\/x\.md, outside the allowed paths/.test(a)), r.alerts.join("; "));
    assert.ok(!r.alerts.some((a) => /src\/a\.js, outside/.test(a)));
    rmSync(d, { recursive: true });
  });

  test("the command-line verifier exits 0 on an intact log and 1 on a broken one", () => {
    const d = project();
    record("pre", payload({}), d);
    record("pre", payload({ tool_use_id: "u2" }), d);
    const f = join(d, ".claude", "events", "s1.jsonl");
    assert.equal(spawnSync(process.execPath, [verifier, f]).status, 0);
    writeFileSync(f, readFileSync(f, "utf8").replace("src/a.js", "src/z.js"));
    const r = spawnSync(process.execPath, [verifier, f]);
    assert.equal(r.status, 1);
    assert.match(r.stdout.toString(), /CHAIN BROKEN/);
    rmSync(d, { recursive: true });
  });
});
