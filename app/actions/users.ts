"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/db";
import { requireSuperAdmin } from "@/app/lib/session";

export async function promoteToAdmin(userId: string) {
  await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("用户不存在。");
  if (target.role === "SUPER_ADMIN") throw new Error("不能修改超管角色。");
  if (target.role === "ADMIN") throw new Error("该用户已是管理员。");

  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });

  revalidatePath("/admin");
}

export async function demoteFromAdmin(userId: string) {
  await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("用户不存在。");
  if (target.role === "SUPER_ADMIN") throw new Error("不能降级超管。");
  if (target.role !== "ADMIN") throw new Error("该用户不是管理员。");

  await prisma.user.update({
    where: { id: userId },
    data: { role: "USER" },
  });

  revalidatePath("/admin");
}

export async function banUser(userId: string, reason: string) {
  await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("用户不存在。");
  if (target.role === "SUPER_ADMIN") throw new Error("不能封禁超管。");

  await prisma.user.update({
    where: { id: userId },
    data: {
      bannedAt: new Date(),
      banReason: reason || "未注明",
    },
  });

  revalidatePath("/admin");
}

export async function unbanUser(userId: string) {
  await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("用户不存在。");

  await prisma.user.update({
    where: { id: userId },
    data: {
      bannedAt: null,
      banReason: null,
    },
  });

  revalidatePath("/admin");
}
