import { prisma } from "@/app/lib/db";

type UpsertGitHubUserInput = {
  githubId: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export async function upsertGitHubUser(input: UpsertGitHubUserInput) {
  return prisma.$transaction(async (tx: any) => {
    const existing = await tx.user.findUnique({
      where: { githubId: input.githubId },
    });

    if (existing) {
      return tx.user.update({
        where: { id: existing.id },
        data: {
          username: input.username,
          name: input.name,
          avatarUrl: input.avatarUrl,
        },
      });
    }

    const userCount = await tx.user.count();

    return tx.user.create({
      data: {
        githubId: input.githubId,
        username: input.username,
        name: input.name,
        avatarUrl: input.avatarUrl,
        role: userCount === 0 ? "SUPER_ADMIN" : "USER",
      },
    });
  });
}
