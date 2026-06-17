const DEFAULT_APP_URL = "http://localhost:3001";

export function siteOrigin() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

  try {
    return new URL(appUrl).origin;
  } catch {
    return DEFAULT_APP_URL;
  }
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteOrigin()).toString();
}
