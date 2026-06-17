import Link from "next/link";
import { redirect } from "next/navigation";
import { approveProduct, rejectProduct, toggleFeatured } from "@/app/actions/products";
import { promoteToAdmin, demoteFromAdmin, banUser, unbanUser } from "@/app/actions/users";
import { Icons } from "@/app/components/icons";
import { prisma } from "@/app/lib/db";
import {
  displayStatus,
  pendingReviewProductWhere,
  publishedProductWhere,
  productWithDrafts,
} from "@/app/lib/products";
import { canAccessAdmin, getCurrentUser } from "@/app/lib/session";

function StatusPill({ status }: { status: string }) {
  const className =
    status === "APPROVED" ? "status-pill approved" :
    status === "REJECTED" ? "status-pill rejected" :
    "status-pill pending";

  return <span className={className}>{displayStatus(status)}</span>;
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessAdmin(user)) redirect("/dashboard");
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const [pendingProducts, approvedProducts, rejectedProducts, allUsers] = await Promise.all([
    prisma.product.findMany({
      where: pendingReviewProductWhere,
      include: productWithDrafts.include,
      orderBy: { updatedAt: "asc" },
    }),
    prisma.product.findMany({
      where: publishedProductWhere,
      include: productWithDrafts.include,
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.product.findMany({
      where: { status: "REJECTED" },
      include: productWithDrafts.include,
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    isSuperAdmin
      ? prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { submissions: true } } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <div className="page-header">
        <p className="eyebrow">Admin</p>
        <h1>管理后台</h1>
        <p className="desc">审核新提交、处理已上线作品的修改草稿，并维护精选展示。</p>
      </div>

      <div className="shell" style={{ paddingBottom: 80 }}>
        {/* 统计卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 48,
        }}>
          {[
            { label: '待审核', value: pendingProducts.length, color: 'var(--amber)' },
            { label: '已上线', value: approvedProducts.length, color: 'var(--green)' },
            { label: '已驳回', value: rejectedProducts.length, color: 'var(--red)' },
            { label: '精选', value: approvedProducts.filter(p => p.featured).length, color: 'var(--accent)' },
          ].map((stat) => (
            <div key={stat.label} className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 32,
                  fontWeight: 700,
                  color: stat.color,
                  letterSpacing: -2,
                }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 待审核 */}
        <section style={{ marginBottom: 48 }}>
          <div className="section-header">
            <span className="dot" />
            <h2>待审核</h2>
            <span className="line" />
            <span className="count">{pendingProducts.length}</span>
          </div>

          {pendingProducts.length ? (
            <div className="row-list">
              {pendingProducts.map((product) => {
                const draft = product.pendingDraft;
                if (!draft) return null;

                return (
                  <article className="row-item" key={product.id}>
                    <div className="row-logo">
                      <img src={draft.logoUrl} alt="" />
                    </div>
                    <div className="row-content">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <StatusPill status={product.status} />
                        {product.publishedId && (
                          <span className="status-pill pending">修改待审</span>
                        )}
                      </div>
                      <h3>{draft.name}</h3>
                      <p>{draft.tagline} · @{product.submitter.username}</p>
                    </div>
                    <div className="row-actions">
                      <a href={draft.websiteUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                        <Icons.ExternalLink size={14} />
                        访问
                      </a>
                      <form action={approveProduct.bind(null, product.id)}>
                        <button className="btn-primary" type="submit" style={{ padding: '8px 16px', fontSize: 12 }}>
                          <Icons.Check size={14} />
                          批准
                        </button>
                      </form>
                      <form action={rejectProduct.bind(null, product.id)}>
                        <input
                          className="input"
                          name="adminNote"
                          placeholder="驳回原因"
                          required
                          style={{ minWidth: 160, padding: '8px 10px', fontSize: 12 }}
                        />
                        <button className="btn-danger" type="submit" style={{ padding: '8px 16px' }}>
                          <Icons.X size={14} />
                          驳回
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Icons.Check size={24} />
              </div>
              <h3>审核队列为空</h3>
              <p>当前没有等待审核的作品。</p>
            </div>
          )}
        </section>

        {/* 已上线 */}
        <section style={{ marginBottom: 48 }}>
          <div className="section-header">
            <span className="dot" />
            <h2>已上线作品</h2>
            <span className="line" />
            <span className="count">{approvedProducts.length}</span>
          </div>

          {approvedProducts.length ? (
            <div className="row-list">
              {approvedProducts.map((product) => {
                const draft = product.published;
                if (!draft) return null;

                return (
                  <article className="row-item" key={product.id}>
                    <div className="row-logo">
                      <img src={draft.logoUrl} alt="" />
                    </div>
                    <div className="row-content">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <StatusPill status={product.status} />
                        {product.featured && <span className="status-pill approved">精选</span>}
                      </div>
                      <h3>{draft.name}</h3>
                      <p>{draft.tagline}</p>
                    </div>
                    <div className="row-actions">
                      <Link href={`/products/${product.slug}`} className="btn-ghost">
                        查看
                      </Link>
                      <form action={toggleFeatured.bind(null, product.id)}>
                        <button className="btn-ghost" type="submit">
                          <Icons.Star size={14} />
                          {product.featured ? "取消精选" : "设为精选"}
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--t3)', textAlign: 'center', padding: 40 }}>还没有已上线作品。</p>
          )}
        </section>

        {/* 已驳回 */}
        <section>
          <div className="section-header">
            <span className="dot" />
            <h2>最近驳回</h2>
            <span className="line" />
            <span className="count">{rejectedProducts.length}</span>
          </div>

          {rejectedProducts.length ? (
            <div className="row-list">
              {rejectedProducts.map((product) => {
                const draft = product.pendingDraft ?? product.published;
                if (!draft) return null;

                return (
                  <article className="row-item" key={product.id}>
                    <div className="row-logo">
                      <img src={draft.logoUrl} alt="" />
                    </div>
                    <div className="row-content">
                      <StatusPill status={product.status} />
                      <h3>{draft.name}</h3>
                      <p>{product.adminNote || '无备注'}</p>
                    </div>
                    <div className="row-actions">
                      <a href={draft.websiteUrl} target="_blank" rel="noreferrer" className="btn-ghost">
                        访问
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--t3)', textAlign: 'center', padding: 40 }}>还没有被驳回的作品。</p>
          )}
        </section>

        {/* 用户管理 - 仅超管可见 */}
        {isSuperAdmin && (
          <section>
            <div className="section-header">
              <span className="dot" />
              <h2>用户管理</h2>
              <span className="line" />
              <span className="count">{allUsers.length} 人</span>
            </div>

            <div className="row-list">
              {allUsers.map((u) => {
                const roleLabel =
                  u.role === "SUPER_ADMIN" ? "超管" :
                  u.role === "ADMIN" ? "管理员" : "用户";
                const roleColor =
                  u.role === "SUPER_ADMIN" ? "var(--accent)" :
                  u.role === "ADMIN" ? "var(--green)" : "var(--t3)";
                const banned = !!u.bannedAt;

                return (
                  <article className="row-item" key={u.id}>
                    <div className="bento-author-avatar" style={{ width: 48, height: 48, borderRadius: 12, fontSize: 18 }}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                      ) : (
                        u.username[0].toUpperCase()
                      )}
                    </div>
                    <div className="row-content">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: 100,
                          fontSize: 10,
                          fontWeight: 600,
                          background: `${roleColor}15`,
                          color: roleColor,
                        }}>{roleLabel}</span>
                        {banned && (
                          <span className="status-pill rejected">已封禁</span>
                        )}
                      </div>
                      <h3>{u.name || u.username}</h3>
                      <p>
                        @{u.username} · {u._count.submissions} 个作品
                        {banned && ` · 封禁原因：${u.banReason || "未注明"}`}
                      </p>
                    </div>
                    <div className="row-actions">
                      {u.role !== "SUPER_ADMIN" && (
                        <>
                          {u.role === "ADMIN" ? (
                            <form action={demoteFromAdmin.bind(null, u.id)}>
                              <button className="btn-ghost" type="submit">取消管理员</button>
                            </form>
                          ) : (
                            <form action={promoteToAdmin.bind(null, u.id)}>
                              <button className="btn-ghost" type="submit" style={{ color: 'var(--green)' }}>设为管理员</button>
                            </form>
                          )}
                          {banned ? (
                            <form action={unbanUser.bind(null, u.id)}>
                              <button className="btn-ghost" type="submit" style={{ color: 'var(--green)' }}>解封</button>
                            </form>
                          ) : (
                            <form action={banUser.bind(null, u.id, "违反社区规则")}>
                              <button className="btn-danger" type="submit" style={{ padding: '6px 14px' }}>封禁</button>
                            </form>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
