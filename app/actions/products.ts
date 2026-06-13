"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { isBanned, requireAdmin, requireUser } from "@/app/lib/session";
import {
  createSlug,
  draftData,
  parseProductForm,
  type ProductFormState,
} from "@/app/lib/products";

async function uniqueSlug(name: string) {
  const base = createSlug(name);
  let slug = base;
  let index = 2;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

export async function submitProduct(
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requireUser();
  if (isBanned(user)) {
    return { error: "你的账号已被封禁，无法提交作品。" };
  }
  const parsed = parseProductForm(formData);

  if (typeof parsed === "string") {
    return { error: parsed };
  }

  const product = await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: {
        slug: await uniqueSlug(parsed.name),
        submitterId: user.id,
        status: "PENDING_REVIEW",
      },
    });

    const draft = await tx.productDraft.create({
      data: {
        productId: createdProduct.id,
        ...draftData(parsed),
      },
    });

    return tx.product.update({
      where: { id: createdProduct.id },
      data: { pendingDraftId: draft.id },
    });
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/dashboard?submitted=${product.id}`);
}

export async function updateProductDraft(
  productId: string,
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requireUser();
  if (isBanned(user)) {
    return { error: "你的账号已被封禁，无法编辑作品。" };
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { submitter: true },
  });

  if (!product || (product.submitterId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return { error: "你不能编辑这个作品。" };
  }

  const parsed = parseProductForm(formData);
  if (typeof parsed === "string") {
    return { error: parsed };
  }

  await prisma.$transaction(async (tx) => {
    const draft = await tx.productDraft.create({
      data: {
        productId,
        ...draftData(parsed),
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        pendingDraftId: draft.id,
        status: "PENDING_REVIEW",
        adminNote: null,
        reviewedAt: null,
      },
    });
  });

  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  redirect("/dashboard?updated=1");
}

export async function approveProduct(productId: string) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { pendingDraft: true },
  });

  if (!product?.pendingDraft) {
    throw new Error("这个作品没有待审核草稿。");
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      status: "APPROVED",
      publishedId: product.pendingDraft.id,
      pendingDraftId: null,
      adminNote: null,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function rejectProduct(productId: string, formData: FormData) {
  await requireAdmin();
  const note = formData.get("adminNote");
  const adminNote = typeof note === "string" ? note.trim() : "";

  if (!adminNote) {
    throw new Error("驳回作品时必须填写管理员备注。");
  }

  const existing = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existing) {
    throw new Error("没有找到这个作品。");
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: existing.publishedId
      ? {
          status: "APPROVED",
          pendingDraftId: null,
          adminNote,
          reviewedAt: new Date(),
        }
      : {
          status: "REJECTED",
          adminNote,
          reviewedAt: new Date(),
        },
  });

  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function toggleFeatured(productId: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("没有找到这个作品。");

  await prisma.product.update({
    where: { id: productId },
    data: { featured: !product.featured },
  });

  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/admin");
}
