import { siteOrigin } from "@/app/lib/site-url";

type CasdoorTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type CasdoorUserResponse = {
  sub?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  picture?: string;
};

export type CasdoorUserProfile = {
  casdoorId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

function clean(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function casdoorEndpoint() {
  return (process.env.CASDOOR_ENDPOINT ?? "").replace(/\/+$/g, "");
}

export function normalizeCasdoorUser(
  user: CasdoorUserResponse,
): CasdoorUserProfile {
  const casdoorId = clean(user.sub);
  if (!casdoorId) {
    throw new Error("Casdoor user id missing");
  }

  return {
    casdoorId,
    username:
      clean(user.preferred_username) ??
      clean(user.name) ??
      clean(user.email) ??
      `casdoor-${casdoorId.slice(0, 8)}`,
    name: clean(user.name),
    avatarUrl: clean(user.picture),
  };
}

export function hasCasdoorOAuthConfig() {
  return Boolean(
    process.env.CASDOOR_ENDPOINT &&
      process.env.CASDOOR_CLIENT_ID &&
      process.env.CASDOOR_CLIENT_SECRET
  );
}

export function getCasdoorAuthorizeUrl(state: string) {
  const endpoint = casdoorEndpoint();
  const clientId = process.env.CASDOOR_CLIENT_ID ?? "";
  const appUrl = siteOrigin();
  const url = new URL(`${endpoint}/login/oauth/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${appUrl}/auth/casdoor/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCasdoorCode(code: string) {
  const endpoint = casdoorEndpoint();
  const appUrl = siteOrigin();
  const response = await fetch(`${endpoint}/api/login/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.CASDOOR_CLIENT_ID ?? "",
      client_secret: process.env.CASDOOR_CLIENT_SECRET ?? "",
      code,
      redirect_uri: `${appUrl}/auth/casdoor/callback`,
    }),
  });

  if (!response.ok) {
    throw new Error("Casdoor token exchange failed");
  }

  const tokenResponse = (await response.json()) as CasdoorTokenResponse;
  if (!tokenResponse.access_token) {
    throw new Error(
      tokenResponse.error_description ?? "Casdoor access token missing"
    );
  }

  return tokenResponse.access_token;
}

export async function fetchCasdoorUser(accessToken: string) {
  const endpoint = casdoorEndpoint();
  const response = await fetch(
    `${endpoint}/api/userinfo?accessToken=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Casdoor user fetch failed");
  }

  return (await response.json()) as CasdoorUserResponse;
}
