import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createToken, hashToken } from "@/app/lib/crypto";
import { getGitHubAuthorizeUrl, hasGitHubOAuthConfig } from "@/app/lib/github";

export async function GET() {
  if (process.env.GITHUB_LOGIN_ENABLED === "false") {
    redirect("/login");
  }

  if (!hasGitHubOAuthConfig()) {
    redirect("/login?missing=github");
  }

  const state = createToken();
  const cookieStore = await cookies();
  cookieStore.set("github_oauth_state", hashToken(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  redirect(getGitHubAuthorizeUrl(state));
}
