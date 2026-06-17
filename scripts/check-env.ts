import { loadEnvConfig } from "@next/env";

type Env = Record<string, string | undefined>;

export type EnvCheckResult = {
  errors: string[];
  warnings: string[];
};

function value(env: Env, name: string) {
  const raw = env[name]?.trim();
  return raw || null;
}

function hasAll(env: Env, names: string[]) {
  return names.every((name) => value(env, name));
}

function missing(env: Env, names: string[]) {
  return names.filter((name) => !value(env, name));
}

function isHttpUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalhost(raw: string) {
  try {
    const hostname = new URL(raw).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function hasInitialAdminForConfiguredProvider(env: Env) {
  const githubIds = value(env, "INITIAL_SUPER_ADMIN_GITHUB_IDS") ?? value(env, "INITIAL_SUPER_ADMIN_GITHUB_ID");
  const casdoorIds = value(env, "INITIAL_SUPER_ADMIN_CASDOOR_IDS") ?? value(env, "INITIAL_SUPER_ADMIN_CASDOOR_ID");
  const githubConfigured = value(env, "GITHUB_LOGIN_ENABLED") !== "false" && hasAll(env, ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]);
  const casdoorConfigured = hasAll(env, ["CASDOOR_ENDPOINT", "CASDOOR_CLIENT_ID", "CASDOOR_CLIENT_SECRET"]);

  return Boolean((githubIds && githubConfigured) || (casdoorIds && casdoorConfigured));
}

export function checkProductionEnv(env: Env = process.env): EnvCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const appUrl = value(env, "NEXT_PUBLIC_APP_URL");
  const databaseUrl = value(env, "DATABASE_URL");
  const uploadDriver = (value(env, "UPLOAD_STORAGE_DRIVER") ?? "local").toLowerCase();
  const githubEnabled = value(env, "GITHUB_LOGIN_ENABLED") !== "false";
  const githubFields = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"];
  const casdoorFields = ["CASDOOR_ENDPOINT", "CASDOOR_CLIENT_ID", "CASDOOR_CLIENT_SECRET"];
  const githubConfigured = githubEnabled && hasAll(env, githubFields);
  const casdoorConfigured = hasAll(env, casdoorFields);
  const s3Fields = [
    "S3_BUCKET",
    "S3_REGION",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_PUBLIC_BASE_URL",
  ];

  if (!databaseUrl) {
    errors.push("DATABASE_URL is required.");
  } else if (!databaseUrl.startsWith("file:")) {
    errors.push("DATABASE_URL must use a file: URL because this Prisma schema uses the SQLite provider.");
  } else {
    warnings.push("DATABASE_URL uses SQLite; make sure the production filesystem is persistent and backed up.");
  }

  if (!appUrl) {
    errors.push("NEXT_PUBLIC_APP_URL is required.");
  } else {
    if (!isHttpUrl(appUrl)) {
      errors.push("NEXT_PUBLIC_APP_URL must be an http or https URL.");
    }
    if (isLocalhost(appUrl)) {
      errors.push("NEXT_PUBLIC_APP_URL must not point to localhost in production.");
    }
  }

  if (!githubConfigured && !casdoorConfigured) {
    errors.push("Configure at least one login provider: GitHub OAuth or Casdoor OAuth.");
  }

  if (githubEnabled && missing(env, githubFields).length > 0 && !casdoorConfigured) {
    errors.push(
      `Configure GitHub OAuth (${missing(env, githubFields).join(", ")}) or a complete Casdoor OAuth provider.`,
    );
  }

  const casdoorMissing = missing(env, casdoorFields);
  if (casdoorMissing.length > 0 && casdoorMissing.length < casdoorFields.length) {
    errors.push(`Casdoor OAuth config is incomplete: missing ${casdoorMissing.join(", ")}.`);
  }

  const casdoorEndpoint = value(env, "CASDOOR_ENDPOINT");
  if (casdoorEndpoint && !isHttpUrl(casdoorEndpoint)) {
    errors.push("CASDOOR_ENDPOINT must be an http or https URL.");
  }

  if (!hasInitialAdminForConfiguredProvider(env)) {
    errors.push(
      "Set INITIAL_SUPER_ADMIN_GITHUB_IDS or INITIAL_SUPER_ADMIN_CASDOOR_IDS for a configured login provider.",
    );
  }

  if (uploadDriver !== "local" && uploadDriver !== "s3") {
    errors.push("UPLOAD_STORAGE_DRIVER must be either local or s3.");
  }

  if (uploadDriver === "local") {
    warnings.push("Local uploads require a persistent writable disk; use UPLOAD_STORAGE_DRIVER=s3 on stateless hosts.");
    const publicBase = value(env, "UPLOAD_PUBLIC_BASE_URL");
    if (publicBase && !publicBase.startsWith("/") && !isHttpUrl(publicBase)) {
      errors.push("UPLOAD_PUBLIC_BASE_URL must be a path starting with / or an http/https URL.");
    }
  }

  if (uploadDriver === "s3") {
    const s3Missing = missing(env, s3Fields);
    if (s3Missing.length > 0) {
      errors.push(`S3 upload config is incomplete: missing ${s3Missing.join(", ")}.`);
    }

    const publicBase = value(env, "S3_PUBLIC_BASE_URL");
    if (publicBase && !isHttpUrl(publicBase)) {
      errors.push("S3_PUBLIC_BASE_URL must be an http or https URL.");
    }

    const endpoint = value(env, "S3_ENDPOINT");
    if (endpoint && !isHttpUrl(endpoint)) {
      errors.push("S3_ENDPOINT must be an http or https URL when provided.");
    }
  }

  const forcePathStyle = value(env, "S3_FORCE_PATH_STYLE");
  if (forcePathStyle && forcePathStyle !== "true" && forcePathStyle !== "false") {
    errors.push("S3_FORCE_PATH_STYLE must be true or false when provided.");
  }

  return { errors, warnings };
}

export function formatEnvCheck(result: EnvCheckResult) {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push("Environment check failed:");
    result.errors.forEach((error) => lines.push(`- ${error}`));
  } else {
    lines.push("Environment check passed.");
  }

  if (result.warnings.length > 0) {
    lines.push("Warnings:");
    result.warnings.forEach((warning) => lines.push(`- ${warning}`));
  }

  return lines.join("\n");
}

async function main() {
  loadEnvConfig(process.cwd());
  const result = checkProductionEnv();
  const output = formatEnvCheck(result);

  if (result.errors.length > 0) {
    console.error(output);
    process.exit(1);
  }

  console.log(output);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
