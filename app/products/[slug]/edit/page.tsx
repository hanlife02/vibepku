import { notFound, redirect } from "next/navigation";
import { updateProductDraft } from "@/app/actions/products";
import { ProductForm } from "@/app/components/product-form";
import { prisma } from "@/app/lib/db";
import { displayStatus, productWithDrafts } from "@/app/lib/products";
import { canAccessAdmin, getCurrentUser, isBanned } from "@/app/lib/session";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productWithDrafts.include,
  });

  if (!product) notFound();
  if (isBanned(user)) redirect("/dashboard");
  if (product.submitterId !== user.id && !canAccessAdmin(user)) redirect("/dashboard");

  const draft = product.pendingDraft ?? product.published;
  const action = updateProductDraft.bind(null, product.id);

  return (
    <div>
      <div className="page-header">
        <p className="eyebrow">Edit</p>
        <h1>编辑作品</h1>
        <p className="desc">修改后会重新进入审核。公开页面会继续展示上一版已审核内容，直到管理员批准这次修改。</p>
      </div>

      <div className="shell" style={{ maxWidth: 720, paddingBottom: 80 }}>
        <div className="card">
          <div className="card-body">
            <ProductForm action={action} buttonLabel="保存并提交审核" draft={draft} />
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span className={`status-pill ${product.status === 'APPROVED' ? 'approved' : product.status === 'REJECTED' ? 'rejected' : 'pending'}`}>
                  {displayStatus(product.status)}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                保存后会生成新的待审核草稿。公开页面会继续显示上一版已审核内容，直到管理员批准这次修改。
              </p>
              {product.adminNote && (
                <p style={{ fontSize: 13, color: 'var(--t2)', marginTop: 12 }}>
                  管理员备注：<strong style={{ color: 'var(--t1)' }}>{product.adminNote}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
