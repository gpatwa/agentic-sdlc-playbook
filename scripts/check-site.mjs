#!/usr/bin/env node
// Gates for the public site, in the same spirit as the rest of the repo:
// dependency-free, fails closed, and every check exists because something
// actually broke — not because a linter suggested it.
//
// Run: node scripts/check-site.mjs [dir]   (default: site)

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.argv[2] ?? "site";
const failures = [];
const fail = (file, msg) => failures.push(`${file}: ${msg}`);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? htmlFiles(p) : extname(p) === ".html" ? [p] : [];
  });
}

for (const file of htmlFiles(root)) {
  const html = readFileSync(file, "utf8");

  // 1. Structure. An unbalanced container silently swallows the rest of the
  //    page; the browser recovers and nobody notices until a section vanishes.
  for (const tag of ["div", "section", "details", "table"]) {
    const open = (html.match(new RegExp(`<${tag}\\b`, "g")) ?? []).length;
    const close = (html.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
    if (open !== close) fail(file, `unbalanced <${tag}>: ${open} open, ${close} close`);
  }

  // 2. Theme-token completeness. THE bug this file exists for: a custom
  //    property declared in :root but missing from a dark block renders one
  //    theme's text on the other theme's ground. Hit twice by hand.
  const block = (re) => (html.match(re)?.[0] ?? "");
  const names = (s) => new Set([...s.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const light = names(block(/:root\s*\{[^}]*\}/));
  const mediaDark = names(block(/:root:not\(\[data-theme="light"\]\)\s*\{[^}]*\}/));
  const attrDark = names(block(/:root\[data-theme="dark"\]\s*\{[^}]*\}/));
  if (light.size && (mediaDark.size || attrDark.size)) {
    for (const [label, set] of [["@media dark", mediaDark], ['[data-theme="dark"]', attrDark]]) {
      if (!set.size) continue;
      // Colour tokens must be redefined; fonts/sizes/shadows legitimately are not.
      for (const t of set) if (!light.has(t)) fail(file, `${t} defined in ${label} but not in :root`);
      for (const t of light) {
        if (!/color|ground|surface|ink|muted|faint|rule|gold|seal|pass|block|held|risk|lost|sunk|wash|shadow/.test(t)) continue;
        if (!set.has(t)) fail(file, `${t} missing from ${label} — will render the wrong theme`);
      }
    }
  }

  // 3. Internal anchors resolve. Nav links that go nowhere are the most
  //    common silent breakage when sections get renamed.
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (m[1] && !ids.has(m[1])) fail(file, `dead anchor: #${m[1]}`);
  }

  // 4. Required head elements. Missing viewport ships a desktop layout to
  //    phones; missing lang breaks screen readers.
  if (!/<html[^>]+lang=/.test(html)) fail(file, "missing <html lang>");
  if (!/<meta[^>]+viewport/.test(html)) fail(file, "missing viewport meta");
  if (!/<meta[^>]+charset/i.test(html)) fail(file, "missing charset");
  if (!/<title>[^<]{2,}<\/title>/.test(html)) fail(file, "missing or empty <title>");

  // 5. No placeholders reaching production.
  for (const bad of ["lorem ipsum", "TODO", "FIXME", "XXX", "REPLACE_ME"]) {
    if (html.toLowerCase().includes(bad.toLowerCase())) fail(file, `placeholder text present: ${bad}`);
  }

  // 6. External *resources*. The page must stay self-contained apart from
  //    fonts — an unnoticed third-party script is both a privacy and an uptime
  //    problem, and it silently breaks under the CSP in site/_headers.
  //    Navigation links (<a href>) are deliberately NOT restricted: linking to
  //    GitHub is normal, loading a script from it is not.
  const allowed = ["fonts.googleapis.com", "fonts.gstatic.com"];
  const resources = [
    ...html.matchAll(/<(?:script|img|iframe|video|audio|source)\b[^>]*\ssrc="https?:\/\/([^/"]+)/gi),
    // rel=canonical / alternate name a URL for crawlers; the browser loads
    // nothing from them, so they are metadata, not a third-party resource.
    ...[...html.matchAll(/<link\b[^>]*>/gi)]
      .filter((m) => !/\srel="(?:canonical|alternate)"/i.test(m[0]))
      .flatMap((m) => [...m[0].matchAll(/\shref="https?:\/\/([^/"]+)/gi)]),
  ];
  for (const m of resources) {
    if (!allowed.includes(m[1])) fail(file, `unexpected external resource origin: ${m[1]}`);
  }

  // 6b. Outbound links should at least be https and not obviously broken.
  for (const m of html.matchAll(/<a\b[^>]*\shref="(http:\/\/[^"]+)"/gi)) {
    fail(file, `insecure outbound link: ${m[1]}`);
  }
}

if (!htmlFiles(root).length) fail(root, "no HTML files found");

for (const f of failures) console.error(`::error::${f}`);
console.log(
  failures.length
    ? `site checks: ${failures.length} failure(s)`
    : `site checks: all passed (${htmlFiles(root).length} file(s))`
);
process.exit(failures.length ? 1 : 0);
