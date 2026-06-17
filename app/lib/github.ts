import { siteOrigin } from "@/app/lib/site-url";

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GitHubUserResponse = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
};

export function hasGitHubOAuthConfig() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function getGitHubAuthorizeUrl(state: string) {
  const appUrl = siteOrigin();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", `${appUrl}/auth/github/callback`);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeGitHubCode(code: string) {
  const appUrl = siteOrigin();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${appUrl}/auth/github/callback`,
    }),
  });

  if (!response.ok) {
    throw new Error("GitHub token exchange failed");
  }

  const tokenResponse = (await response.json()) as GitHubTokenResponse;
  if (!tokenResponse.access_token) {
    throw new Error(tokenResponse.error_description ?? "GitHub access token missing");
  }

  return tokenResponse.access_token;
}

export async function fetchGitHubUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error("GitHub user fetch failed");
  }

  return (await response.json()) as GitHubUserResponse;
}
