import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createToken, hashToken } from "@/app/lib/crypto";
import {
  getCasdoorAuthorizeUrl,
  hasCasdoorOAuthConfig,
} from "@/app/lib/casdoor";

export async function GET() {
  if (!hasCasdoorOAuthConfig()) {
    redirect("/login?missing=casdoor");
  }

  const state = createToken();
  const cookieStore = await cookies();
  cookieStore.set("casdoor_oauth_state", hashToken(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  redirect(getCasdoorAuthorizeUrl(state));
}
