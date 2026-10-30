#!/usr/bin/env node
// repo-map.mjs — a deterministic map of a git repository, for assessing code Aveto did not build.
// Dependency-free, no model.
//
//   node <playbook>/execution/repo-map.mjs <repo> [--out <dir>] [--scope <subdir>]... [--rules <file>] [--date YYYY-MM-DD] [--json]
//
// WHAT IT READS. File names, sizes and git history. It never opens a source file. The only contents it reads are
// the build manifests and CI files it needs to find commands and entry points, and `.agentic/RISK_PATHS`. A path
// that matches the secret-path deny list is listed by name and nothing else: it is not stat'd for content, not
// counted in sizes, and never offered to a reviewer (docs/REVIEW_MODE_PLAN.md, M3b).
//
// WHAT IT WRITES. Nothing, unless --out is given; then <out>/MAP.md and <out>/map.json. Pointing --out at the
// repo being assessed would change it, so the assessment runner points it at a records folder elsewhere.
//
// RISK TIER per path: high, medium or low. An organisation's own rules (`.agentic/RISK_PATHS`, lines like
// `high: payments/**`) are tried first, then the defaults below, which follow docs/CODE_REVIEW.md rule 3.
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// ── secret and sensitive paths (never read, never shown to a model) ───────────────────────────────────

const ENV_SAFE = /(^|\/)\.env\.(example|sample|template|dist)$/i;
export const DENY = [
  [/(^|\/)\.env(\..+)?$/i, "environment file"],
  [/\.(pem|key|p12|pfx|jks|keystore|crt|cer|der|gpg|asc)$/i, "key or certificate file"],
  [/(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.pub)?$/i, "ssh key"],
  [/(^|\/)(secrets?|\.secrets?|credentials?|\.aws|\.ssh|\.gnupg|\.kube)(\/|$)/i, "secrets or credentials folder"],
  [/(^|\/)(credentials?|service[-_]account[^/]*)\.json$/i, "credentials file"],
  [/\.(tfstate|tfstate\.backup|kdbx)$/i, "state or vault file"],
  [/(^|\/)(\.npmrc|\.pypirc|\.netrc|\.pgpass|\.htpasswd)$/i, "tool credentials file"],
];

export function denyReason(path, extra = []) {
  if (ENV_SAFE.test(path)) return null;
  for (const [re, why] of [...DENY, ...extra]) if (re.test(path)) return why;
  return null;
}

// The same list as Claude Code Read() permission globs, for the assessment clone's settings.
export const READ_DENY_GLOBS = [
  "**/.env", "**/.env.*", "**/*.pem", "**/*.key", "**/*.p12", "**/*.pfx", "**/*.jks", "**/*.keystore",
  "**/*.crt", "**/*.cer", "**/*.der", "**/*.gpg", "**/id_rsa*", "**/id_dsa*", "**/id_ecdsa*", "**/id_ed25519*",
  "**/secrets/**", "**/secret/**", "**/.secrets/**", "**/credentials/**", "**/credential/**", "**/.aws/**",
  "**/.ssh/**", "**/.gnupg/**", "**/.kube/**", "**/credentials.json", "**/service-account*.json",
  "**/*.tfstate", "**/*.tfstate.backup", "**/*.kdbx", "**/.npmrc", "**/.pypirc", "**/.netrc", "**/.pgpass", "**/.htpasswd",
];

// ── paths that are not worth a reviewer's time ────────────────────────────────────────────────────────

const SKIP = [
  [/(^|\/)(node_modules|vendor|third_party|dist|build|target|\.venv|venv|__pycache__|\.next|\.gradle|\.idea|\.git)(\/|$)/i, "vendored or built"],
  [/\.(png|jpe?g|gif|svg|ico|webp|pdf|zip|gz|tgz|jar|class|so|dylib|dll|exe|woff2?|ttf|eot|mp[34]|mov|bin|lock|min\.js|min\.css|map)$/i, "binary, lock or minified"],
  [/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|Cargo\.lock|go\.sum|Gemfile\.lock|composer\.lock|uv\.lock)$/, "lock file"],
  [/(^|\/)\.DS_Store$/, "os file"],
];
export const skipReason = (path) => SKIP.find(([re]) => re.test(path))?.[1] ?? null;

// ── languages ─────────────────────────────────────────────────────────────────────────────────────────

const LANG = {
  ".py": "Python", ".js": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript", ".jsx": "JavaScript",
  ".ts": "TypeScript", ".tsx": "TypeScript", ".java": "Java", ".kt": "Kotlin", ".go": "Go", ".rs": "Rust",
  ".rb": "Ruby", ".cs": "C#", ".php": "PHP", ".swift": "Swift", ".scala": "Scala", ".c": "C", ".h": "C",
  ".cc": "C++", ".cpp": "C++", ".hpp": "C++", ".sql": "SQL", ".sh": "Shell", ".bash": "Shell",
  ".tf": "Terraform", ".bicep": "Bicep", ".yml": "YAML", ".yaml": "YAML", ".json": "JSON", ".toml": "TOML",
  ".md": "Markdown", ".html": "HTML", ".css": "CSS", ".scss": "CSS", ".vue": "Vue", ".svelte": "Svelte",
  ".ipynb": "Notebook", ".proto": "Protobuf", ".graphql": "GraphQL", ".dockerfile": "Docker",
};
export function languageOf(path) {
  const name = basename(path);
  if (/^Dockerfile(\..+)?$/.test(name)) return "Docker";
  if (name === "Makefile") return "Make";
  return LANG[extname(name).toLowerCase()] ?? "Other";
}

// ── risk tiers ────────────────────────────────────────────────────────────────────────────────────────

const HIGH = [
  [/^\.github\/workflows\/|^\.gitlab-ci|(^|\/)Jenkinsfile|azure-pipelines|^\.circleci\//, "CI"],
  [/\.(tf|tfvars|bicep)$|(^|\/)(terraform|k8s|kubernetes|helm|charts|ansible|pulumi|cloudformation|deploy|infra|infrastructure)\/|(^|\/)Dockerfile|docker-compose/i, "infrastructure"],
  [/^\.claude\/|(^|\/)hooks?\/|SAFETY_INVARIANTS|(^|\/)CODEOWNERS$|^\.agentic\//, "safety text, hooks or permissions"],
  [/(^|\/)[^/]*(auth|oidc|oauth|saml|sso|login|session|token|jwt|keycloak|identity|permission|rbac|acl|crypto|password|secret)[^/]*/i, "authentication or access"],
  [/payment|billing|invoice|checkout|stripe|ledger|payroll/i, "payments or payroll"],
  [/(^|[/_.-])(pii|gdpr|privacy|patient|ssn)([/_.-]|$)/i, "personal data"],
  [/(^|\/)(prompts?|llm)[^/]*(\/|\.(py|ts|js|mjs|md|ya?ml|json)$)/i, "model or prompt"],
];
const LOW = [
  [/\.(md|txt|rst|adoc)$|^docs?\/|(^|\/)(LICENSE|NOTICE|CHANGELOG)[^/]*$|\.gitignore$/i, "docs"],
  [/\.(css|scss)$|\/static\//i, "styles and static"],
];

// `high: payments/**` — one rule per line; `#` comments. Returns [{tier, re, why}].
export function parseRiskPaths(text) {
  const rules = [];
  for (const raw of (text ?? "").split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^(high|medium|low)\s*:\s*(.+)$/i);
    if (m) rules.push({ tier: m[1].toLowerCase(), re: globToRegex(m[2].trim()), why: `RISK_PATHS: ${m[2].trim()}` });
  }
  return rules;
}

export function tierOf(path, custom = []) {
  for (const r of custom) if (r.re.test(path)) return { tier: r.tier, why: r.why };
  // Safety text is high even when it is markdown; other docs are low even when their name says "auth".
  if (HIGH[2][0].test(path)) return { tier: "high", why: HIGH[2][1] };
  if (LOW[0][0].test(path)) return { tier: "low", why: LOW[0][1] };
  for (const [re, why] of HIGH) if (re.test(path)) return { tier: "high", why };
  for (const [re, why] of LOW) if (re.test(path)) return { tier: "low", why };
  return { tier: "medium", why: "default" };
}

// gitignore-style globs, good enough for CODEOWNERS and RISK_PATHS.
export function globToRegex(glob) {
  let g = glob.trim();
  const anchored = g.startsWith("/");
  if (anchored) g = g.slice(1);
  const dir = g.endsWith("/");
  if (dir) g = g.slice(0, -1);
  let out = "";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*" && g[i + 1] === "*") { out += ".*"; i++; if (g[i + 1] === "/") i++; }
    else if (c === "*") out += "[^/]*";
    else if (c === "?") out += "[^/]";
    else out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  const head = anchored || g.includes("/") ? "^" : "(^|/)";
  return new RegExp(`${head}${out}${dir || !/\.[A-Za-z0-9]+$/.test(g) ? "(/|$)" : "$"}`);
}

export function parseCodeowners(text) {
  const entries = [];
  for (const raw of (text ?? "").split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const [pattern, ...owners] = line.split(/\s+/);
    if (owners.length) entries.push({ pattern, owners, re: globToRegex(pattern) });
  }
  return entries;
}
// The last matching line wins, as on GitHub.
export const ownersOf = (path, entries) => [...entries].reverse().find((e) => e.re.test(path))?.owners ?? [];

// ── commands, entry points, governance ────────────────────────────────────────────────────────────────

const CI_FILES = [/^\.github\/workflows\/[^/]+\.ya?ml$/, /^\.gitlab-ci\.ya?ml$/, /(^|\/)Jenkinsfile$/, /^azure-pipelines\.ya?ml$/, /^\.circleci\/config\.yml$/];

// `read(path)` returns a file's text, or null. Only manifests and CI files are ever read.
export function detectCommands(files, read) {
  const found = [];
  const add = (kind, source, command) => found.push({ kind, source, command });
  const has = (re) => files.filter((f) => re.test(f));
  for (const f of has(/(^|\/)package\.json$/)) {
    let scripts = {};
    try { scripts = JSON.parse(read(f) ?? "{}").scripts ?? {}; } catch { /* unreadable manifest */ }
    for (const k of ["test", "lint", "build", "typecheck", "start"]) if (scripts[k]) add(k === "start" ? "run" : k, f, `npm run ${k}   # ${String(scripts[k]).slice(0, 80)}`);
  }
  for (const f of has(/(^|\/)pyproject\.toml$/)) {
    const t = read(f) ?? "";
    if (/\[tool\.pytest|pytest/.test(t)) add("test", f, "pytest");
    if (/\[tool\.ruff|ruff/.test(t)) add("lint", f, "ruff check .");
    if (/\[tool\.mypy|mypy/.test(t)) add("typecheck", f, "mypy .");
    if (/importlinter/.test(t)) add("lint", f, "lint-imports");
  }
  if (has(/(^|\/)(setup\.py|requirements[^/]*\.txt)$/).length && !found.some((c) => c.kind === "test" && /pytest/.test(c.command))) {
    if (files.some((f) => /(^|\/)tests?\/.*\.py$/.test(f))) add("test", "tests/", "python -m pytest   # or the repo's own test scripts");
  }
  for (const f of has(/(^|\/)Makefile$/)) {
    for (const t of ["test", "lint", "build", "check"]) if (new RegExp(`^${t}\\s*:`, "m").test(read(f) ?? "")) add(t === "check" ? "test" : t, f, `make ${t}`);
  }
  if (has(/(^|\/)go\.mod$/).length) add("test", "go.mod", "go test ./...");
  if (has(/(^|\/)pom\.xml$/).length) add("test", "pom.xml", "mvn test");
  if (has(/(^|\/)build\.gradle(\.kts)?$/).length) add("test", "build.gradle", "gradle test");
  if (has(/\.(sln|csproj)$/).length) add("test", "*.csproj", "dotnet test");
  if (has(/(^|\/)Cargo\.toml$/).length) add("test", "Cargo.toml", "cargo test");
  if (has(/(^|\/)Gemfile$/).length) add("test", "Gemfile", "bundle exec rake test   # or rspec");
  const ci = files.filter((f) => CI_FILES.some((re) => re.test(f)));
  for (const f of ci.filter((x) => x.startsWith(".github/workflows/"))) {
    for (const line of (read(f) ?? "").split("\n")) {
      const m = line.match(/^\s*(?:- )?run:\s*(\S.*)$/);
      if (m && /\b(test|pytest|lint|typecheck|build|unittest)\b/i.test(m[1]) && found.length < 60) add("ci", f, m[1].slice(0, 100));
    }
  }
  return { commands: found, ci };
}

export function detectEntryPoints(files, read) {
  const out = [];
  for (const f of files) {
    const name = basename(f);
    if (/^(__main__\.py|manage\.py|main\.(go|py|rs|ts|js)|app\.(py|js|ts)|server\.(js|ts|py)|index\.(js|ts)|Program\.cs|Main\.java|Application\.java|cli\.(py|js|mjs|ts))$/.test(name) && f.split("/").length <= 4) out.push({ path: f, why: "conventional entry file" });
    else if (/^cmd\/[^/]+\/main\.go$/.test(f)) out.push({ path: f, why: "go command" });
  }
  for (const f of files.filter((x) => /(^|\/)package\.json$/.test(x))) {
    try {
      const p = JSON.parse(read(f) ?? "{}");
      if (p.main) out.push({ path: f, why: `package main: ${p.main}` });
      if (p.bin) out.push({ path: f, why: `package bin: ${typeof p.bin === "string" ? p.bin : Object.keys(p.bin).join(", ")}` });
    } catch { /* ignore */ }
  }
  for (const f of files.filter((x) => /(^|\/)pyproject\.toml$/.test(x))) {
    const m = (read(f) ?? "").match(/\[project\.scripts\]\n([\s\S]*?)(\n\[|$)/);
    if (m) out.push({ path: f, why: `python scripts: ${m[1].trim().split("\n").map((l) => l.split("=")[0].trim()).join(", ")}` });
  }
  for (const f of files.filter((x) => /(^|\/)Dockerfile$/.test(x))) out.push({ path: f, why: "container image" });
  return out;
}

// Has this repo been governed by Aveto? Answered from records, not from claims.
export function governance(files) {
  const s = new Set(files);
  const runDirs = new Set(files.map((f) => f.match(/^runs\/([^/]+)\//)?.[1]).filter(Boolean));
  const charters = files.filter((f) => /^runs\/[^/]+\/CHARTER\.md$/.test(f));
  const found = {
    agentic: files.some((f) => f.startsWith(".agentic/")),
    agents: files.some((f) => f.startsWith(".claude/agents/")),
    agenticConfig: s.has(".claude/agentic.config.json"),
    runs: runDirs.size,
    charters: charters.length,
    endReviews: files.filter((f) => /^runs\/[^/]+\/END_REVIEW\.md$/.test(f)).length,
    eventLogs: files.filter((f) => /^runs\/[^/]+\/events\.jsonl$/.test(f)).length,
  };
  found.governed = found.charters > 0 || (found.agenticConfig && found.runs > 0);
  return found;
}

// ── the map ───────────────────────────────────────────────────────────────────────────────────────────

const git = (repo, args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const APPROX_BYTES_PER_TOKEN = 4;

export function buildMap(repoDir, { scopes = [], rulesText, date } = {}) {
  const repo = resolve(repoDir);
  if (!existsSync(join(repo, ".git"))) throw new Error(`${repo} is not a git repository`);
  const sha = git(repo, ["rev-parse", "HEAD"]).trim();
  const branch = git(repo, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  const tracked = git(repo, ["ls-files", "-z"]).split("\0").filter(Boolean).sort();

  const readTracked = (p) => {
    if (denyReason(p) || !tracked.includes(p)) return null;
    try { return readFileSync(join(repo, p), "utf8"); } catch { return null; }
  };
  const customRules = parseRiskPaths(rulesText ?? readTracked(".agentic/RISK_PATHS") ?? "");
  const owners = parseCodeowners(readTracked(".github/CODEOWNERS") ?? readTracked("CODEOWNERS") ?? readTracked("docs/CODEOWNERS"));

  // churn: commits and distinct authors per file, from history alone
  const churn = new Map();
  let commits = 0;
  const log = git(repo, ["log", "--no-renames", "--format=\x01%an\x02%ad", "--date=short", "--name-only", "-n", "20000"]);
  for (const block of log.split("\x01").slice(1)) {
    const [head, ...names] = block.split("\n");
    const [author, day] = head.split("\x02");
    commits++;
    for (const n of names.filter(Boolean)) {
      const c = churn.get(n) ?? { commits: 0, authors: new Set(), last: day };
      c.commits++; c.authors.add(author);
      churn.set(n, c);
    }
  }

  const inScope = (p) => !scopes.length || scopes.some((s) => p === s || p.startsWith(s.replace(/\/?$/, "/")));
  const files = tracked.map((path) => {
    const denied = denyReason(path);
    const skipped = skipReason(path);
    const scoped = inScope(path);
    let bytes = 0;
    let kind = "file";
    if (!denied) {
      try { const st = lstatSync(join(repo, path)); if (st.isSymbolicLink()) kind = "symlink"; else if (st.isDirectory()) kind = "submodule"; else bytes = st.size; } catch { kind = "missing"; }
    }
    const status = denied ? "denied" : !scoped ? "out of scope" : skipped ? "skipped" : kind !== "file" ? "skipped" : "review";
    const t = tierOf(path, customRules);
    const c = churn.get(path);
    return {
      path, status, why: denied ?? (!scoped ? "outside --scope" : skipped ?? (kind !== "file" ? kind : null)),
      bytes, tokens: Math.ceil(bytes / APPROX_BYTES_PER_TOKEN), lang: languageOf(path), tier: t.tier, tierWhy: t.why,
      commits: c?.commits ?? 0, authors: c ? [...c.authors].sort() : [], last: c?.last ?? null, owners: ownersOf(path, owners),
    };
  });

  const readable = tracked.filter((p) => !denyReason(p));
  const { commands, ci } = detectCommands(readable, readTracked);
  return {
    repo: basename(repo), sha, branch, commits, date: date ?? new Date().toISOString().slice(0, 10),
    scopes, files, commands, ci, entryPoints: detectEntryPoints(readable, readTracked),
    governance: governance(tracked), customRules: customRules.length, codeowners: owners.length > 0,
  };
}

// ── the document ──────────────────────────────────────────────────────────────────────────────────────

const table = (head, rows) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
const fmt = new Intl.NumberFormat("en-US");

export function summarize(map) {
  const review = map.files.filter((f) => f.status === "review");
  const by = (key, list = review) => {
    const m = new Map();
    for (const f of list) { const k = f[key]; const e = m.get(k) ?? { files: 0, tokens: 0 }; e.files++; e.tokens += f.tokens; m.set(k, e); }
    return [...m.entries()].sort((a, b) => b[1].tokens - a[1].tokens || String(a[0]).localeCompare(String(b[0])));
  };
  return {
    review, tokens: review.reduce((s, f) => s + f.tokens, 0), languages: by("lang"), tiers: by("tier"),
    denied: map.files.filter((f) => f.status === "denied"), skipped: map.files.filter((f) => f.status === "skipped"),
    outOfScope: map.files.filter((f) => f.status === "out of scope"),
  };
}

export function renderMap(map) {
  const s = summarize(map);
  const g = map.governance;
  const top = [...s.review].sort((a, b) => b.commits - a.commits || a.path.localeCompare(b.path)).slice(0, 15).filter((f) => f.commits);
  const dirs = new Map();
  for (const f of s.review) {
    const d = f.path.includes("/") ? f.path.split("/")[0] : "(root)";
    const e = dirs.get(d) ?? { files: 0, tokens: 0, high: 0 };
    e.files++; e.tokens += f.tokens; if (f.tier === "high") e.high++;
    dirs.set(d, e);
  }
  const L = [];
  L.push(`# Repo map: ${map.repo}`, "");
  L.push(`> Generated ${map.date} by \`execution/repo-map.mjs\` at commit \`${map.sha}\` (branch \`${map.branch}\`). Deterministic, no model.`);
  L.push("> It read file names, sizes and git history, plus build and CI manifests. It opened no source file. Paths on the secret-path list are named below and nothing else about them was read.", "");
  if (map.scopes.length) L.push(`**Scope:** ${map.scopes.map((x) => `\`${x}\``).join(", ")}. Everything else is listed as out of scope, not skipped silently.`, "");
  L.push("## Summary", "", table(["", ""], [
    ["Tracked files", fmt.format(map.files.length)], ["To review", fmt.format(s.review.length)],
    ["Approx. tokens to read", `${fmt.format(s.tokens)} (bytes / ${APPROX_BYTES_PER_TOKEN}, an estimate)`],
    ["Excluded: secret paths", fmt.format(s.denied.length)], ["Skipped: vendored, binary, lock", fmt.format(s.skipped.length)],
    ["Out of scope", fmt.format(s.outOfScope.length)], ["Commits in history read", fmt.format(map.commits)],
    ["Custom risk rules", String(map.customRules)], ["CODEOWNERS", map.codeowners ? "found" : "none"],
  ]), "");
  L.push("## Was this repo governed by Aveto?", "");
  L.push(g.governed
    ? `**Records found:** ${g.charters} Charter(s), ${g.runs} run folder(s), ${g.endReviews} end review(s), ${g.eventLogs} event log(s).`
    : "**No Aveto records found** (no Charter in `runs/`, no pack config with runs). Anything said about how it was built is a claim, not a record.");
  L.push("", `\`.agentic/\`: ${g.agentic ? "present" : "absent"}. \`.claude/agents/\`: ${g.agents ? "present" : "absent"}. \`.claude/agentic.config.json\`: ${g.agenticConfig ? "present" : "absent"}.`, "");
  L.push("## Risk tiers (files to review)", "", table(["Tier", "Files", "Approx. tokens"], s.tiers.map(([k, v]) => [k, fmt.format(v.files), fmt.format(v.tokens)])), "");
  L.push("## Languages", "", table(["Language", "Files", "Approx. tokens"], s.languages.map(([k, v]) => [k, fmt.format(v.files), fmt.format(v.tokens)])), "");
  L.push("## Areas (top-level folders)", "", table(["Folder", "Files", "High-risk files", "Approx. tokens"],
    [...dirs.entries()].sort((a, b) => b[1].high - a[1].high || b[1].tokens - a[1].tokens || a[0].localeCompare(b[0])).map(([k, v]) => [`\`${k}\``, fmt.format(v.files), fmt.format(v.high), fmt.format(v.tokens)])), "");
  L.push("## High-risk files", "");
  const high = s.review.filter((f) => f.tier === "high");
  L.push(high.length ? table(["Path", "Why", "Owners"], high.slice(0, 60).map((f) => [`\`${f.path}\``, f.tierWhy, f.owners.join(" ") || "—"])) : "None matched.");
  if (high.length > 60) L.push("", `…and ${high.length - 60} more (see \`map.json\`).`);
  L.push("", "## Most changed files", "");
  L.push(top.length ? table(["Path", "Commits", "Authors", "Last change"], top.map((f) => [`\`${f.path}\``, String(f.commits), String(f.authors.length), f.last ?? "—"])) : "No history for the files to review.", "");
  L.push("## Commands found", "");
  const cmds = map.commands.filter((c) => c.kind !== "ci");
  L.push(cmds.length ? table(["Kind", "Command", "Source"], cmds.map((c) => [c.kind, `\`${c.command.replace(/\|/g, "\\|")}\``, `\`${c.source}\``])) : "**No tests found.** No test, lint or build command was detected from the manifests.", "");
  if (map.ci.length) L.push(`**CI files:** ${map.ci.map((c) => `\`${c}\``).join(", ")}`, "");
  const ciCmds = map.commands.filter((c) => c.kind === "ci");
  if (ciCmds.length) L.push(table(["CI step", "File"], ciCmds.slice(0, 20).map((c) => [`\`${c.command.replace(/\|/g, "\\|")}\``, `\`${c.source}\``])), "");
  L.push("## Entry points", "", map.entryPoints.length ? table(["Path", "Why"], map.entryPoints.map((e) => [`\`${e.path}\``, e.why.replace(/\|/g, "\\|")])) : "None detected.", "");
  L.push("## Excluded: secret paths (named only)", "", s.denied.length ? s.denied.map((f) => `- \`${f.path}\` (${f.why})`).join("\n") : "None.", "");
  return L.join("\n");
}

// ── command line ──────────────────────────────────────────────────────────────────────────────────────

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const val = (flag) => { const i = a.indexOf(flag); return i >= 0 ? a[i + 1] : undefined; };
  const all = (flag) => a.flatMap((x, i) => (x === flag ? [a[i + 1]] : []));
  const repo = a.find((x, i) => !x.startsWith("--") && !["--out", "--scope", "--rules", "--date"].includes(a[i - 1]));
  if (!repo) { console.error("usage: node repo-map.mjs <repo> [--out <dir>] [--scope <subdir>]... [--rules <file>] [--date YYYY-MM-DD] [--json]"); process.exit(1); }
  const map = buildMap(repo, { scopes: all("--scope"), rulesText: val("--rules") ? readFileSync(val("--rules"), "utf8") : undefined, date: val("--date") });
  const out = val("--out");
  if (out) {
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "MAP.md"), renderMap(map));
    writeFileSync(join(out, "map.json"), JSON.stringify(map, null, 2) + "\n");
    console.log(`wrote ${join(out, "MAP.md")} and map.json (${map.files.length} files, commit ${map.sha.slice(0, 8)})`);
  } else console.log(a.includes("--json") ? JSON.stringify(map, null, 2) : renderMap(map));
}
