import assert from "node:assert/strict";
import test from "node:test";
import { absoluteUrl, siteOrigin } from "../app/lib/site-url";

test("siteOrigin normalizes NEXT_PUBLIC_APP_URL to an origin", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://vibepku.example/path";

  try {
    assert.equal(siteOrigin(), "https://vibepku.example");
    assert.equal(absoluteUrl("/products/demo"), "https://vibepku.example/products/demo");
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  }
});

test("siteOrigin falls back to the local dev server URL for invalid app URLs", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "not a url";

  try {
    assert.equal(siteOrigin(), "http://localhost:3001");
    assert.equal(absoluteUrl("/"), "http://localhost:3001/");
  } finally {
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  }
});
