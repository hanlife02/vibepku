import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isSameOriginRequest } from "@/app/lib/request-origin";
import { destroySession } from "@/app/lib/session";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "请求来源无效" }, { status: 403 });
  }

  await destroySession();
  redirect("/");
}
