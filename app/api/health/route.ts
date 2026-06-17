import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function healthJson(data: Record<string, string | number>, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return healthJson(
      {
        status: "ok",
        database: "ok",
        latencyMs: Date.now() - startedAt,
        timestamp,
      },
      200,
    );
  } catch {
    return healthJson(
      {
        status: "error",
        database: "error",
        latencyMs: Date.now() - startedAt,
        timestamp,
      },
      503,
    );
  }
}
