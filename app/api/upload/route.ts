import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest } from "@/app/lib/request-origin";
import { getCurrentUser, isBanned } from "@/app/lib/session";
import {
  detectImageType,
  isUploadContentLengthTooLarge,
  maxUploadSize,
  saveUploadedImage,
} from "@/app/lib/upload-storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "请求来源无效" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  if (isBanned(user)) {
    return NextResponse.json({ error: "账号已被封禁，无法上传图片" }, { status: 403 });
  }

  if (isUploadContentLengthTooLarge(request.headers.get("content-length"))) {
    return NextResponse.json({ error: "请选择有效图片，文件大小不能超过 5MB" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  if (file.size === 0 || file.size > maxUploadSize()) {
    return NextResponse.json({ error: "请选择有效图片，文件大小不能超过 5MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageType = detectImageType(buffer);
  if (!imageType) {
    return NextResponse.json({ error: "只支持 PNG、JPG、GIF、WebP 格式" }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage(buffer, imageType);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "上传服务暂时不可用" }, { status: 500 });
  }
}
