import type { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/db";
import { shouldGrantInitialSuperAdmin } from "@/app/lib/user-roles";

type UpsertGitHubUserInput = {
  githubId: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
};

type UpsertCasdoorUserInput = {
  casdoorId: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export async function upsertCasdoorUser(input: UpsertCasdoorUserInput) {
  const casdoorId = input.casdoorId.trim();
  if (!casdoorId) {
    throw new Error("Casdoor user id missing");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.user.findUnique({
      where: { casdoorId },
    });
    const superAdminCount = await tx.user.count({ where: { role: "SUPER_ADMIN" } });
    const grantSuperAdmin = shouldGrantInitialSuperAdmin({
      provider: "casdoor",
      providerId: casdoorId,
      superAdminCount,
    });

    if (existing) {
      return tx.user.update({
        where: { id: existing.id },
        data: {
          username: input.username,
          name: input.name,
          avatarUrl: input.avatarUrl,
          ...(grantSuperAdmin ? { role: "SUPER_ADMIN" } : {}),
        },
      });
    }

    return tx.user.create({
      data: {
        casdoorId,
        username: input.username,
        name: input.name,
        avatarUrl: input.avatarUrl,
        role: grantSuperAdmin ? "SUPER_ADMIN" : "USER",
      },
    });
  });
}

export async function upsertGitHubUser(input: UpsertGitHubUserInput) {
  const githubId = input.githubId.trim();
  if (!githubId) {
    throw new Error("GitHub user id missing");
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.user.findUnique({
      where: { githubId },
    });
    const superAdminCount = await tx.user.count({ where: { role: "SUPER_ADMIN" } });
    const grantSuperAdmin = shouldGrantInitialSuperAdmin({
      provider: "github",
      providerId: githubId,
      superAdminCount,
    });

    if (existing) {
      return tx.user.update({
        where: { id: existing.id },
        data: {
          username: input.username,
          name: input.name,
          avatarUrl: input.avatarUrl,
          ...(grantSuperAdmin ? { role: "SUPER_ADMIN" } : {}),
        },
      });
    }

    return tx.user.create({
      data: {
        githubId,
        username: input.username,
        name: input.name,
        avatarUrl: input.avatarUrl,
        role: grantSuperAdmin ? "SUPER_ADMIN" : "USER",
      },
    });
  });
}
