import { redirect } from "next/navigation";
import { createSession } from "@/app/lib/session";
import { upsertGitHubUser } from "@/app/lib/users";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const user = await upsertGitHubUser({
    githubId: "dev-user-1",
    username: "dev-admin",
    name: "Dev Admin",
    avatarUrl: "https://github.com/github.png",
  });

  await createSession(user.id);
  redirect("/submit");
}
