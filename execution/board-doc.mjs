#!/usr/bin/env node
// board-doc: turn a run's own records into the rows the Aveto Control page shows (pack v37).
//
//   node execution/board-doc.mjs <runs/slice-dir> --track improve|built --repo <name> [--records-url <url>] [--session <title>]
//
// Reads runs/<slice>/STATE.md (and END_REVIEW.md if present). Writes two small JSON files beside them,
// BOARD_RUN.json (one document for the "runs" collection) and BOARD_SESSION.json (one for "sessions"), and
// prints their paths. It makes no network call and no model call: the Orchestrator then sends each file
// with the ArtifactData tool (`set`, `file_path`) if, and only if, the approved Charter has a C4.B line
// naming the board. See pack/protocols/CONTROL_BOARD.md.
//
// What goes in: the ask line, the stage names and owner roles, a one-phrase status per stage, token counts,
// and what waits on the owner. What never goes in: file contents, diffs, commands, secrets, or approval words.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { parseState, parseEndReview, tokens } from "./runs-dashboard.mjs";

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// A stage's status text is often a sentence ("done: #6 option A, ..."); the board shows the first phrase only.
const oneWord = (s) => clip(String(s ?? "").split(/\s*(?::|\u2014|;|\()\s*/)[0], 40) || "-";

// "| Stage | Owner | Status | Artefact | Gate |" rows under "## Stages", until the next heading.
export function parseStages(text) {
  const out = [];
  if (!text) return out;
  const lines = text.split("\n");
  const at = lines.findIndex((l) => /^##\s+Stages\b/i.test(l));
  if (at === -1) return out;
  for (const l of lines.slice(at + 1)) {
    if (/^##\s/.test(l)) break;
    if (!l.trim().startsWith("|") || /^\|\s*-/.test(l.trim()) || /^\|\s*Stage\s*\|/i.test(l)) continue;
    const c = l.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
    if (c.length < 3 || !c[0] || /^\.\.\.$/.test(c[0])) continue;
    out.push({ name: clip(c[0], 60), role: clip(c[1], 60), verdict: oneWord(c[2]) });
  }
  return out;
}

// The first approval row still PENDING, as "action (rule n)".
export function pendingApproval(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const at = lines.findIndex((l) => /^##\s+Approvals\b/i.test(l));
  if (at === -1) return null;
  for (const l of lines.slice(at + 1)) {
    if (/^##\s/.test(l)) break;
    const c = l.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
    if (c.length >= 4 && /^pending$/i.test(c[3])) return clip(`${c[0]}${c[1] ? ` (rule ${c[1]})` : ""}`, 120);
  }
  return null;
}

// Open items for the owner in END_REVIEW.md: the numbered lines under "Blocked on you" (or "me"), or "OPEN items".
// (The runs dashboard's parser reads only "Blocked on me"; tracked as T48.)
export function openItems(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const at = lines.findIndex((l) => /^##\s+.*(Blocked on (you|me)|OPEN items)/i.test(l));
  if (at === -1) return null;
  let n = 0;
  for (const l of lines.slice(at + 1)) { if (/^##\s/.test(l)) break; if (/^\d+\.\s/.test(l)) n++; }
  return n;
}

const field = (text, label) => ((text || "").match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+?)(?:\\s{2,}·|\\s*$)`, "m")) || [])[1] ?? null;

export function buildDocs({ slice, state, endReview, track, repo, recordsUrl, session, now = new Date() }) {
  const st = parseState(state);
  // Some state files write the cap as prose ("hard cap 1,200k (C2.3)"), not as the "**Hard cap:**" line the shared parser reads.
  if (st.hardCap == null) { const m = String(state ?? "").match(/hard cap[^0-9\n]{0,6}([\d.,]+\s*[kKmM]?)/i); if (m) st.hardCap = tokens(m[1]); }
  const er = { open: openItems(endReview) ?? parseEndReview(endReview).open };
  const status = st.status || "in-progress";
  const stages = parseStages(state);
  const ask = clip(field(state, "Ask") || slice, 200);
  const pending = status === "blocked-on-approval" ? pendingApproval(state) || "an approval" : null;
  let waiting = "";
  if (pending) waiting = `Approval pending: ${pending}. Answer it in the session driving the run.`;
  else if (status === "blocked-on-failure") waiting = "Blocked on a failure the run could not resolve; it needs you.";
  else if (status === "done" && er.open > 0) waiting = `END_REVIEW.md lists ${er.open} item${er.open === 1 ? "" : "s"} for you; some may already be closed there, check which.`;
  const upd = field(state, "Updated");
  const ts = upd ? Date.parse(/Z$/.test(upd) ? upd : `${upd}Z`) : NaN;
  const updatedAt = Number.isFinite(ts) ? new Date(ts).toISOString() : now.toISOString();
  const result = waiting && !/END_REVIEW/.test(waiting) ? "waiting on you" : status === "done" ? "done" : status === "blocked-on-failure" ? "blocked" : "running";
  const run = {
    name: slice, track, repo, result,
    ...(st.spent != null ? { spent: st.spent } : {}),
    ...(st.budget != null ? { plan: st.budget } : {}),
    ...(st.hardCap != null ? { cap: st.hardCap } : {}),
    summary: ask,
    stages,
    records: `runs/${slice}`,
    ...(recordsUrl ? { recordsUrl } : {}),
    ...(waiting ? { waiting } : {}),
    updatedAt,
  };
  const current = field(state, "Current stage");
  const sess = {
    title: clip(session || `Run ${slice}`, 80), track, kind: "run",
    state: waiting && !/END_REVIEW/.test(waiting) ? "waiting" : status === "done" ? (er.open > 0 ? "to-check" : "done") : "running",
    purpose: ask,
    status: clip(current ? `Stage: ${current}` : status, 120),
    ...(waiting ? { waiting } : {}),
    updatedAt,
  };
  return { run, session: sess };
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? undefined : args[i + 1]; };
  const dir = args[0] && !args[0].startsWith("--") ? args[0] : undefined;
  try {
    if (!dir || !flag("track") || !flag("repo")) throw new Error("usage: board-doc.mjs <runs/slice-dir> --track improve|built --repo <name> [--records-url <url>] [--session <title>]");
    if (!["improve", "built"].includes(flag("track"))) throw new Error('--track must be "improve" or "built"');
    const d = resolve(dir);
    const state = read(join(d, "STATE.md"));
    if (!state) throw new Error(`no STATE.md in ${d}`);
    const { run, session } = buildDocs({ slice: basename(d), state, endReview: read(join(d, "END_REVIEW.md")), track: flag("track"), repo: flag("repo"), recordsUrl: flag("records-url"), session: flag("session") });
    const rp = join(d, "BOARD_RUN.json"), sp = join(d, "BOARD_SESSION.json");
    writeFileSync(rp, JSON.stringify(run, null, 2) + "\n");
    writeFileSync(sp, JSON.stringify(session, null, 2) + "\n");
    console.log(`${rp}\n${sp}`);
  } catch (e) { console.error(e.message); process.exit(2); }
}
