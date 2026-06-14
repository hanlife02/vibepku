import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashToken } from "@/app/lib/crypto";
import { createSession } from "@/app/lib/session";
import { exchangeCasdoorCode, fetchCasdoorUser } from "@/app/lib/casdoor";
import { upsertCasdoorUser } from "@/app/lib/users";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("casdoor_oauth_state")?.value;
  cookieStore.delete("casdoor_oauth_state");

  if (!code || !state || !expectedState || hashToken(state) !== expectedState) {
    redirect("/login?error=oauth_state");
  }

  try {
    const accessToken = await exchangeCasdoorCode(code);
    const casdoorUser = await fetchCasdoorUser(accessToken);
    const user = await upsertCasdoorUser({
      casdoorId: casdoorUser.sub ?? "",
      username:
        casdoorUser.preferred_username ?? casdoorUser.name ?? "unknown",
      name: casdoorUser.name,
      avatarUrl: casdoorUser.picture,
    });

    await createSession(user.id);
  } catch (e) {
    console.error("[casdoor-callback]", e);
    redirect("/login?error=casdoor");
  }

  redirect("/submit");
}
