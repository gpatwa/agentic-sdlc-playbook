import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { collectSpawns, drift, render } from "../model-drift.mjs";

const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "model-drift.mjs");
const spawn = (role, models, at, extra = {}) => ({ role, generic: false, finishedAt: at, measured: { models }, ...extra });
const usage = (spawns) => JSON.stringify({ schema: "aveto/usage@1", spawns });
const repoWith = (slices) => {
  const d = mkdtempSync(join(tmpdir(), "drift-"));
  for (const [name, spawns] of Object.entries(slices)) { mkdirSync(join(d, "runs", name), { recursive: true }); writeFileSync(join(d, "runs", name, "usage.json"), usage(spawns)); }
  return d;
};
const BASE = { "qa-evidence": { model: "claude-sonnet-5-5", date: "2026-11-13" }, "software-architect": { model: "claude-opus-5-5", date: "2026-11-13" } };

describe("model-drift", () => {
  test("collects logged models per non-generic spawn, oldest first, skipping bad files", () => {
    const d = repoWith({
      a: [spawn("qa-evidence", ["claude-sonnet-5-5"], "2026-11-14T00:00:00Z"), spawn("x", ["claude-opus-5-5"], "2026-11-14T00:00:00Z", { generic: true }), spawn("sre", [], "2026-11-14T00:00:00Z")],
      b: [spawn("software-architect", ["claude-opus-5-5"], "2026-11-13T00:00:00Z")],
    });
    mkdirSync(join(d, "runs", "broken")); writeFileSync(join(d, "runs", "broken", "usage.json"), "not json");
    const s = collectSpawns(d);
    assert.deepEqual(s.map((x) => x.role), ["software-architect", "qa-evidence"]);
    rmSync(d, { recursive: true, force: true });
  });

  test("a role on its baseline model is ok; a role on a different model is stale; a role with no baseline says so", () => {
    const spawns = [
      spawn("qa-evidence", ["claude-sonnet-5-5"], "2026-11-14T00:00:00Z"),
      spawn("software-architect", ["claude-opus-6-0"], "2026-12-01T00:00:00Z"),
      spawn("sre", ["claude-sonnet-5-5"], "2026-11-14T00:00:00Z"),
    ].map((s) => ({ slice: "s", role: s.role, models: s.measured.models, at: s.finishedAt }));
    const by = Object.fromEntries(drift(spawns, BASE).map((r) => [r.role, r]));
    assert.equal(by["qa-evidence"].status, "ok");
    assert.equal(by["software-architect"].status, "stale");
    assert.match(by["software-architect"].note, /baseline claude-opus-5-5.*rescore before relying/);
    assert.equal(by.sre.status, "no-baseline");
  });

  test("the verdict follows the most recent spawn, and the history shows when each model was first seen", () => {
    const spawns = [
      { slice: "a", role: "software-architect", models: ["claude-opus-5-5"], at: "2026-11-13T00:00:00Z" },
      { slice: "b", role: "software-architect", models: ["claude-opus-6-0"], at: "2026-12-01T00:00:00Z" },
      { slice: "c", role: "software-architect", models: ["claude-opus-5-5"], at: "2026-12-05T00:00:00Z" },
    ];
    const [r] = drift(spawns, BASE);
    assert.equal(r.status, "ok", "back on the baseline model");
    assert.deepEqual(r.seen.map((x) => x.model), ["claude-opus-5-5", "claude-opus-6-0"]);
    assert.match(render([r]), /three ways: an alias resolving to a newer model, the session's own model[^]*C3 lines/);
    assert.match(render([r]), /has run on: claude-opus-5-5 \(first seen 2026-11-13\), claude-opus-6-0 \(first seen 2026-12-01\)/);
  });

  test("the command line exits 1 when a role is stale, 0 when none is, 2 on bad usage", () => {
    const stale = repoWith({ a: [spawn("qa-evidence", ["claude-sonnet-6-0"], "2026-12-01T00:00:00Z")] });
    const fine = repoWith({ a: [spawn("qa-evidence", ["claude-sonnet-5-5"], "2026-11-14T00:00:00Z")] });
    const bf = join(stale, "base.json"); writeFileSync(bf, JSON.stringify(BASE));
    const run = (repo) => spawnSync(process.execPath, [cli, repo, "--baselines", bf], { encoding: "utf8" });
    const s = run(stale); assert.equal(s.status, 1); assert.match(s.stdout, /STALE qa-evidence/);
    assert.equal(run(fine).status, 0);
    assert.equal(spawnSync(process.execPath, [cli], { encoding: "utf8" }).status, 2);
    for (const d of [stale, fine]) rmSync(d, { recursive: true, force: true });
  });
});
