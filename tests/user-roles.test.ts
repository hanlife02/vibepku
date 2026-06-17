import assert from "node:assert/strict";
import test from "node:test";
import {
  initialSuperAdminIds,
  shouldGrantInitialSuperAdmin,
} from "../app/lib/user-roles";

test("initialSuperAdminIds parses comma and whitespace separated ids", () => {
  assert.deepEqual(
    initialSuperAdminIds("github", {
      INITIAL_SUPER_ADMIN_GITHUB_IDS: "123, 456\n789",
      INITIAL_SUPER_ADMIN_GITHUB_ID: "999",
    }),
    ["123", "456", "789", "999"],
  );
});

test("shouldGrantInitialSuperAdmin blocks public first-login takeover in production", () => {
  assert.equal(
    shouldGrantInitialSuperAdmin(
      {
        provider: "github",
        providerId: "123",
        superAdminCount: 0,
        nodeEnv: "production",
      },
      {},
    ),
    false,
  );
});

test("shouldGrantInitialSuperAdmin allows configured production admins", () => {
  assert.equal(
    shouldGrantInitialSuperAdmin(
      {
        provider: "github",
        providerId: "123",
        superAdminCount: 0,
        nodeEnv: "production",
      },
      { INITIAL_SUPER_ADMIN_GITHUB_IDS: "123,456" },
    ),
    true,
  );
  assert.equal(
    shouldGrantInitialSuperAdmin(
      {
        provider: "casdoor",
        providerId: "casdoor-user",
        superAdminCount: 0,
        nodeEnv: "production",
      },
      { INITIAL_SUPER_ADMIN_CASDOOR_IDS: "casdoor-user" },
    ),
    true,
  );
});

test("shouldGrantInitialSuperAdmin only applies while no super admin exists", () => {
  assert.equal(
    shouldGrantInitialSuperAdmin(
      {
        provider: "github",
        providerId: "123",
        superAdminCount: 1,
        nodeEnv: "production",
      },
      { INITIAL_SUPER_ADMIN_GITHUB_IDS: "123" },
    ),
    false,
  );
});

test("shouldGrantInitialSuperAdmin preserves non-production bootstrap", () => {
  assert.equal(
    shouldGrantInitialSuperAdmin(
      {
        provider: "github",
        providerId: "dev-user-1",
        superAdminCount: 0,
        nodeEnv: "development",
      },
      {},
    ),
    true,
  );
});
