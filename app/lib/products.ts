import { Prisma } from "@prisma/client";
import {
  AI_TOOLS,
  CATEGORIES,
  createSlug,
  displayCategory,
  displayStatus,
  fromStoredList,
  splitList,
  toStoredList,
  type ProductFormValues,
} from "@/app/lib/product-shared";

export {
  CATEGORIES,
  AI_TOOLS,
  createSlug,
  displayCategory,
  displayStatus,
  fromStoredList,
  splitList,
  toStoredList,
};
export type { ProductFormState, ProductFormValues } from "@/app/lib/product-shared";

export const productWithDrafts = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    published: true,
    pendingDraft: true,
    submitter: true,
  },
});

export type ProductWithDrafts = Prisma.ProductGetPayload<typeof productWithDrafts>;

export const publishedProductWhere = {
  publishedId: { not: null },
} satisfies Prisma.ProductWhereInput;

export const pendingReviewProductWhere = {
  pendingDraftId: { not: null },
  status: { not: "REJECTED" },
} satisfies Prisma.ProductWhereInput;

export function statusAfterDraftSubmission(product: Pick<ProductWithDrafts, "publishedId">) {
  return product.publishedId ? "APPROVED" : "PENDING_REVIEW";
}

export function slugCandidate(base: string, attempt: number) {
  return attempt === 0 ? base : `${base}-${attempt + 1}`;
}

export function isUniqueConstraintOn(error: unknown, field: string) {
  if (!error || typeof error !== "object") return false;

  const prismaError = error as {
    code?: unknown;
    meta?: { target?: unknown };
  };
  if (prismaError.code !== "P2002") return false;

  const target = prismaError.meta?.target;
  if (typeof target === "string") return target === field || target.includes(field);
  return Array.isArray(target) && target.includes(field);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readChecked(formData: FormData, key: string) {
  return Array.from(new Set(formData
    .getAll(key)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)));
}

function assertUrl(value: string, field: string) {
  const localUploadBaseUrl = (process.env.UPLOAD_PUBLIC_BASE_URL ?? "/uploads").replace(/\/+$/g, "");
  if (localUploadBaseUrl.startsWith("/") && value.startsWith(`${localUploadBaseUrl}/`)) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return `${field} 必须是 http 或 https 链接。`;
    }
  } catch {
    return `${field} 不是有效链接。`;
  }

  return null;
}

export function parseProductForm(formData: FormData): ProductFormValues | string {
  const name = readString(formData, "name");
  const tagline = readString(formData, "tagline");
  const websiteUrl = readString(formData, "websiteUrl");
  const logoUrl = readString(formData, "logoUrl");
  const imageUrls = splitList(readString(formData, "imageUrls")).slice(0, 5);
  const demoVideoUrl = readString(formData, "demoVideoUrl") || null;
  const category = readString(formData, "category");
  const tags = splitList(readString(formData, "tags")).slice(0, 12);
  const tools = readChecked(formData, "tools").slice(0, 8);
  const buildStory = readString(formData, "buildStory");

  if (!name || name.length > 80) {
    return "请填写作品名称，且不要超过 80 个字符。";
  }

  if (!tagline || tagline.length > 160) {
    return "请填写一句话简介，且不要超过 160 个字符。";
  }

  const websiteError = assertUrl(websiteUrl, "作品网址");
  if (websiteError) return websiteError;

  const logoError = assertUrl(logoUrl, "Logo 链接");
  if (logoError) return logoError;

  if (imageUrls.length === 0) {
    return "请至少添加一张截图或作品图片链接。";
  }

  for (const imageUrl of imageUrls) {
    const imageError = assertUrl(imageUrl, "图片链接");
    if (imageError) return imageError;
  }

  if (demoVideoUrl) {
    const demoError = assertUrl(demoVideoUrl, "演示视频链接");
    if (demoError) return demoError;
  }

  if (!category || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return "请选择作品分类。";
  }

  if (tools.some((tool) => !AI_TOOLS.includes(tool as (typeof AI_TOOLS)[number]))) {
    return "请选择有效的 AI coding 工具。";
  }

  if (buildStory.length > 1000) {
    return "构建故事不要超过 1000 个字符。";
  }

  return {
    name,
    tagline,
    websiteUrl,
    logoUrl,
    imageUrls,
    demoVideoUrl,
    category,
    tags,
    tools,
    buildStory,
  };
}

export function draftData(values: ProductFormValues) {
  return {
    name: values.name,
    tagline: values.tagline,
    websiteUrl: values.websiteUrl,
    logoUrl: values.logoUrl,
    imageUrls: toStoredList(values.imageUrls),
    demoVideoUrl: values.demoVideoUrl,
    category: values.category,
    tags: toStoredList(values.tags),
    tools: toStoredList(values.tools),
    buildStory: values.buildStory,
  };
}

export function visibleDraft(product: ProductWithDrafts) {
  return product.status === "APPROVED" ? product.published : product.pendingDraft;
}
