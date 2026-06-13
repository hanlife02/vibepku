import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashToken } from "@/app/lib/crypto";
import { createSession } from "@/app/lib/session";
import { exchangeGitHubCode, fetchGitHubUser } from "@/app/lib/github";
import { upsertGitHubUser } from "@/app/lib/users";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("github_oauth_state")?.value;
  cookieStore.delete("github_oauth_state");

  if (!code || !state || !expectedState || hashToken(state) !== expectedState) {
    redirect("/login?error=oauth_state");
  }

  try {
    const accessToken = await exchangeGitHubCode(code);
    const githubUser = await fetchGitHubUser(accessToken);
    const user = await upsertGitHubUser({
      githubId: String(githubUser.id),
      username: githubUser.login,
      name: githubUser.name,
      avatarUrl: githubUser.avatar_url,
    });

    await createSession(user.id);
  } catch {
    redirect("/login?error=github");
  }

  redirect("/submit");
}
