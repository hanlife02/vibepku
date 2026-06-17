import assert from "node:assert/strict";
import test from "node:test";
import { runSmokeCheck, smokeBaseUrl } from "../scripts/smoke";

function response(body: string, init?: ResponseInit) {
  return new Response(body, init);
}

function responseWithSecurityHeaders(body: string, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("x-frame-options", "DENY");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");

  return response(body, { ...init, headers });
}

test("smokeBaseUrl reads CLI args and normalizes to origin", () => {
  assert.equal(
    smokeBaseUrl(["https://vibepku.example/path"], {}),
    "https://vibepku.example",
  );
  assert.equal(
    smokeBaseUrl([], { SMOKE_BASE_URL: "http://localhost:3001/products" }),
    "http://localhost:3001",
  );
});

test("smokeBaseUrl rejects missing and invalid URLs", () => {
  assert.throws(() => smokeBaseUrl([], {}), /Missing base URL/);
  assert.throws(() => smokeBaseUrl(["notaurl"], {}), /Invalid base URL/);
  assert.throws(() => smokeBaseUrl(["ftp://example.com"], {}), /http or https/);
});

test("runSmokeCheck validates health, robots, and sitemap endpoints", async () => {
  const requested: string[] = [];
  const fetchImpl = async (url: URL) => {
    requested.push(url.pathname);
    if (url.pathname === "/api/health") {
      return responseWithSecurityHeaders(JSON.stringify({ status: "ok", database: "ok" }));
    }
    if (url.pathname === "/robots.txt") {
      return response("User-agent: *\nDisallow: /admin\nSitemap: https://example.com/sitemap.xml");
    }
    if (url.pathname === "/sitemap.xml") {
      return response("<urlset><url><loc>https://example.com/</loc></url></urlset>");
    }
    return response("not found", { status: 404 });
  };

  const logs: string[] = [];
  await runSmokeCheck("https://example.com", fetchImpl, (line) => {
    logs.push(line);
  });

  assert.deepEqual(requested, ["/api/health", "/robots.txt", "/sitemap.xml"]);
  assert.equal(logs.length, 3);
});

test("runSmokeCheck fails when an endpoint is unhealthy", async () => {
  const fetchImpl = async (url: URL) => {
    if (url.pathname === "/api/health") {
      return responseWithSecurityHeaders(JSON.stringify({ status: "error", database: "error" }));
    }
    return response("");
  };

  await assert.rejects(
    () => runSmokeCheck("https://example.com", fetchImpl, () => {}),
    /health response did not report ok status/,
  );
});

test("runSmokeCheck fails when security headers are missing", async () => {
  const fetchImpl = async (url: URL) => {
    if (url.pathname === "/api/health") {
      return response(JSON.stringify({ status: "ok", database: "ok" }));
    }
    return response("");
  };

  await assert.rejects(
    () => runSmokeCheck("https://example.com", fetchImpl, () => {}),
    /security header/,
  );
});
