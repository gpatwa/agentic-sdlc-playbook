#!/usr/bin/env node
// Builds the body of site/playbook.html from docs/PLAYBOOK.md, so the page cannot drift from
// the document it publishes (it did once: part 8 was corrected in the markdown and not here).
//
//   node scripts/build-playbook.mjs           rewrite the <main class="doc"> block
//   node scripts/build-playbook.mjs --check   exit 1 if the page is not what the markdown produces
//
// Dependency-free. Handles only what PLAYBOOK.md uses: headings, paragraphs, bullet and numbered
// lists with indented continuation lines, tables, a blockquote, rules, and inline code, bold,
// italics and links. Inline code that names a file or folder in this repo becomes a GitHub link.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const GH = "https://github.com/gpatwa/agentic-sdlc-playbook";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const repoLink = (path) => {
  const clean = path.replace(/\/$/, "");
  if (!/^(docs|execution|templates|agents|scripts)\//.test(path) && path !== "agents/") return null;
  const abs = join(root, clean);
  if (!existsSync(abs)) return null;
  return `${GH}/${path.endsWith("/") || !/\.[a-z]+$/.test(clean) ? "tree" : "blob"}/main/${clean}`;
};

export function inline(text) {
  const parts = [];
  // 1. pull out code spans and links first so their contents are not re-interpreted
  let t = text.replace(/`([^`]+)`/g, (_, c) => {
    parts.push(`<code>${esc(c)}</code>`);
    const href = repoLink(c);
    if (href) parts[parts.length - 1] = `<a href="${href}">${parts[parts.length - 1]}</a>`;
    return `\u0000${parts.length - 1}\u0000`;
  });
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    parts.push(`<a href="${esc(href)}">${inlineNoLinks(label)}</a>`);
    return `\u0000${parts.length - 1}\u0000`;
  });
  t = inlineNoLinks(t);
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => parts[Number(i)]);
}
const inlineNoLinks = (t) =>
  esc(t.replace(/\u0000/g, "\u0001")).replace(/\u0001/g, "\u0000")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");

const slug = (h) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function convert(md) {
  const lines = md.split("\n");
  const out = [];
  const toc = [];
  let title = "";
  let i = 0;
  const isBlank = (l) => !l.trim();
  const isItem = (l) => /^(\s*)([-*]|\d+\.)\s+/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (isBlank(l) || /^---+$/.test(l.trim())) { i++; continue; }
    let m;
    if ((m = l.match(/^# (.+)/))) { title = m[1]; i++; continue; }
    if ((m = l.match(/^## (.+)/))) {
      const id = slug(m[1]);
      toc.push({ id, label: m[1] });
      out.push(`<h2 id="${id}">${inline(m[1])}</h2>`);
      i++; continue;
    }
    if (l.startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<p class="doc-note">${inline(buf.join(" "))}</p>`);
      continue;
    }
    if (l.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push(`<div class="doc-table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (isItem(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length && !isBlank(lines[i]) && (isItem(lines[i]) || /^\s+\S/.test(lines[i]))) {
        if (isItem(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${tag}>`);
      continue;
    }
    const buf = [];
    while (i < lines.length && !isBlank(lines[i]) && !/^(#|>|\||---)/.test(lines[i]) && !isItem(lines[i])) buf.push(lines[i++].trim());
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return { title, toc, body: out };
}

export function mainBlock(md) {
  const { title, toc, body } = convert(md);
  const tocHtml = `<nav class="doc-toc" aria-label="Parts of the playbook"><p class="doc-toc-label">Parts</p>${toc.map((t) => `<a href="#${t.id}">${esc(t.label)}</a>`).join("")}</nav>`;
  // The blockquote and the lead question come before the first part; the TOC goes after the title.
  return `<main class="doc" id="main" tabindex="-1">
    <p class="sec-eyebrow">The playbook</p>
    <h1>${esc(title)}</h1>
    ${tocHtml}
    ${body.join("\n    ")}
    <p><a href="${GH}/blob/main/docs/PLAYBOOK.md">Read this page on GitHub</a>, where every linked document lives.</p>
  </main>`;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const page = join(root, "site", "playbook.html");
  const html = readFileSync(page, "utf8");
  const re = /<main class="doc"[^>]*>[\s\S]*?<\/main>/;
  if (!re.test(html)) { console.error("playbook.html has no <main class=\"doc\"> block"); process.exit(2); }
  const next = html.replace(re, mainBlock(readFileSync(join(root, "docs", "PLAYBOOK.md"), "utf8")));
  if (process.argv.includes("--check")) {
    if (next !== html) { console.error("site/playbook.html is not what docs/PLAYBOOK.md produces: run node scripts/build-playbook.mjs"); process.exit(1); }
    console.log("playbook page matches docs/PLAYBOOK.md");
  } else {
    writeFileSync(page, next);
    console.log("wrote site/playbook.html main block from docs/PLAYBOOK.md");
  }
}
