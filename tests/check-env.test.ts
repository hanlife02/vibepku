import assert from "node:assert/strict";
import test from "node:test";
import { checkProductionEnv, formatEnvCheck } from "../scripts/check-env";

const baseEnv = {
  DATABASE_URL: "postgresql://user:pass@example.com:5432/vibepku",
  NEXT_PUBLIC_APP_URL: "https://vibepku.example",
  GITHUB_CLIENT_ID: "github-client",
  GITHUB_CLIENT_SECRET: "github-secret",
  INITIAL_SUPER_ADMIN_GITHUB_IDS: "123456",
  UPLOAD_STORAGE_DRIVER: "s3",
  S3_BUCKET: "vibepku",
  S3_REGION: "auto",
  S3_ACCESS_KEY_ID: "access",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_PUBLIC_BASE_URL: "https://cdn.example.com/uploads",
  S3_FORCE_PATH_STYLE: "true",
};

test("checkProductionEnv accepts a complete production configuration", () => {
  const result = checkProductionEnv(baseEnv);

  assert.deepEqual(result.errors, []);
});

test("checkProductionEnv rejects missing core production settings", () => {
  const result = checkProductionEnv({});

  assert.match(result.errors.join("\n"), /DATABASE_URL is required/);
  assert.match(result.errors.join("\n"), /NEXT_PUBLIC_APP_URL is required/);
  assert.match(result.errors.join("\n"), /at least one login provider/);
  assert.match(result.errors.join("\n"), /GitHub OAuth/);
  assert.match(result.errors.join("\n"), /INITIAL_SUPER_ADMIN/);
});

test("checkProductionEnv rejects deployments with GitHub disabled and no Casdoor", () => {
  const result = checkProductionEnv({
    ...baseEnv,
    GITHUB_LOGIN_ENABLED: "false",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    INITIAL_SUPER_ADMIN_GITHUB_IDS: "",
  });

  assert.match(result.errors.join("\n"), /at least one login provider/);
});

test("checkProductionEnv rejects localhost app URLs", () => {
  const result = checkProductionEnv({
    ...baseEnv,
    NEXT_PUBLIC_APP_URL: "http://localhost:3001",
  });

  assert.match(result.errors.join("\n"), /must not point to localhost/);
});

test("checkProductionEnv requires initial admin ids for a configured provider", () => {
  const result = checkProductionEnv({
    ...baseEnv,
    INITIAL_SUPER_ADMIN_GITHUB_IDS: "",
  });

  assert.match(result.errors.join("\n"), /INITIAL_SUPER_ADMIN/);
});

test("checkProductionEnv validates S3 upload configuration", () => {
  const result = checkProductionEnv({
    ...baseEnv,
    S3_PUBLIC_BASE_URL: "",
  });

  assert.match(result.errors.join("\n"), /S3 upload config is incomplete/);
});

test("checkProductionEnv warns when production uses local uploads", () => {
  const result = checkProductionEnv({
    ...baseEnv,
    UPLOAD_STORAGE_DRIVER: "local",
    UPLOAD_PUBLIC_BASE_URL: "/uploads",
  });

  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join("\n"), /persistent writable disk/);
});

test("formatEnvCheck reports errors and warnings", () => {
  assert.equal(
    formatEnvCheck({ errors: ["bad"], warnings: ["careful"] }),
    "Environment check failed:\n- bad\nWarnings:\n- careful",
  );
  assert.equal(formatEnvCheck({ errors: [], warnings: [] }), "Environment check passed.");
});
