import test from "node:test";
import assert from "node:assert/strict";
import { parseBoundedInteger } from "../lib/pagination.ts";

test("uses fallback for missing or malformed query parameters", () => {
  assert.equal(parseBoundedInteger(null, 9, 1, 9), 9);
  assert.equal(parseBoundedInteger("", 9, 1, 9), 9);
  assert.equal(parseBoundedInteger("3abc", 9, 1, 9), 9);
  assert.equal(parseBoundedInteger("1.5", 9, 1, 9), 9);
});

test("clamps valid integers to the configured range", () => {
  assert.equal(parseBoundedInteger("-10", 0, 0, 100000), 0);
  assert.equal(parseBoundedInteger("0", 9, 1, 9), 1);
  assert.equal(parseBoundedInteger("8", 9, 1, 9), 8);
  assert.equal(parseBoundedInteger("500", 9, 1, 9), 9);
});

test("rejects integers outside JavaScript's safe range", () => {
  assert.equal(parseBoundedInteger("999999999999999999999", 50, 1, 100), 50);
});
