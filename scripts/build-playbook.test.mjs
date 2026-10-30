// The playbook page is generated from docs/PLAYBOOK.md. These pin the conversions that went wrong when it was hand-converted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { convert, inline } from "./build-playbook.mjs";

test("a list item that wraps across lines stays one item", () => {
  const { body } = convert("- one that\n  continues here\n- two\n");
  assert.deepEqual(body, ["<ul><li>one that continues here</li><li>two</li></ul>"]);
});
test("a numbered list stays numbered and a following paragraph is separate", () => {
  const { body } = convert("1. a\n2. b\n\nafter\n");
  assert.equal(body[0], "<ol><li>a</li><li>b</li></ol>");
  assert.equal(body[1], "<p>after</p>");
});
test("code naming a file in this repo becomes a link; a path that is not in the repo does not", () => {
  assert.match(inline("`docs/PLAYBOOK.md`"), /<a href="https:\/\/github.com\/gpatwa\/agentic-sdlc-playbook\/blob\/main\/docs\/PLAYBOOK.md"><code>/);
  assert.equal(inline("`runs/<slice>/CHARTER.md`"), "<code>runs/&lt;slice&gt;/CHARTER.md</code>");
});
test("markup in the source is escaped, not passed through", () => {
  assert.equal(inline("a <b> & c"), "a &lt;b&gt; &amp; c");
});
test("headings get ids and a table-of-contents entry", () => {
  const { toc, body } = convert("## 3. Roles: delegate, check, own\n");
  assert.equal(toc[0].id, "3-roles-delegate-check-own");
  assert.match(body[0], /<h2 id="3-roles-delegate-check-own">/);
});
