import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { checkClaims } from "./check-claims.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wrap = (rows) => `## 8. The claims register\n\n| id | Claim | Status | Evidence | Limit |\n|---|---|---|---|---|\n${rows}\n\n## 9. Next\n`;

describe("check-claims", () => {
  test("the real register passes", () => {
    const r = checkClaims(readFileSync(join(root, "docs", "MESSAGING.md"), "utf8"), root);
    assert.deepEqual(r.errors, []);
    assert.ok(r.rows >= 10);
  });
  test("a missing local evidence path fails", () => {
    const r = checkClaims(wrap("| C1 | x | proven | `docs/NOPE_DOES_NOT_EXIST.md` | y |"), root);
    assert.ok(r.errors.some((e) => /does not exist: docs\/NOPE/.test(e)));
  });
  test("a path in another repo is not checked here", () => {
    const r = checkClaims(wrap("| C1 | x | proven | aveto-support `runs/land-answerability/` | y |"), root);
    assert.deepEqual(r.errors, []);
  });
  test("no evidence, no status and duplicate ids fail", () => {
    const r = checkClaims(wrap("| C1 | x |  |  | y |\n| C1 | z | planned | `docs/CODE_REVIEW.md` | |"), root);
    assert.ok(r.errors.some((e) => /no status/.test(e)));
    assert.ok(r.errors.some((e) => /no evidence/.test(e)));
    assert.ok(r.errors.some((e) => /duplicate id/.test(e)));
  });
  test("a missing register fails", () => {
    assert.equal(checkClaims("# nothing", root).ok, false);
  });
});
