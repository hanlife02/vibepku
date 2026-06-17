import assert from "node:assert/strict";
import test from "node:test";
import { getCasdoorAuthorizeUrl } from "../app/lib/casdoor";
import { getGitHubAuthorizeUrl } from "../app/lib/github";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test("OAuth authorize URLs use NEXT_PUBLIC_APP_URL origin", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousGitHubClientId = process.env.GITHUB_CLIENT_ID;
  const previousCasdoorEndpoint = process.env.CASDOOR_ENDPOINT;
  const previousCasdoorClientId = process.env.CASDOOR_CLIENT_ID;

  process.env.NEXT_PUBLIC_APP_URL = "https://vibepku.example/base";
  process.env.GITHUB_CLIENT_ID = "github-client";
  process.env.CASDOOR_ENDPOINT = "https://casdoor.example";
  process.env.CASDOOR_CLIENT_ID = "casdoor-client";

  try {
    const githubUrl = new URL(getGitHubAuthorizeUrl("state-1"));
    assert.equal(
      githubUrl.searchParams.get("redirect_uri"),
      "https://vibepku.example/auth/github/callback",
    );

    const casdoorUrl = new URL(getCasdoorAuthorizeUrl("state-2"));
    assert.equal(
      casdoorUrl.searchParams.get("redirect_uri"),
      "https://vibepku.example/auth/casdoor/callback",
    );
  } finally {
    restoreEnv("NEXT_PUBLIC_APP_URL", previousAppUrl);
    restoreEnv("GITHUB_CLIENT_ID", previousGitHubClientId);
    restoreEnv("CASDOOR_ENDPOINT", previousCasdoorEndpoint);
    restoreEnv("CASDOOR_CLIENT_ID", previousCasdoorClientId);
  }
});

test("OAuth authorize URLs fall back to the local dev server URL", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousGitHubClientId = process.env.GITHUB_CLIENT_ID;
  const previousCasdoorEndpoint = process.env.CASDOOR_ENDPOINT;
  const previousCasdoorClientId = process.env.CASDOOR_CLIENT_ID;

  delete process.env.NEXT_PUBLIC_APP_URL;
  process.env.GITHUB_CLIENT_ID = "github-client";
  process.env.CASDOOR_ENDPOINT = "https://casdoor.example";
  process.env.CASDOOR_CLIENT_ID = "casdoor-client";

  try {
    const githubUrl = new URL(getGitHubAuthorizeUrl("state-1"));
    assert.equal(
      githubUrl.searchParams.get("redirect_uri"),
      "http://localhost:3001/auth/github/callback",
    );

    const casdoorUrl = new URL(getCasdoorAuthorizeUrl("state-2"));
    assert.equal(
      casdoorUrl.searchParams.get("redirect_uri"),
      "http://localhost:3001/auth/casdoor/callback",
    );
  } finally {
    restoreEnv("NEXT_PUBLIC_APP_URL", previousAppUrl);
    restoreEnv("GITHUB_CLIENT_ID", previousGitHubClientId);
    restoreEnv("CASDOOR_ENDPOINT", previousCasdoorEndpoint);
    restoreEnv("CASDOOR_CLIENT_ID", previousCasdoorClientId);
  }
});

test("Casdoor authorize URL trims trailing endpoint slashes", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previousCasdoorEndpoint = process.env.CASDOOR_ENDPOINT;
  const previousCasdoorClientId = process.env.CASDOOR_CLIENT_ID;

  process.env.NEXT_PUBLIC_APP_URL = "https://vibepku.example";
  process.env.CASDOOR_ENDPOINT = "https://casdoor.example/";
  process.env.CASDOOR_CLIENT_ID = "casdoor-client";

  try {
    const casdoorUrl = new URL(getCasdoorAuthorizeUrl("state-3"));
    assert.equal(casdoorUrl.origin, "https://casdoor.example");
    assert.equal(casdoorUrl.pathname, "/login/oauth/authorize");
  } finally {
    restoreEnv("NEXT_PUBLIC_APP_URL", previousAppUrl);
    restoreEnv("CASDOOR_ENDPOINT", previousCasdoorEndpoint);
    restoreEnv("CASDOOR_CLIENT_ID", previousCasdoorClientId);
  }
});
