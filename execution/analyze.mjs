// Pipeline analytics generator — dependency-free Node ESM. Sibling to
// install.mjs: a reusable playbook tool run against a product repo.
//
//   node <playbook>/execution/analyze.mjs [productRepoRoot]
//
// Reads every runs/<slice>/trace.json (the machine-readable source of truth a
// run emits alongside STATE.md) and RENDERS the human views into runs/:
//   - ANALYTICS.md   (git/terminal — diffable, greppable)
//   - dashboard.html (visual — self-contained, theme-aware)
// Author once (the run emits trace.json), render many. Never hand-maintain a view.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

// Baselines mirror PIPELINE_SLOS.md § Service-level objectives — keep in sync.
const B = { perStageCapTokens: 150000, sliceEnvelopePerStageTokens: 100000 };

// Density (tokens per tool call) is archetype-dependent: a stage's cost per
// call is set by what it PRODUCES, not by its risk tier. Design stages reason
// long and call few tools; build stages call many and reason per call. One flat
// number misflags design work — see PIPELINE_SLOS.md § Density by archetype.
const ARCHETYPES = {
  design: { cap: 15000, blurb: "reason → long artefact, few calls" },
  review: { cap: 8000, blurb: "read artefacts → verdict" },
  build: { cap: 5000, blurb: "heavy file / test I/O" },
};
const ARCHETYPE_OF = {
  "market research": "design", prd: "design", ux: "design", ui: "design",
  "ai governance": "design", finops: "design", discovery: "design",
  scope: "review", architecture: "review", security: "review",
  release: "review", "post-launch": "review", intake: "review",
  implementation: "build", qa: "build", "ai engineer": "build",
};
// A stage may declare `archetype` in trace.json; otherwise classify by name.
// Unknown names fall to "review" (the middle band) — recorded, never silent.
const classify = (s) =>
  s.archetype || ARCHETYPE_OF[String(s.stage).toLowerCase().trim()] || "review";

const root = process.argv[2] || process.cwd();
const runsDir = join(root, "runs");
if (!existsSync(runsDir)) { console.error(`no runs/ dir at ${root}`); process.exit(1); }

// ── load: glob runs/*/trace.json (the canonical per-run facts) ───────────────
const dirs = readdirSync(runsDir).filter((d) => statSync(join(runsDir, d)).isDirectory());
const runs = [];
const preTelemetry = [];
for (const d of dirs) {
  const tf = join(runsDir, d, "trace.json");
  if (existsSync(tf)) runs.push(JSON.parse(readFileSync(tf, "utf8")));
  else preTelemetry.push(d);
}
if (runs.length === 0) { console.error("no runs/*/trace.json found — nothing to analyze"); process.exit(1); }
runs.sort((a, b2) => (a.started || a.slice).localeCompare(b2.started || b2.slice));

// ── derive (never stored — computed from raw facts) ─────────────────────────
const stages = [];
for (const run of runs) for (const s of run.stages) {
  const archetype = classify(s);
  const density = Math.round(s.tokens / s.toolCalls);
  const densityCap = ARCHETYPES[archetype].cap;
  stages.push({
    run: run.slice, ...s, archetype, density, densityCap,
    // Traces predating the effort routing axis carry no `effort`. Render them
    // as not-recorded rather than inventing a level — their density figures
    // are not comparable with a run that sets effort per role.
    effort: s.effort ?? "—",
    densityPct: density / densityCap,
    densityOutlier: density > densityCap,
    overCap: s.tokens > B.perStageCapTokens,
  });
}

const perRun = runs.map((run) => {
  const tokens = run.stages.reduce((a, s) => a + s.tokens, 0);
  const calls = run.stages.reduce((a, s) => a + s.toolCalls, 0);
  const n = run.stages.length, envelope = n * B.sliceEnvelopePerStageTokens;
  return { slice: run.slice, tier: run.tier, overlay: !!run.overlay, n, tokens, calls,
    density: Math.round(tokens / calls), envelope, overBy: tokens - envelope, pass: tokens <= envelope };
});

const fleet = { stages: stages.length,
  tokens: stages.reduce((a, s) => a + s.tokens, 0),
  calls: stages.reduce((a, s) => a + s.toolCalls, 0),
  envelopeFails: perRun.filter((r) => !r.pass).length };
const outliers = stages.filter((s) => s.overCap || s.densityOutlier);

// Observed density per archetype (excluding outliers) — the evidence the caps
// are held against, recomputed every run so drift is visible.
const byArchetype = Object.keys(ARCHETYPES).map((a) => {
  const clean = stages.filter((s) => s.archetype === a && !s.densityOutlier && !s.overCap);
  const ds = clean.map((s) => s.density).sort((x, y) => x - y);
  return { archetype: a, cap: ARCHETYPES[a].cap, blurb: ARCHETYPES[a].blurb, n: ds.length,
    min: ds[0], max: ds[ds.length - 1],
    avg: ds.length ? Math.round(ds.reduce((x, y) => x + y, 0) / ds.length) : 0 };
}).filter((r) => r.n > 0);

// ── DORA (PIPELINE_SLOS.md § DORA mapping) ─────────────────────────────────
// Only what the traces actually ground. A metric without data is reported as
// "not captured", never estimated — an unearned green here would undermine the
// one scorecard that is supposed to be honest.
const landed = runs.filter((r) => r.landed);
const withDates = landed.filter((r) => r.started && r.landedAt);
const hours = (a, b) => (new Date(b) - new Date(a)) / 36e5;
const leadTimes = withDates.map((r) => ({ slice: r.slice, h: hours(r.started, r.landedAt) }))
  .filter((x) => Number.isFinite(x.h) && x.h >= 0)
  .sort((a, b) => a.h - b.h);
const totalRetries = stages.reduce((a, s) => a + (s.retries || 0), 0);
const postFixes = runs.reduce((a, r) => a + (r.postLandingFixes || 0), 0);
const reverted = runs.filter((r) => r.reverted).length;

let spanWeeks = null;
if (withDates.length > 1) {
  const ts = withDates.map((r) => new Date(r.landedAt).getTime()).sort((a, b) => a - b);
  spanWeeks = Math.max((ts[ts.length - 1] - ts[0]) / (7 * 864e5), 1 / 7); // floor at a day
}

const dora = {
  leadTimeMedianH: leadTimes.length ? leadTimes[Math.floor(leadTimes.length / 2)].h : null,
  leadTimes,
  deployFreqPerWeek: spanWeeks ? landed.length / spanWeeks : null,
  changeFailureRate: landed.length ? (postFixes + reverted) / landed.length : null,
  reworkRate: landed.length ? (totalRetries + postFixes) / landed.length : null,
  totalRetries, postFixes, reverted, landedCount: landed.length,
  undated: landed.length - withDates.length,
};

// ── format helpers ──────────────────────────────────────────────────────────
const ci = (n) => n.toLocaleString("en-US");
const k = (n) => (n >= 1000 ? (n / 1000).toFixed(n < 10000 ? 1 : 0) + "k" : String(n));
const pct = (x) => Math.round(x * 100) + "%";
const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");
const runColor = (slice) => (slice === runs[0].slice ? "a" : "b");
const preNote = preTelemetry.length ? `Runs without \`trace.json\` (pre-telemetry / not instrumented): ${preTelemetry.sort().join(", ")}.` : "";

// ── ANALYTICS.md ────────────────────────────────────────────────────────────
let md = `# Pipeline Analytics — generated\n\n`;
md += `_Generated ${ts}. **Do not edit by hand** — regenerate with \`node <playbook>/execution/analyze.mjs .\` from the repo root._\n\n`;
md += `## Fleet\n\n`;
md += `- Runs traced: **${perRun.length}**${preTelemetry.length ? ` (+ ${preTelemetry.length} pre-telemetry)` : ""}\n`;
md += `- Stages: **${fleet.stages}** · Tokens: **${ci(fleet.tokens)}** · Tool calls: **${ci(fleet.calls)}**\n`;
md += `- Envelope breaches: **${fleet.envelopeFails}/${perRun.length}** · Stage outliers: **${outliers.length}**\n\n`;
md += `## Per run\n\n| Run | Tier | Stages | Tokens | Calls | Envelope | Status |\n|-----|------|--------|--------|-------|----------|--------|\n`;
for (const r of perRun) md += `| ${r.slice} | ${r.tier}${r.overlay ? "+overlay" : ""} | ${r.n} | ${ci(r.tokens)} | ${r.calls} | ${ci(r.envelope)} | ${r.pass ? "✅ pass" : `❌ over ${k(r.overBy)}`} |\n`;
const hfmt = (h) => (h == null ? "—" : h < 24 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`);
md += `\n## DORA\n\nPer \`PIPELINE_SLOS.md\` § DORA mapping. **Only metrics the traces ground are reported** — anything without data says so.\n\n`;
md += `| Metric | Value | Basis |\n|--------|-------|-------|\n`;
md += `| Lead time (median) | ${hfmt(dora.leadTimeMedianH)} | intake → landed, ${withDates.length}/${dora.landedCount} slices dated |\n`;
md += `| Deployment frequency | ${dora.deployFreqPerWeek ? dora.deployFreqPerWeek.toFixed(1) + " slices/week" : "—"} | ${dora.landedCount} landed over the traced span |\n`;
md += `| Change failure rate | ${dora.changeFailureRate == null ? "—" : Math.round(dora.changeFailureRate * 100) + "%"} | ${dora.postFixes} post-landing fixes + ${dora.reverted} reverts ÷ ${dora.landedCount} landed |\n`;
md += `| Rework rate | ${dora.reworkRate == null ? "—" : dora.reworkRate.toFixed(2) + " / slice"} | ${dora.totalRetries} stage retries + ${dora.postFixes} post-landing fixes ÷ ${dora.landedCount} landed |\n`;
md += `| Failed-deployment recovery time | **not captured** | needs blocked→unblocked timestamps in \`STATE.md\`; no run has recorded them |\n`;
if (dora.undated > 0) md += `\n> ${dora.undated} landed slice(s) lack \`landedAt\` and are excluded from lead time.\n`;
if (preTelemetry.length) md += `\n> **Change failure and rework cover traced slices only.** ${preTelemetry.length} pre-telemetry run(s) are invisible here, so a defect shipped by one of them — and fixed later — is not counted. These rates are a floor, not a ceiling.\n`;
if (leadTimes.length) md += `\nPer-slice lead time: ${leadTimes.map((x) => `${x.slice} ${hfmt(x.h)}`).join(" · ")}\n`;
md += `\n## Density by archetype\n\nTokens per tool call, measured against each archetype's own cap.\n\n`;
md += `| Archetype | What it does | Cap | Observed (n) | Range | Avg |\n|-----------|--------------|-----|--------------|-------|-----|\n`;
for (const a of byArchetype) md += `| **${a.archetype}** | ${a.blurb} | ${ci(a.cap)} | ${a.n} | ${ci(a.min)}–${ci(a.max)} | ${ci(a.avg)} |\n`;
md += `\n## Per stage\n\n| Run | Stage | Type | Model | Effort | Tokens | Calls | Tok/call | % of cap | Flags |\n|-----|-------|------|-------|--------|--------|-------|----------|----------|-------|\n`;
for (const s of stages) {
  const flags = [s.overCap ? "⚠ over cap" : "", s.densityOutlier ? "⚠ density" : ""].filter(Boolean).join(", ") || "—";
  md += `| ${s.run} | ${s.stage} | ${s.archetype} | ${s.model} | ${s.effort} | ${ci(s.tokens)} | ${s.toolCalls} | ${ci(s.density)} | ${pct(s.densityPct)} | ${flags} |\n`;
}
md += `\n## Outliers\n\n`;
if (outliers.length === 0) md += `None — every stage is within its token cap and its archetype's density cap.\n`;
for (const s of outliers) {
  const parts = [];
  if (s.overCap) parts.push(`${(s.tokens / B.perStageCapTokens).toFixed(1)}× the ${k(B.perStageCapTokens)} per-stage token cap`);
  if (s.densityOutlier) parts.push(`${(s.densityPct).toFixed(1)}× the ${k(s.densityCap)} ${s.archetype}-density cap`);
  md += `- **${s.stage}** (${s.run}, ${s.archetype}): ${ci(s.tokens)} tok / ${s.toolCalls} calls — ${parts.join("; ")}\n`;
}
md += `\n## Baselines\n\n`;
md += `- Per-stage token cap: **${ci(B.perStageCapTokens)}** · Slice envelope: **stages × ${ci(B.sliceEnvelopePerStageTokens)}**\n`;
md += `- Density caps: ${Object.entries(ARCHETYPES).map(([a, v]) => `**${a}** ${ci(v.cap)}`).join(" · ")} (tok/call)\n`;
if (preNote) md += `\n_${preNote}_\n`;
writeFileSync(join(runsDir, "ANALYTICS.md"), md);

// ── dashboard.html (self-contained, theme-aware, no dependencies) ───────────
const CAP = B.perStageCapTokens, maxTok = 400000, denScale = 1.5; // density chart: 0–150% of cap
const barRow = (s, kind) => {
  const clamp = kind === "tok" ? s.tokens > maxTok : s.densityPct > denScale;
  const w = kind === "tok"
    ? Math.min((s.tokens / maxTok) * 100, 100)
    : Math.min((s.densityPct / denScale) * 100, 100);
  const label = kind === "tok" ? k(s.tokens) : k(s.density);
  const flagged = kind === "tok" ? s.overCap : s.densityOutlier;
  const cls = `bar ${runColor(s.run)}${flagged ? " over" : ""}`;
  const title = kind === "tok"
    ? `${s.run} · ${s.stage}: ${ci(s.tokens)} tokens`
    : `${s.run} · ${s.stage} (${s.archetype}): ${ci(s.density)} tok/call = ${pct(s.densityPct)} of the ${ci(s.densityCap)} cap`;
  const tag = flagged ? `<span class="tag">outlier</span>` : "";
  return `<div class="row"><span class="rl">${s.stage}</span>` +
    `<span class="track"><span class="${cls}" style="width:${w.toFixed(1)}%" title="${title}"></span>${tag}</span>` +
    `<span class="val${clamp ? " clamp" : ""}">${clamp ? "→ " : ""}${label}</span></div>`;
};
const refLine = (leftPct, text) => `<span class="ref" style="left:${leftPct.toFixed(1)}%"><span class="ref-t">${text}</span></span>`;
const tile = (big, lab, sub, tone = "") => `<div class="tile ${tone}"><div class="big">${big}</div><div class="lab">${lab}</div><div class="sub">${sub}</div></div>`;
const chart1 = stages.map((s) => barRow(s, "tok")).join("");
const chart2 = stages.map((s) => barRow(s, "den")).join("");
const tableRows = stages.map((s) =>
  `<tr><td>${s.run}</td><td>${s.stage}</td><td>${s.archetype}</td><td>${s.model}</td><td>${s.effort}</td><td class="n">${ci(s.tokens)}</td><td class="n">${s.toolCalls}</td><td class="n">${ci(s.density)}</td><td class="n">${pct(s.densityPct)}</td><td>${s.overCap ? "over cap" : s.densityOutlier ? "density" : "—"}</td></tr>`).join("");
const archRows = byArchetype.map((a) =>
  `<tr><td><b>${a.archetype}</b></td><td>${a.blurb}</td><td class="n">${ci(a.cap)}</td><td class="n">${a.n}</td><td class="n">${ci(a.min)}–${ci(a.max)}</td><td class="n">${ci(a.avg)}</td></tr>`).join("");
const overRun = perRun.find((r) => !r.pass);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pipeline Analytics</title>
<style>
:root{--surface:#fcfcfb;--plane:#f9f9f7;--ink:#0b0b0b;--ink2:#52514e;--muted:#898781;--grid:#e1e0d9;--border:rgba(11,11,11,.10);--a:#2a78d6;--b:#eb6834;--crit:#d03b3b;--good:#0ca30c}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme=light])){--surface:#1a1a19;--plane:#0d0d0d;--ink:#fff;--ink2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--border:rgba(255,255,255,.10);--a:#3987e5;--b:#d95926;--crit:#e05a5a;--good:#0ca30c}}
:root[data-theme=dark]{--surface:#1a1a19;--plane:#0d0d0d;--ink:#fff;--ink2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--border:rgba(255,255,255,.10);--a:#3987e5;--b:#d95926;--crit:#e05a5a;--good:#0ca30c}
*{box-sizing:border-box}html{color-scheme:light dark}
body{margin:0;background:var(--plane);color:var(--ink);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:880px;margin:0 auto;padding:28px 20px 48px}
h1{font-size:20px;margin:0 0 2px}.meta{color:var(--muted);font-size:12px;margin:0 0 20px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px 18px 20px;margin:14px 0}
.card h2{font-size:13px;letter-spacing:.02em;text-transform:uppercase;color:var(--ink2);margin:0 0 4px}
.card .cap{color:var(--muted);font-size:12px;margin:0 0 16px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}
.tile{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px}
.tile .big{font-size:26px;font-weight:650;letter-spacing:-.01em}
.tile .lab{font-size:12px;color:var(--ink2);margin-top:2px}.tile .sub{font-size:11.5px;color:var(--muted);margin-top:3px}
.tile.bad .big{color:var(--crit)}.tile.good .big{color:var(--good)}
.row{display:grid;grid-template-columns:110px 1fr 58px;align-items:center;gap:10px;margin:5px 0}
.rl{font-size:12px;color:var(--ink2);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.track{position:relative;height:20px}
.bar{position:absolute;left:0;top:3px;height:14px;border-radius:0 4px 4px 0;min-width:2px}
.bar.a{background:var(--a)}.bar.b{background:var(--b)}.bar.over{background:var(--crit)}
.val{font-size:11.5px;color:var(--ink2);text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.val.clamp{color:var(--crit);font-weight:600}
.tag{position:absolute;right:4px;top:2px;font-size:10px;font-weight:600;color:#fff;background:var(--crit);border-radius:4px;padding:1px 5px;z-index:3}
.plot{position:relative;padding-top:18px}
.reflayer{position:absolute;left:120px;right:68px;top:0;bottom:6px;pointer-events:none;z-index:2}
.ref{position:absolute;top:0;bottom:0;border-left:2px dashed var(--muted)}
.ref-t{position:absolute;top:0;left:4px;font-size:10px;color:var(--muted);white-space:nowrap}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--ink2);margin-top:14px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px}
.tblwrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:4px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--grid);white-space:nowrap}
th{color:var(--muted);font-weight:600}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
details{margin-top:14px}summary{cursor:pointer;color:var(--ink2);font-size:12.5px}
.foot{color:var(--muted);font-size:11.5px;margin-top:18px}
</style></head>
<body><div class="wrap">
<h1>Pipeline Analytics</h1>
<p class="meta">Generated ${ts} · rendered by analyze.mjs from runs/*/trace.json · ${fleet.stages} stages across ${perRun.length} traced runs</p>
<div class="tiles">
 ${tile(ci(fleet.tokens), "Fleet tokens", `${fleet.stages} stages · ${ci(fleet.calls)} tool calls`)}
 ${tile(String(byArchetype.length), "Density archetypes", byArchetype.map((a) => `${a.archetype} ≤${k(a.cap)}`).join(" · "))}
 ${tile(fleet.envelopeFails + "/" + perRun.length, "Envelope breaches", overRun ? `${overRun.slice} over ${k(overRun.overBy)}` : "all within envelope", fleet.envelopeFails ? "bad" : "good")}
 ${tile(String(outliers.length), "Stage outliers", "over token cap or archetype density", outliers.length ? "bad" : "good")}
</div>
<div class="card">
 <h2>Tokens per stage</h2>
 <p class="cap">Total subagent tokens each stage burned. Dashed line = ${k(CAP)} per-stage cap.</p>
 <div class="plot"><div class="reflayer">${refLine((CAP / maxTok) * 100, k(CAP) + " cap")}</div>${chart1}</div>
 <div class="legend"><span><i style="background:var(--a)"></i>${runs[0].slice}</span>${runs[1] ? `<span><i style="background:var(--b)"></i>${runs[1].slice}</span>` : ""}<span><i style="background:var(--crit)"></i>over cap</span></div>
</div>
<div class="card">
 <h2>Density — against each stage's own cap</h2>
 <p class="cap">Tokens per tool call as a share of that stage's <b>archetype</b> cap (design ${k(ARCHETYPES.design.cap)} · review ${k(ARCHETYPES.review.cap)} · build ${k(ARCHETYPES.build.cap)}). Dashed line = 100% of cap; labels show the actual tok/call. One flat baseline misflags design work, so each stage is judged against its own kind.</p>
 <div class="plot"><div class="reflayer">${refLine((1 / denScale) * 100, "100% of cap")}</div>${chart2}</div>
 <div class="legend"><span><i style="background:var(--a)"></i>${runs[0].slice}</span>${runs[1] ? `<span><i style="background:var(--b)"></i>${runs[1].slice}</span>` : ""}<span><i style="background:var(--crit)"></i>over its cap</span></div>
</div>
<div class="card">
 <h2>DORA</h2>
 <p class="cap">Only metrics the traces ground. A metric without data says <b>not captured</b> — never estimated.</p>
 <div class="tblwrap"><table><thead><tr><th>Metric</th><th class="n">Value</th><th>Basis</th></tr></thead><tbody>
 <tr><td>Lead time (median)</td><td class="n">${hfmt(dora.leadTimeMedianH)}</td><td>intake → landed · ${withDates.length}/${dora.landedCount} dated</td></tr>
 <tr><td>Deployment frequency</td><td class="n">${dora.deployFreqPerWeek ? dora.deployFreqPerWeek.toFixed(1) + "/wk" : "—"}</td><td>${dora.landedCount} landed over the traced span</td></tr>
 <tr><td>Change failure rate</td><td class="n">${dora.changeFailureRate == null ? "—" : Math.round(dora.changeFailureRate * 100) + "%"}</td><td>${dora.postFixes} post-landing fixes + ${dora.reverted} reverts</td></tr>
 <tr><td>Rework rate</td><td class="n">${dora.reworkRate == null ? "—" : dora.reworkRate.toFixed(2)}</td><td>${dora.totalRetries} retries + ${dora.postFixes} fixes ÷ ${dora.landedCount} landed</td></tr>
 <tr><td>Failed-deploy recovery</td><td class="n">n/a</td><td><b>not captured</b> — needs blocked→unblocked timestamps</td></tr>
 </tbody></table></div>
</div>
<div class="card">
 <h2>Archetype baselines</h2>
 <p class="cap">Observed density per archetype (outliers excluded) — the evidence the caps are held against, recomputed every run.</p>
 <div class="tblwrap"><table><thead><tr><th>Archetype</th><th>What it does</th><th class="n">Cap</th><th class="n">n</th><th class="n">Range</th><th class="n">Avg</th></tr></thead><tbody>${archRows}</tbody></table></div>
</div>
<details><summary>Data table (${fleet.stages} stages)</summary>
<div class="tblwrap"><table><thead><tr><th>Run</th><th>Stage</th><th>Type</th><th>Model</th><th>Effort</th><th class="n">Tokens</th><th class="n">Calls</th><th class="n">Tok/call</th><th class="n">% cap</th><th>Flag</th></tr></thead>
<tbody>${tableRows}</tbody></table></div></details>
<p class="foot">Baselines: per-stage token cap ${ci(CAP)} · slice envelope stages×${ci(B.sliceEnvelopePerStageTokens)} · density caps by archetype.${preNote ? " " + preNote : ""}</p>
</div></body></html>`;
writeFileSync(join(runsDir, "dashboard.html"), html);

console.log(`analytics: ${fleet.stages} stages, ${ci(fleet.tokens)} tokens, ${fleet.envelopeFails} envelope breach(es), ${outliers.length} outlier(s) → runs/ANALYTICS.md, runs/dashboard.html`);
