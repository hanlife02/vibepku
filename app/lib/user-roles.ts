type Env = Record<string, string | undefined>;

export type AuthProvider = "github" | "casdoor";

function splitIds(value: string | undefined) {
  return (value ?? "")
    .split(/[\s,]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function initialSuperAdminIds(provider: AuthProvider, env: Env = process.env) {
  if (provider === "github") {
    return [
      ...splitIds(env.INITIAL_SUPER_ADMIN_GITHUB_IDS),
      ...splitIds(env.INITIAL_SUPER_ADMIN_GITHUB_ID),
    ];
  }

  return [
    ...splitIds(env.INITIAL_SUPER_ADMIN_CASDOOR_IDS),
    ...splitIds(env.INITIAL_SUPER_ADMIN_CASDOOR_ID),
  ];
}

export function shouldGrantInitialSuperAdmin(
  {
    provider,
    providerId,
    superAdminCount,
    nodeEnv = process.env.NODE_ENV,
  }: {
    provider: AuthProvider;
    providerId: string;
    superAdminCount: number;
    nodeEnv?: string;
  },
  env: Env = process.env,
) {
  if (superAdminCount > 0) return false;

  const cleanProviderId = providerId.trim();
  if (!cleanProviderId) return false;

  const configuredIds = initialSuperAdminIds(provider, env);
  if (configuredIds.length > 0) {
    return configuredIds.includes(cleanProviderId);
  }

  return nodeEnv !== "production";
}
