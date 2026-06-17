import assert from "node:assert/strict";
import test from "node:test";
import { exchangeCasdoorCode, normalizeCasdoorUser } from "../app/lib/casdoor";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test("normalizeCasdoorUser keeps stable identity fields", () => {
  assert.deepEqual(
    normalizeCasdoorUser({
      sub: " user-123 ",
      preferred_username: " alice ",
      name: " Alice ",
      picture: " https://example.com/avatar.png ",
    }),
    {
      casdoorId: "user-123",
      username: "alice",
      name: "Alice",
      avatarUrl: "https://example.com/avatar.png",
    },
  );
});

test("normalizeCasdoorUser falls back to a stable username", () => {
  assert.deepEqual(
    normalizeCasdoorUser({
      sub: "abcdef123456",
    }),
    {
      casdoorId: "abcdef123456",
      username: "casdoor-abcdef12",
      name: null,
      avatarUrl: null,
    },
  );
});

test("normalizeCasdoorUser rejects missing provider ids", () => {
  assert.throws(
    () => normalizeCasdoorUser({ name: "No Subject" }),
    /Casdoor user id missing/,
  );
  assert.throws(
    () => normalizeCasdoorUser({ sub: "   " }),
    /Casdoor user id missing/,
  );
});

test("exchangeCasdoorCode sends normalized token URL and redirect URI", async () => {
  const previousFetch = globalThis.fetch;
  const previousEndpoint = process.env.CASDOOR_ENDPOINT;
  const previousClientId = process.env.CASDOOR_CLIENT_ID;
  const previousClientSecret = process.env.CASDOOR_CLIENT_SECRET;
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  process.env.CASDOOR_ENDPOINT = "https://casdoor.example/";
  process.env.CASDOOR_CLIENT_ID = "casdoor-client";
  process.env.CASDOOR_CLIENT_SECRET = "casdoor-secret";
  process.env.NEXT_PUBLIC_APP_URL = "https://vibepku.example/base";

  globalThis.fetch = (async (input, init) => {
    assert.equal(input, "https://casdoor.example/api/login/oauth/access_token");
    assert.equal(init?.method, "POST");
    assert.ok(init?.body instanceof URLSearchParams);
    assert.equal(init.body.get("client_id"), "casdoor-client");
    assert.equal(init.body.get("client_secret"), "casdoor-secret");
    assert.equal(init.body.get("code"), "oauth-code");
    assert.equal(
      init.body.get("redirect_uri"),
      "https://vibepku.example/auth/casdoor/callback",
    );

    return new Response(JSON.stringify({ access_token: "access-token" }));
  }) as typeof fetch;

  try {
    assert.equal(await exchangeCasdoorCode("oauth-code"), "access-token");
  } finally {
    globalThis.fetch = previousFetch;
    restoreEnv("CASDOOR_ENDPOINT", previousEndpoint);
    restoreEnv("CASDOOR_CLIENT_ID", previousClientId);
    restoreEnv("CASDOOR_CLIENT_SECRET", previousClientSecret);
    restoreEnv("NEXT_PUBLIC_APP_URL", previousAppUrl);
  }
});
