// Read-only run dashboard — dependency-free Node ESM.
//
//   node <playbook>/execution/runs-dashboard.mjs <productRepoRoot> --repo <owner/name> [--out <file>] [--sha <commit>] [--now <iso>]
//
// Reads every runs/<slice>/ in a product repo and renders ONE self-contained HTML page: each run's status,
// spend against its plan and hard cap, tier, Charter hash, event-log result, pull request, the questions
// the run reports it asked the owner after its Charter, and the open items it left for the owner.
//
// What it is NOT: a control plane. It holds no approvals and no credentials, has no script, and changes
// nothing. A figure a run's records do not state is shown as "not recorded"; it is never inferred. Counts
// come from the run's own end review and are labelled as the run reported them (they have been wrong before).
// A snapshot: the page says which commit and when. See docs/BACKLOG.md T39.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

// "2,773k", "0.6M", "1130k tokens" -> tokens
export function tokens(s) {
  const m = String(s ?? "").replace(/,/g, "").match(/([\d.]+)\s*([kKmM])?/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (!Number.isFinite(v)) return null;
  return Math.round(v * (m[2] ? (m[2].toLowerCase() === "m" ? 1e6 : 1e3) : 1));
}

export function parseState(text) {
  const out = { status: null, note: "", budget: null, spent: null, hardCap: null, ceiling: null };
  if (!text) return out;
  const line = (re) => (text.match(re) || [])[1];
  const st = line(/^\s*-\s*\*\*Status:\*\*\s*(.+)$/m);
  if (st) {
    const m = st.trim().match(/^([a-z-]+)\s*(.*)$/i);
    out.status = m ? m[1].toLowerCase() : st.trim();
    out.note = m ? m[2].replace(/^[(\s]+|[)\s]+$/g, "").slice(0, 110) : "";
  }
  const b = line(/\*\*Budget:\*\*\s*(.+)$/m);
  if (b) {
    out.budget = tokens(b);
    const c = b.match(/ceiling\s*([\d.,]+\s*[kKmM]?)/i);
    if (c) out.ceiling = tokens(c[1]);
  }
  const hc = line(/\*\*Hard cap:\*\*\s*([\d.,]+\s*[kKmM]?)/i);
  if (hc) out.hardCap = tokens(hc);
  const sp = line(/\*\*Spent:\*\*\s*([\d.,]+\s*[kKmM]?)/i);
  if (sp) out.spent = tokens(sp);
  return out;
}

export function parseEndReview(text) {
  const out = { charter: null, approved: null, pr: null, asked: null, open: null };
  if (!text) return out;
  const sha = text.match(/sha256\s*`([0-9a-f]{8,64})/i);
  if (sha) out.charter = sha[1];
  const ap = text.match(/approved (?:by [^`\n]*?)?(\d{4}-\d{2}-\d{2})/i);
  if (ap) out.approved = ap[1];
  const pr = text.match(/\/pull\/(\d+)/) || text.match(/pull request #?(\d+)/i);
  if (pr) out.pr = pr[1];
  const lines = text.split("\n");
  const qi = lines.findIndex((l) => /^##\s+Questions asked/i.test(l));
  if (qi !== -1) {
    const head = lines[qi].match(/:\s*(\d+)\s*$/);
    if (head) out.asked = Number(head[1]);
    else {
      const body = lines.slice(qi + 1).find((l) => l.trim());
      const n = body && body.match(/\*{0,2}\s*(\d+)\b/);
      if (n) out.asked = Number(n[1]);
    }
  }
  const oi = lines.findIndex((l) => /^##\s+.*(OPEN items|Blocked on me)/i.test(l));
  if (oi !== -1) {
    let n = 0;
    for (const l of lines.slice(oi + 1)) { if (/^##\s/.test(l)) break; if (/^\d+\.\s/.test(l)) n++; }
    out.open = n;
  }
  return out;
}

// "…jsonl: chain intact; 1043 lines; head f3bb…" or a line that says the chain is broken
export function parseEvents(text) {
  if (!text) return null;
  if (/chain (intact|ok)/i.test(text) && !/break|broken|mismatch|tamper/i.test(text)) {
    const n = text.match(/(\d[\d,]*)\s+lines/);
    return { ok: true, lines: n ? n[1] : null };
  }
  return { ok: false, lines: null };
}

export function collect(repoRoot) {
  const runsDir = join(repoRoot, "runs");
  if (!existsSync(runsDir)) throw new Error(`no runs/ directory in ${repoRoot}`);
  const rows = [];
  for (const slice of readdirSync(runsDir)) {
    const dir = join(runsDir, slice);
    if (!statSync(dir).isDirectory() || !existsSync(join(dir, "STATE.md"))) continue;
    const state = parseState(read(join(dir, "STATE.md")));
    const end = parseEndReview(read(join(dir, "END_REVIEW.md")));
    let trace = null;
    try { trace = JSON.parse(read(join(dir, "trace.json")) ?? "null"); } catch { /* unreadable: not recorded */ }
    const evFile = readdirSync(dir).filter((f) => /^events-verify.*\.txt$/.test(f)).sort().pop();
    const prFromState = (state.note.match(/pull request #?(\d+)/i) || [])[1];
    rows.push({
      slice, ...state, ...end, pr: prFromState || end.pr,
      tier: trace?.tier ?? null,
      started: trace?.started ? String(trace.started).slice(0, 10) : null,
      telemetry: trace?.telemetrySource ?? null,
      stages: Array.isArray(trace?.stages) ? trace.stages.length : null,
      events: evFile ? parseEvents(read(join(dir, evFile))) : null,
    });
  }
  rows.sort((a, b) => String(b.started ?? "").localeCompare(String(a.started ?? "")) || a.slice.localeCompare(b.slice));
  return rows;
}

const k = (n) => (n === null || n === undefined ? null : `${Math.round(n / 1000).toLocaleString("en-US")}k`);
const NR = '<span class="nr">not recorded</span>';

export function render(rows, { repo, sha, now }) {
  const base = `https://github.com/${repo}`;
  const tree = (slice) => `${base}/tree/${sha}/runs/${encodeURIComponent(slice)}`;
  const done = rows.filter((r) => r.status === "done").length;
  const total = rows.reduce((a, r) => a + (r.spent ?? 0), 0);
  const overPlan = rows.filter((r) => r.budget && r.spent && r.spent > r.budget).length;
  const tr = rows.map((r) => {
    const limit = r.hardCap ?? r.ceiling;
    const pctPlan = r.budget && r.spent !== null ? Math.round((r.spent / r.budget) * 100) : null;
    const spend = r.spent === null ? NR : `${k(r.spent)}${r.budget ? ` of ${k(r.budget)}` : ""}${pctPlan !== null ? ` <span class="${pctPlan > 100 ? "over" : "ok"}">(${pctPlan}% of plan)</span>` : ""}`;
    const cap = limit ? `${k(limit)} <span class="muted">${r.hardCap ? "hard cap" : "ceiling"}</span>` : NR;
    const ev = r.events === null ? '<span class="muted">no event log</span>' : r.events.ok ? `intact${r.events.lines ? ` · ${esc(r.events.lines)} lines` : ""}` : '<span class="over">chain not intact</span>';
    return `<tr>
<td><a href="${esc(tree(r.slice))}">${esc(r.slice)}</a>${r.started ? `<div class="muted">${esc(r.started)}</div>` : ""}</td>
<td><span class="badge ${esc(r.status ?? "unknown")}">${esc(r.status ?? "not recorded")}</span>${r.note ? `<div class="muted">${esc(r.note)}</div>` : ""}</td>
<td>${spend}${r.telemetry ? `<div class="muted">${esc(r.telemetry)}</div>` : ""}</td>
<td>${cap}</td>
<td>${r.tier ?? NR}</td>
<td>${r.charter ? `<code>${esc(r.charter.slice(0, 12))}</code>${r.approved ? `<div class="muted">approved ${esc(r.approved)}</div>` : ""}` : NR}</td>
<td>${ev}</td>
<td>${r.pr ? `<a href="${esc(`${base}/pull/${r.pr}`)}">#${esc(r.pr)}</a>` : NR}</td>
<td>${r.asked === null ? NR : esc(r.asked)}</td>
<td>${r.open === null ? NR : esc(r.open)}</td>
</tr>`;
  }).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aveto runs, read from the records</title>
<meta name="description" content="Every Aveto run in aveto-support: status, spend against plan and cap, Charter hash, event-log result, pull request. Read from each run's own records; a read-only snapshot.">
<style>
:root{--ground:#FBFAF7;--surface:#fff;--ink:#14161A;--soft:#3A4048;--muted:#626B77;--rule:#E2DFD8;--gold:#85590C;--bad:#9B1C1C;--good:#1F6B3A;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ground:#14161A;--surface:#1C1F24;--ink:#F1EFE9;--soft:#C9CDD3;--muted:#9AA3AF;--rule:#2C3037;--gold:#E0A83B;--bad:#F08080;--good:#7FD49B;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--ground);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:32px 16px 64px}a{color:var(--gold)}h1{font-size:1.9rem;line-height:1.2;margin:.2em 0}
.eyebrow{font:600 .75rem/1 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
.lede{color:var(--soft);max-width:70ch}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:24px 0}
.card{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:14px 16px}.card b{display:block;font-size:1.6rem}.card span{color:var(--muted);font-size:.85rem}
.wrap{overflow-x:auto;border:1px solid var(--rule);border-radius:10px;background:var(--surface)}table{border-collapse:collapse;width:100%;min-width:980px;font-size:.9rem}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--rule);vertical-align:top}th{font-size:.75rem;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}tr:last-child td{border-bottom:0}
.muted{color:var(--muted);font-size:.8rem}.nr{color:var(--muted);font-style:italic}.over{color:var(--bad);font-weight:600}.ok{color:var(--good)}
.badge{display:inline-block;padding:2px 9px;border-radius:999px;border:1px solid var(--rule);font-size:.78rem;font-weight:600}.badge.done{color:var(--good);border-color:var(--good)}.badge.in-progress{color:var(--gold);border-color:var(--gold)}
code{font:.82rem ui-monospace,monospace}.notes{margin-top:28px;color:var(--soft);max-width:78ch}.notes li{margin:.5em 0}
</style>
</head>
<body>
<main>
<p class="eyebrow">Aveto runs</p>
<h1>Every run, read from its own records.</h1>
<p class="lede">One row per run in <a href="${esc(base)}">${esc(repo)}</a>. A script reads each run's state file, trace, end review and event log; nothing here is typed by hand, and nothing on this page can change a run. A figure a run's records do not state is shown as <span class="nr">not recorded</span>.</p>
<div class="cards">
<div class="card"><b>${rows.length}</b><span>runs recorded</span></div>
<div class="card"><b>${done}</b><span>marked done</span></div>
<div class="card"><b>${esc(k(total))}</b><span>tokens, peak context summed per spawn (self-reported)</span></div>
<div class="card"><b>${overPlan}</b><span>ended over their plan total</span></div>
</div>
<div class="wrap"><table>
<thead><tr><th>Run</th><th>Status</th><th>Spend</th><th>Cap</th><th>Tier</th><th>Charter</th><th>Event log</th><th>Pull request</th><th>Asked after Charter</th><th>Open for owner</th></tr></thead>
<tbody>
${tr}
</tbody></table></div>
<ul class="notes">
<li><b>Spend</b> is what the run's state file says, in tokens. &ldquo;Self-reported&rdquo; means the model reported its own token use; it is not a bill. ${overPlan} of ${rows.length} runs ended over their plan total; a Charter's hard cap, where one is recorded, is what stops a run.</li>
<li><b>Event log: intact</b> means the hash chain verified when the run closed. It shows tampering after the fact; it does not prevent it. Runs before the event log existed show &ldquo;no event log&rdquo;.</li>
<li><b>Asked after Charter</b> and <b>Open for owner</b> are the counts in each run's own end review, as the run reported them. A run cannot see every prompt the app shows its owner, so the first can read lower than the truth.</li>
<li>A snapshot, generated ${esc(now.slice(0, 10))} from <a href="${esc(`${base}/tree/${sha}`)}">${esc(repo)} at <code>${esc(sha.slice(0, 7))}</code></a>. It holds no approvals or credentials. Charter approval is typed by the owner in the session that drives a run, never on this page.</li>
</ul>
</main>
</body>
</html>
`;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null; };
  const repoRoot = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
  const repo = opt("--repo");
  if (!repoRoot || !repo) { console.error("usage: runs-dashboard.mjs <productRepoRoot> --repo <owner/name> [--out file] [--sha commit] [--now iso]"); process.exit(2); }
  const sha = opt("--sha") || execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const html = render(collect(repoRoot), { repo, sha, now: opt("--now") || new Date().toISOString() });
  if (opt("--out")) { writeFileSync(opt("--out"), html); console.log(`wrote ${opt("--out")} (${html.length} bytes) from ${repoRoot} at ${sha.slice(0, 7)}`); }
  else process.stdout.write(html);
}
