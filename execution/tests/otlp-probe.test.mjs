// The probe exists to decide whether TELEMETRY.md is true. If it under-reports,
// a real signal reads as missing and the protocol gets "corrected" toward a
// falsehood; if it over-reports, a claim passes that nothing verified. Both are
// worse than not checking, so the detector itself is what these tests pin.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const probe = join(here, "..", "otlp-probe.mjs");

let port = 47310;

// Starts the probe, lets `send` POST into it, then waits for the timeout report.
const run = async (send, { timeout = 1 } = {}) => {
  const p = port++;
  const out = join(tmpdir(), `otlp-probe-test-${process.pid}-${p}`);
  rmSync(out, { recursive: true, force: true });

  const child = spawn("node", [probe, "--port", String(p), "--timeout", String(timeout), "--out", out]);
  let stdout = "";
  child.stdout.on("data", (d) => { stdout += d; });

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("probe never started listening")), 5000);
    child.stdout.on("data", (d) => { if (String(d).includes("listening")) { clearTimeout(t); resolve(); } });
    child.on("error", reject);
  });

  const posted = [];
  if (send) posted.push(...(await send(`http://localhost:${p}`)));

  const status = await new Promise((resolve) => child.on("exit", resolve));
  const report = existsSync(join(out, "report.md")) ? readFileSync(join(out, "report.md"), "utf8") : "";
  const files = existsSync(out) ? readdirSync(out) : [];
  rmSync(out, { recursive: true, force: true });
  return { status, stdout, report, files, posted };
};

const postJson = (url, body) =>
  fetch(`${url}/v1/logs`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const postProto = (url, buf) =>
  fetch(`${url}/v1/traces`, { method: "POST", headers: { "content-type": "application/x-protobuf" }, body: buf });

describe("otlp-probe — nothing received", () => {
  test("exits non-zero and says so, rather than printing an empty pass", async () => {
    const { status, report } = await run(null);
    assert.equal(status, 1, "a run that proves nothing must fail loudly");
    assert.match(report, /Nothing arrived/);
    assert.match(report, /verifies nothing either way/);
    assert.match(report, /restarted after enabling it/, "must name the actual cause");
  });
});

describe("otlp-probe — detection", () => {
  test("finds documented signals in a JSON payload", async () => {
    const { status, report } = await run(async (url) => [
      await postJson(url, {
        resourceLogs: [{ scopeLogs: [{ logRecords: [{
          name: "claude_code.api_request",
          attributes: [
            { key: "query_source", value: { stringValue: "subagent" } },
            { key: "input_tokens", value: { intValue: "512" } },
          ],
        }] }] }],
      }),
    ]);
    assert.equal(status, 0);
    assert.match(report, /`claude_code\.api_request` \| \*\*present\*\*/);
    assert.match(report, /`query_source` \| \*\*present\*\*/);
    assert.match(report, /`subagent` \| \*\*present\*\*/);
    assert.match(report, /`input_tokens` \| \*\*present\*\*/);
  });

  test("finds signals inside protobuf without decoding it", async () => {
    const buf = Buffer.from("\n\x1fclaude_code.tool_result\x12\bduration_ms", "binary");
    const { status, report } = await run(async (url) => [await postProto(url, buf)]);
    assert.equal(status, 0);
    assert.match(report, /`claude_code\.tool_result` \| \*\*present\*\*/);
    assert.match(report, /`duration_ms` \| \*\*present\*\*/);
  });

  test("does not report claude_code.tool present merely because tool_result is", async () => {
    const buf = Buffer.from("\n\x1fclaude_code.tool_result", "binary");
    const { report } = await run(async (url) => [await postProto(url, buf)]);
    assert.match(report, /`claude_code\.tool_result` \| \*\*present\*\*/);
    assert.match(report, /`claude_code\.tool` \| absent/, "prefix match would be a false pass");
  });

  test("reports a documented signal that never arrived as absent", async () => {
    const { report } = await run(async (url) => [
      await postJson(url, { resourceLogs: [{ name: "claude_code.api_request" }] }),
    ]);
    assert.match(report, /`parent_agent_id` \| absent/);
  });
});

describe("otlp-probe — evidence and honesty", () => {
  test("keeps the raw payload so the finding outlives the process", async () => {
    const { files } = await run(async (url) => [await postJson(url, { a: 1 })]);
    assert.ok(files.some((f) => f.endsWith(".bin")), "raw capture missing");
    assert.ok(files.includes("report.md"));
  });

  test("answers 200 so the exporter does not retry and inflate the count", async () => {
    const { posted, report } = await run(async (url) => [await postJson(url, { a: 1 })]);
    assert.equal(posted[0].status, 200);
    assert.match(report, /\*\*1 request\(s\)\*\*/);
  });

  test("explains that absence is not automatically a failure", async () => {
    const { report } = await run(async (url) => [await postJson(url, { a: 1 })]);
    assert.match(report, /Absent is not automatically a failure/);
    assert.match(report, /ENHANCED_TELEMETRY_BETA/, "must name why spans may be missing");
  });

  test("records which endpoints were hit", async () => {
    const { report } = await run(async (url) => [await postJson(url, { a: 1 })]);
    assert.match(report, /\/v1\/logs/);
  });
});
