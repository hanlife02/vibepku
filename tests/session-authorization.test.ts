import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessAdmin,
  canAccessSuperAdmin,
  isBanned,
} from "../app/lib/session";

test("authorization helpers block banned admins and super admins", () => {
  const bannedAt = new Date("2026-01-01T00:00:00.000Z");

  assert.equal(isBanned({ bannedAt }), true);
  assert.equal(canAccessAdmin({ role: "ADMIN", bannedAt }), false);
  assert.equal(canAccessSuperAdmin({ role: "SUPER_ADMIN", bannedAt }), false);
});

test("authorization helpers allow active admins and super admins", () => {
  assert.equal(canAccessAdmin({ role: "ADMIN", bannedAt: null }), true);
  assert.equal(canAccessAdmin({ role: "SUPER_ADMIN", bannedAt: null }), true);
  assert.equal(canAccessSuperAdmin({ role: "ADMIN", bannedAt: null }), false);
  assert.equal(canAccessSuperAdmin({ role: "SUPER_ADMIN", bannedAt: null }), true);
});
