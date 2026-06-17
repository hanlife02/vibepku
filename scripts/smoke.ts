type SmokeCheck = {
  path: string;
  name: string;
  validate: (body: string, response: Response) => void;
};

type SmokeFetch = (url: URL, init?: RequestInit) => Promise<Response>;

const expectedSecurityHeaders = [
  ["x-frame-options", "DENY"],
  ["x-content-type-options", "nosniff"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()"],
] as const;

function assertSecurityHeaders(headers: Headers) {
  for (const [name, expected] of expectedSecurityHeaders) {
    const actual = headers.get(name);
    if (actual !== expected) {
      throw new Error(`missing or invalid security header: ${name}`);
    }
  }
}

const checks: SmokeCheck[] = [
  {
    path: "/api/health",
    name: "health",
    validate: (body, response) => {
      const data = JSON.parse(body) as { status?: string; database?: string };
      if (data.status !== "ok" || data.database !== "ok") {
        throw new Error("health response did not report ok status");
      }
      assertSecurityHeaders(response.headers);
    },
  },
  {
    path: "/robots.txt",
    name: "robots",
    validate: (body) => {
      if (!body.includes("Sitemap:") || !body.includes("Disallow: /admin")) {
        throw new Error("robots.txt is missing expected sitemap or admin rules");
      }
    },
  },
  {
    path: "/sitemap.xml",
    name: "sitemap",
    validate: (body) => {
      if (!body.includes("<urlset") || !body.includes("<loc>")) {
        throw new Error("sitemap.xml is missing expected urlset content");
      }
    },
  },
];

function usage() {
  return [
    "Usage:",
    "  pnpm run smoke -- https://your-domain.example",
    "  SMOKE_BASE_URL=https://your-domain.example pnpm run smoke",
  ].join("\n");
}

export function smokeBaseUrl(
  argv = process.argv.slice(2),
  env: Record<string, string | undefined> = process.env,
) {
  if (argv.includes("--help") || argv.includes("-h")) {
    return null;
  }

  const value = argv.find((arg) => !arg.startsWith("-")) ?? env.SMOKE_BASE_URL ?? env.NEXT_PUBLIC_APP_URL;
  if (!value) {
    throw new Error(`Missing base URL.\n${usage()}`);
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Base URL must use http or https.");
    }
    return url.origin;
  } catch (error) {
    if (error instanceof Error && error.message === "Base URL must use http or https.") {
      throw error;
    }
    throw new Error(`Invalid base URL: ${value}`);
  }
}

export async function runSmokeCheck(
  baseUrl: string,
  fetchImpl: SmokeFetch = fetch,
  log: (line: string) => void = console.log,
) {
  for (const check of checks) {
    const url = new URL(check.path, baseUrl);
    const response = await fetchImpl(url, {
      headers: {
        "User-Agent": "vibepku-smoke/1.0",
      },
    });

    const body = await response.text();
    if (!response.ok) {
      throw new Error(`${check.name} check failed with HTTP ${response.status}`);
    }

    check.validate(body, response);
    log(`ok ${check.name} ${url.toString()}`);
  }
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
    return;
  }

  const baseUrl = smokeBaseUrl();
  if (!baseUrl) return;
  await runSmokeCheck(baseUrl);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
