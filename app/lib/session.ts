import { cookies } from "next/headers";
import { prisma } from "@/app/lib/db";
import { createToken, hashToken } from "@/app/lib/crypto";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "vibepku_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }
  return user;
}

export function isBanned(user: Pick<User, "bannedAt">) {
  return !!user.bannedAt;
}

export function canAccessAdmin(user: Pick<User, "role" | "bannedAt">) {
  return !isBanned(user) && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
}

export function canAccessSuperAdmin(user: Pick<User, "role" | "bannedAt">) {
  return !isBanned(user) && user.role === "SUPER_ADMIN";
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!canAccessAdmin(user)) {
    throw new Error(isBanned(user) ? "USER_BANNED" : "ADMIN_REQUIRED");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (!canAccessSuperAdmin(user)) {
    throw new Error(isBanned(user) ? "USER_BANNED" : "SUPER_ADMIN_REQUIRED");
  }
  return user;
}
