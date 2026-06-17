import assert from "node:assert/strict";
import test from "node:test";
import {
  createSlug,
  displayCategory,
  displayStatus,
  fromStoredList,
  splitList,
  toStoredList,
} from "../app/lib/product-shared";

test("splitList accepts comma and newline separated values", () => {
  assert.deepEqual(splitList("AI, PKU\n Vibe Coding ,, "), [
    "AI",
    "PKU",
    "Vibe Coding",
  ]);
});

test("stored list helpers round trip JSON and tolerate legacy text", () => {
  const stored = toStoredList([" Cursor ", "", "Claude Code"]);

  assert.equal(stored, '["Cursor","Claude Code"]');
  assert.deepEqual(fromStoredList(stored), ["Cursor", "Claude Code"]);
  assert.deepEqual(fromStoredList("AI\nProducts"), ["AI", "Products"]);
});

test("createSlug normalizes product names and falls back for non-latin names", () => {
  assert.equal(createSlug("PKU AI Hub! 2026"), "pku-ai-hub-2026");
  assert.equal(createSlug("北京大学"), "product");
});

test("display helpers map known values and preserve unknown values", () => {
  assert.equal(displayCategory("Dev Tools"), "开发工具");
  assert.equal(displayCategory("Unknown"), "Unknown");
  assert.equal(displayStatus("PENDING_REVIEW"), "待审核");
  assert.equal(displayStatus("CUSTOM"), "CUSTOM");
});
