import assert from "node:assert/strict";
import test from "node:test";
import { isSameOriginRequest } from "../app/lib/request-origin";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test("isSameOriginRequest accepts matching request origins", () => {
  const request = new Request("https://vibepku.example/api/upload", {
    method: "POST",
    headers: {
      origin: "https://vibepku.example",
    },
  });

  assert.equal(isSameOriginRequest(request), true);
});

test("isSameOriginRequest accepts configured app origins", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://www.vibepku.example";

  try {
    const request = new Request("https://preview.vibepku.example/api/upload", {
      method: "POST",
      headers: {
        origin: "https://www.vibepku.example",
      },
    });

    assert.equal(isSameOriginRequest(request), true);
  } finally {
    restoreEnv("NEXT_PUBLIC_APP_URL", previousAppUrl);
  }
});

test("isSameOriginRequest rejects cross-site origins and referers", () => {
  const requestWithOrigin = new Request("https://vibepku.example/api/upload", {
    method: "POST",
    headers: {
      origin: "https://evil.example",
    },
  });
  assert.equal(isSameOriginRequest(requestWithOrigin), false);

  const requestWithReferer = new Request("https://vibepku.example/api/upload", {
    method: "POST",
    headers: {
      referer: "https://evil.example/form",
    },
  });
  assert.equal(isSameOriginRequest(requestWithReferer), false);
});

test("isSameOriginRequest allows requests without browser origin headers", () => {
  const request = new Request("https://vibepku.example/api/upload", {
    method: "POST",
  });

  assert.equal(isSameOriginRequest(request), true);
});
