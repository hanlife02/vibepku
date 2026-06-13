import Link from "next/link";
import { redirect } from "next/navigation";
import { Icons } from "@/app/components/icons";
import { prisma } from "@/app/lib/db";
import { displayStatus, productWithDrafts, visibleDraft } from "@/app/lib/products";
import { getCurrentUser } from "@/app/lib/session";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; updated?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const banned = !!user.bannedAt;
  const params = await searchParams;

  const products = await prisma.product.findMany({
    where: { submitterId: user.id },
    include: productWithDrafts.include,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="page-header" style={{ textAlign: 'left', paddingBottom: 32 }}>
        <div className="shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>我的提交</h1>
            <p className="desc" style={{ margin: 0 }}>查看审核状态，或对已上线作品提交新的修改草稿。</p>
          </div>
          {!banned && (
            <Link className="btn-primary" href="/submit">
              <Icons.Plus size={16} />
              提交作品
            </Link>
          )}
        </div>
      </div>

      <div className="shell" style={{ paddingBottom: 80 }}>
        {params.submitted && (
          <div style={{
            padding: '14px 20px',
            borderRadius: 12,
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.2)',
            color: 'var(--green)',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 24,
          }}>
            已提交，现在等待管理员审核。
          </div>
        )}
        {params.updated && (
          <div style={{
            padding: '14px 20px',
            borderRadius: 12,
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.2)',
            color: 'var(--green)',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 24,
          }}>
            修改已保存，现在等待管理员重新审核。
          </div>
        )}
        {banned && (
          <div style={{
            padding: '14px 20px',
            borderRadius: 12,
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            color: 'var(--red)',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 24,
          }}>
            你的账号已被封禁，无法提交新作品。原因：{user.banReason || "未注明"}
          </div>
        )}

        {products.length ? (
          <div className="row-list">
            {products.map((product) => {
              const draft = visibleDraft(product);
              return (
                <article className="row-item" key={product.id}>
                  <div className="row-logo">
                    {draft ? <img src={draft.logoUrl} alt="" /> : null}
                  </div>
                  <div className="row-content">
                    <h3>{draft?.name ?? "未命名作品"}</h3>
                    <p>{draft?.tagline}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <span className={`status-pill ${product.status === 'APPROVED' ? 'approved' : product.status === 'REJECTED' ? 'rejected' : 'pending'}`}>
                        {displayStatus(product.status)}
                      </span>
                      {product.pendingDraftId && product.publishedId && (
                        <span className="status-pill pending">修改待审核</span>
                      )}
                    </div>
                  </div>
                  <div className="row-actions">
                    {product.publishedId && (
                      <Link href={`/products/${product.slug}`} className="btn-ghost">
                        查看
                      </Link>
                    )}
                    <Link href={`/products/${product.slug}/edit`} className="btn-ghost">
                      <Icons.Pencil size={14} />
                      编辑
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.Plus size={24} />
            </div>
            <h3>还没有提交</h3>
            <p>提交你的第一个作品，它会进入管理员审核队列。</p>
            {!banned && (
              <Link href="/submit" className="btn-primary">
                <Icons.Plus size={16} />
                提交作品
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
