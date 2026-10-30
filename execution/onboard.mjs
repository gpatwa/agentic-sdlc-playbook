// onboard.mjs — proposes the .agentic/ files for a repository Aveto did not build (install.mjs --existing).
// Everything here is derived from the repo map (file names, manifests, CODEOWNERS), with no model and no invented
// claims. Every line is marked "(proposed, not confirmed)": writing safety text is a rule 4 change, so nothing becomes
// binding until a Charter names it (docs/REVIEW_MODE_PLAN.md, M1).
import { summarize } from "./repo-map.mjs";

export const PROPOSED = "(proposed, not confirmed)";
const BANNER = (what) =>
  `> **PROPOSED by \`install.mjs --existing\`, not confirmed.** ${what}\n> Derived from file names, manifests and git history only; no model read the code. A person must confirm or replace\n> every line before a Charter can rely on it.\n`;

const uniq = (xs) => [...new Set(xs)];

export function proposeAgentic(map) {
  const s = summarize(map);
  const g = map.governance;
  const langs = s.languages.filter(([k]) => !["Markdown", "JSON", "YAML", "TOML", "Other", "HTML", "CSS"].includes(k)).slice(0, 5).map(([k]) => k);
  const context = [
    `# Project Context — ${map.repo}`, "",
    BANNER("The context below is what the repository itself shows."),
    `- ${PROPOSED} Repository: \`${map.repo}\`, assessed at commit \`${map.sha.slice(0, 12)}\` on ${map.date}.`,
    `- ${PROPOSED} Main languages: ${langs.join(", ") || "none detected"}.`,
    `- ${PROPOSED} Size to review: ${s.review.length} files, about ${s.tokens.toLocaleString("en-US")} tokens (an estimate).`,
    `- ${PROPOSED} Entry points: ${map.entryPoints.slice(0, 8).map((e) => `\`${e.path}\``).join(", ") || "none detected"}.`,
    `- ${PROPOSED} Governed by Aveto before this install: ${g.governed ? `yes (${g.charters} Charter records)` : "no records found"}.`,
    "", "**What the product is, who it serves and what it must never do are not in the code.** The owner writes them here.", "",
  ].join("\n");

  const cmds = map.commands.filter((c) => c.kind !== "ci");
  const commands = [
    "# Local Commands", "", BANNER("Commands detected from build manifests and CI files. Run each once and correct it."),
    ...(cmds.length ? cmds.map((c) => `- ${PROPOSED} ${c.kind}: \`${c.command.replace(/\s+#.*$/, "")}\` (from \`${c.source}\`)`) : ["**No tests found.** No test, lint or build command was detected. Agents cannot verify their work until the owner adds one."]),
    "",
  ].join("\n");

  const lines = [`- ${PROPOSED} Files on the secret-path list (environment files, keys, certificates, credentials folders) are never read by an agent or sent to a model.`];
  const high = s.review.filter((f) => f.tier === "high");
  const area = (re) => uniq(high.filter((f) => re.test(f.tierWhy)).map((f) => f.path.split("/").slice(0, 2).join("/"))).slice(0, 6);
  for (const [re, what, rule] of [
    [/^CI$/, "CI files", "are high risk and need a human review before merge"],
    [/^authentication/, "authentication and access code", "needs a Security review before merge"],
    [/^infrastructure/, "infrastructure and deployment files", "are high risk and need a human review before merge"],
    [/^payments/, "payment and payroll code", "needs a Security review before merge"],
    [/^personal data/, "code that handles personal data", "needs a Privacy review before merge"],
    [/^safety text/, "agent configuration, hooks and safety text", "are high risk and need a human review before merge"],
  ]) {
    const paths = area(re);
    if (paths.length) lines.push(`- ${PROPOSED} Changes to ${what} (${paths.map((p) => `\`${p}\``).join(", ")}) ${rule}.`);
  }
  if (map.codeowners) lines.push(`- ${PROPOSED} A change in a path with a CODEOWNERS entry is reviewed by the listed owner.`);
  const invariants = [
    "# Safety Invariants", "", BANNER("Each line is testable and mechanically derived. None is binding until a Charter names it."),
    ...lines, "",
    "**The invariants that matter most are the ones only the owner knows** (what must never happen to a user, to money, to data). Add them above the proposed lines.", "",
  ].join("\n");

  return { "PROJECT_CONTEXT.md": context, "LOCAL_COMMANDS.md": commands, "SAFETY_INVARIANTS.md": invariants };
}
