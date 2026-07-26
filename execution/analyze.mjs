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
const B = { perStageCapTokens: 150000, sliceEnvelopePerStageTokens: 100000, tokensPerCallBaseline: 3600 };

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
  stages.push({ run: run.slice, ...s, density: Math.round(s.tokens / s.toolCalls), overCap: s.tokens > B.perStageCapTokens });
}
for (const s of stages) s.densityOutlier = s.density > B.tokensPerCallBaseline * 2;

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
const clean = stages.filter((s) => !s.overCap);
fleet.cleanDensity = Math.round(clean.reduce((a, s) => a + s.tokens, 0) / clean.reduce((a, s) => a + s.toolCalls, 0));
const outliers = stages.filter((s) => s.overCap || s.densityOutlier);

// ── format helpers ──────────────────────────────────────────────────────────
const ci = (n) => n.toLocaleString("en-US");
const k = (n) => (n >= 1000 ? (n / 1000).toFixed(n < 10000 ? 1 : 0) + "k" : String(n));
const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");
const runColor = (slice) => (slice === runs[0].slice ? "a" : "b");
const preNote = preTelemetry.length ? `Runs without \`trace.json\` (pre-telemetry / not instrumented): ${preTelemetry.sort().join(", ")}.` : "";

// ── ANALYTICS.md ────────────────────────────────────────────────────────────
let md = `# Pipeline Analytics — generated\n\n`;
md += `_Generated ${ts}. **Do not edit by hand** — regenerate with \`node <playbook>/execution/analyze.mjs .\` from the repo root._\n\n`;
md += `## Fleet\n\n`;
md += `- Runs traced: **${perRun.length}**${preTelemetry.length ? ` (+ ${preTelemetry.length} pre-telemetry)` : ""}\n`;
md += `- Stages: **${fleet.stages}** · Tokens: **${ci(fleet.tokens)}** · Tool calls: **${ci(fleet.calls)}**\n`;
md += `- Clean density (ex cap-breach): **~${k(fleet.cleanDensity)} tok/call** — the reproducible unit cost of one agentic step\n`;
md += `- Envelope breaches: **${fleet.envelopeFails}/${perRun.length}**\n\n`;
md += `## Per run\n\n| Run | Tier | Stages | Tokens | Calls | Density | Envelope | Status |\n|-----|------|--------|--------|-------|---------|----------|--------|\n`;
for (const r of perRun) md += `| ${r.slice} | ${r.tier}${r.overlay ? "+overlay" : ""} | ${r.n} | ${ci(r.tokens)} | ${r.calls} | ${k(r.density)} | ${ci(r.envelope)} | ${r.pass ? "✅ pass" : `❌ over ${k(r.overBy)}`} |\n`;
md += `\n## Per stage\n\n| Run | Stage | Model | Tokens | Calls | Tok/call | Flags |\n|-----|-------|-------|--------|-------|----------|-------|\n`;
for (const s of stages) {
  const flags = [s.overCap ? "⚠ over cap" : "", s.densityOutlier ? "⚠ density" : ""].filter(Boolean).join(", ") || "—";
  md += `| ${s.run} | ${s.stage} | ${s.model} | ${ci(s.tokens)} | ${s.toolCalls} | ${ci(s.density)} | ${flags} |\n`;
}
md += `\n## Outliers\n\n`;
for (const s of outliers) {
  const parts = [];
  if (s.overCap) parts.push(`${(s.tokens / B.perStageCapTokens).toFixed(1)}× the ${k(B.perStageCapTokens)} per-stage cap`);
  if (s.densityOutlier) parts.push(`${(s.density / B.tokensPerCallBaseline).toFixed(1)}× the ${k(B.tokensPerCallBaseline)} density baseline`);
  md += `- **${s.stage}** (${s.run}): ${ci(s.tokens)} tok / ${s.toolCalls} calls — ${parts.join("; ")}\n`;
}
md += `\n## Baselines\n\n- Per-stage cap: **${ci(B.perStageCapTokens)}** tokens · Slice envelope: **stages × ${ci(B.sliceEnvelopePerStageTokens)}** · Density baseline: **~${ci(B.tokensPerCallBaseline)}** tok/call\n`;
if (preNote) md += `\n_${preNote}_\n`;
writeFileSync(join(runsDir, "ANALYTICS.md"), md);

// ── dashboard.html (self-contained, theme-aware, no dependencies) ───────────
const CAP = B.perStageCapTokens, BASE = B.tokensPerCallBaseline, maxTok = 400000, maxDen = 10000;
const barRow = (s, kind) => {
  const val = kind === "tok" ? s.tokens : s.density, scale = kind === "tok" ? maxTok : maxDen;
  const clamp = val > scale, w = Math.min((val / scale) * 100, 100);
  const cls = `bar ${runColor(s.run)}${s.overCap ? " over" : ""}`;
  const tag = s.overCap ? `<span class="tag">outlier</span>` : (kind === "den" && s.densityOutlier ? `<span class="tag warn">2×</span>` : "");
  return `<div class="row"><span class="rl">${s.stage}</span>` +
    `<span class="track"><span class="${cls}" style="width:${w.toFixed(1)}%" title="${s.run} · ${s.stage}: ${ci(val)}"></span>${tag}</span>` +
    `<span class="val${clamp ? " clamp" : ""}">${clamp ? "→ " : ""}${k(val)}</span></div>`;
};
const refLine = (v, scale, text) => `<span class="ref" style="left:${((v / scale) * 100).toFixed(1)}%"><span class="ref-t">${text}</span></span>`;
const tile = (big, lab, sub, tone = "") => `<div class="tile ${tone}"><div class="big">${big}</div><div class="lab">${lab}</div><div class="sub">${sub}</div></div>`;
const chart1 = stages.map((s) => barRow(s, "tok")).join("");
const chart2 = stages.map((s) => barRow(s, "den")).join("");
const tableRows = stages.map((s) => `<tr><td>${s.run}</td><td>${s.stage}</td><td>${s.model}</td><td class="n">${ci(s.tokens)}</td><td class="n">${s.toolCalls}</td><td class="n">${ci(s.density)}</td><td>${s.overCap ? "over cap" : s.densityOutlier ? "density" : "—"}</td></tr>`).join("");
const overRun = perRun.find((r) => !r.pass);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pipeline Analytics</title>
<style>
:root{--surface:#fcfcfb;--plane:#f9f9f7;--ink:#0b0b0b;--ink2:#52514e;--muted:#898781;--grid:#e1e0d9;--baseline:#c3c2b7;--border:rgba(11,11,11,.10);--a:#2a78d6;--b:#eb6834;--crit:#d03b3b;--warn:#b5750a;--good:#0ca30c}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme=light])){--surface:#1a1a19;--plane:#0d0d0d;--ink:#fff;--ink2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--baseline:#383835;--border:rgba(255,255,255,.10);--a:#3987e5;--b:#d95926;--crit:#e05a5a;--warn:#e0a53a;--good:#0ca30c}}
:root[data-theme=dark]{--surface:#1a1a19;--plane:#0d0d0d;--ink:#fff;--ink2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--baseline:#383835;--border:rgba(255,255,255,.10);--a:#3987e5;--b:#d95926;--crit:#e05a5a;--warn:#e0a53a;--good:#0ca30c}
*{box-sizing:border-box}html{color-scheme:light dark}
body{margin:0;background:var(--plane);color:var(--ink);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:860px;margin:0 auto;padding:28px 20px 48px}
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
.tag.warn{background:var(--warn)}
.plot{position:relative;padding-top:18px}
.reflayer{position:absolute;left:120px;right:68px;top:0;bottom:6px;pointer-events:none;z-index:2}
.ref{position:absolute;top:0;bottom:0;border-left:2px dashed var(--muted)}
.ref-t{position:absolute;top:0;left:4px;font-size:10px;color:var(--muted);white-space:nowrap}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--ink2);margin-top:14px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:4px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--grid)}
th{color:var(--muted);font-weight:600}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
details{margin-top:14px}summary{cursor:pointer;color:var(--ink2);font-size:12.5px}
.foot{color:var(--muted);font-size:11.5px;margin-top:18px}
</style></head>
<body><div class="wrap">
<h1>Pipeline Analytics</h1>
<p class="meta">Generated ${ts} · rendered by analyze.mjs from runs/*/trace.json · ${fleet.stages} stages across ${perRun.length} traced runs</p>
<div class="tiles">
 ${tile(ci(fleet.tokens), "Fleet tokens", `${fleet.stages} stages · ${ci(fleet.calls)} tool calls`)}
 ${tile("~" + k(fleet.cleanDensity), "Density baseline", "tok/call, ex-outlier — reproducible", "good")}
 ${tile(fleet.envelopeFails + "/" + perRun.length, "Envelope breaches", overRun ? `${overRun.slice} over ${k(overRun.overBy)}` : "all within envelope", fleet.envelopeFails ? "bad" : "good")}
 ${tile(String(outliers.length), "Stage outliers", "over cap or 2× density", outliers.length ? "bad" : "good")}
</div>
<div class="card">
 <h2>Tokens per stage</h2>
 <p class="cap">Total subagent tokens each stage burned. Dashed line = ${k(CAP)} per-stage cap.</p>
 <div class="plot"><div class="reflayer">${refLine(CAP, maxTok, k(CAP) + " cap")}</div>${chart1}</div>
 <div class="legend"><span><i style="background:var(--a)"></i>${runs[0].slice}</span><span><i style="background:var(--b)"></i>${runs[1] ? runs[1].slice : "other"}</span><span><i style="background:var(--crit)"></i>over cap</span></div>
</div>
<div class="card">
 <h2>Density — tokens per tool call</h2>
 <p class="cap">The cost of one agentic step. Dashed line = ~${k(BASE)} baseline. Bars past ${k(maxDen)} are truncated (→ shows the true value).</p>
 <div class="plot"><div class="reflayer">${refLine(BASE, maxDen, "~" + k(BASE) + " baseline")}</div>${chart2}</div>
 <div class="legend"><span><i style="background:var(--a)"></i>${runs[0].slice}</span><span><i style="background:var(--b)"></i>${runs[1] ? runs[1].slice : "other"}</span><span><i style="background:var(--crit)"></i>outlier</span></div>
</div>
<details><summary>Data table (${fleet.stages} stages)</summary>
<table><thead><tr><th>Run</th><th>Stage</th><th>Model</th><th class="n">Tokens</th><th class="n">Calls</th><th class="n">Tok/call</th><th>Flag</th></tr></thead>
<tbody>${tableRows}</tbody></table></details>
<p class="foot">Baselines: per-stage cap ${ci(CAP)} · slice envelope stages×${ci(B.sliceEnvelopePerStageTokens)} · density ~${ci(BASE)} tok/call.${preNote ? " " + preNote : ""}</p>
</div></body></html>`;
writeFileSync(join(runsDir, "dashboard.html"), html);

console.log(`analytics: ${fleet.stages} stages, ${ci(fleet.tokens)} tokens, ${fleet.envelopeFails} envelope breach(es), ${outliers.length} outlier(s) → runs/ANALYTICS.md, runs/dashboard.html`);
