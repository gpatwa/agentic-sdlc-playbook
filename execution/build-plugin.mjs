#!/usr/bin/env node
// build-plugin.mjs — assembles the Aveto Claude Code plugin (docs/REVIEW_MODE_PLAN.md, M8).
//
//   node build-plugin.mjs           write plugin/aveto/ (manifest, scripts, templates) and .claude-plugin/marketplace.json
//   node build-plugin.mjs --check   change nothing; exit 1 if the committed plugin differs from what a build would write
//
// A marketplace copies a plugin into a cache, so a plugin cannot reach `../execution`: the scripts it runs must live inside
// the plugin root. This copies them there, and --check (run by a test) fails when the copy has drifted from the source.
// The skills in plugin/aveto/skills/ are written by hand and are not touched. The plugin ships NO hooks: skills only, so nothing
// runs on an installer's machine until they invoke a skill. The manifest version is PACK_VERSION.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
export const PLUGIN_DIR = join(root, "plugin", "aveto");
export const SCRIPTS = ["assess-guard", "repo-map", "assess-plan", "assess-run", "assess-report", "assess-calibrate", "assess-judge", "assess-reassess"].map((n) => `execution/${n}.mjs`);
export const TEMPLATES = ["templates/FINDING_JUDGE_PROMPT.md"];

export const packVersion = () => Number(readFileSync(join(here, "install.mjs"), "utf8").match(/const PACK_VERSION = (\d+);/)[1]);

export const manifest = () => ({
  name: "aveto",
  displayName: "Aveto",
  version: String(packVersion()),
  description: "Assess a codebase Aveto did not build: a read-only review copy, a map, a plan, two model families as reviewers, a cross-family judge, a report and a before-and-after re-assessment. Records and reviews; it never certifies.",
  author: { name: "Gopal Patwa" },
  homepage: "https://aveto.dev",
  repository: "https://github.com/gpatwa/agentic-sdlc-playbook",
  license: "Apache-2.0",
  keywords: ["code-review", "assessment", "audit", "governance"],
});

export const marketplace = () => ({
  name: "aveto",
  owner: { name: "Gopal Patwa" },
  plugins: [{ name: "aveto", source: "./plugin/aveto", description: "Aveto assessment mode for Claude Code (skills only, no hooks)." }],
});

const json = (o) => JSON.stringify(o, null, 2) + "\n";

/** The files a build writes: [absolute path, content as a string or Buffer]. */
export function expected() {
  const files = [[join(PLUGIN_DIR, ".claude-plugin", "plugin.json"), json(manifest())], [join(root, ".claude-plugin", "marketplace.json"), json(marketplace())]];
  for (const rel of [...SCRIPTS, ...TEMPLATES]) files.push([join(PLUGIN_DIR, rel), readFileSync(join(root, rel))]);
  return files;
}

export function build({ check = false } = {}) {
  const drift = [];
  for (const [path, content] of expected()) {
    const same = existsSync(path) && Buffer.compare(readFileSync(path), Buffer.from(content)) === 0;
    if (same) continue;
    drift.push(path.replace(root + "/", ""));
    if (!check) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); }
  }
  return drift;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  const drift = build({ check });
  if (check) { if (drift.length) { console.error("plugin is out of date; run node execution/build-plugin.mjs:\n- " + drift.join("\n- ")); process.exit(1); } console.log("plugin is up to date"); }
  else console.log(drift.length ? `wrote:\n- ${drift.join("\n- ")}` : "nothing to change");
}
