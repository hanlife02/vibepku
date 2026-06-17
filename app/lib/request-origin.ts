import { siteOrigin } from "@/app/lib/site-url";

function headerOrigin(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = new Set([requestOrigin, siteOrigin()]);
  const origin = headerOrigin(request.headers.get("origin"));

  if (origin) {
    return allowedOrigins.has(origin);
  }

  const referer = headerOrigin(request.headers.get("referer"));
  if (referer) {
    return allowedOrigins.has(referer);
  }

  return true;
}
