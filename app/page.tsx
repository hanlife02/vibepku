import Link from "next/link";
import { Icons } from "@/app/components/icons";
import { prisma } from "@/app/lib/db";
import {
  displayCategory,
  fromStoredList,
  pendingReviewProductWhere,
  productWithDrafts,
  publishedProductWhere,
} from "@/app/lib/products";

export default async function Home() {
  const approvedWhere = publishedProductWhere;

  const [featuredProducts, totalApproved, pendingCount, featuredCount] = await Promise.all([
    prisma.product.findMany({
      where: { ...approvedWhere, featured: true },
      include: productWithDrafts.include,
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.product.count({ where: approvedWhere }),
    prisma.product.count({ where: pendingReviewProductWhere }),
    prisma.product.count({ where: { ...approvedWhere, featured: true } }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="shell hero-content">
          <div className="hero-eyebrow">
            <span className="dot" />
            <span>EST. 2026 · PKU · Vibe Coding</span>
          </div>
          <h1>发现用 AI 创造的<br />真实产品</h1>
          <p className="hero-desc">
            收集用 Cursor、Claude Code、Lovable、Bolt、Windsurf 等工具快速做出来的真实可访问作品。
            每个提交都经过人工审核。
          </p>
          <div className="hero-actions">
            <Link href="/submit" className="btn-primary">
              <Icons.Plus size={16} />
              提交作品
            </Link>
            <Link href="/products" className="btn-secondary">
              浏览展台
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">{totalApproved}</div>
              <div className="stat-label">已上线</div>
            </div>
            <div className="stat">
              <div className="stat-value">{featuredCount}</div>
              <div className="stat-label">精选</div>
            </div>
            <div className="stat">
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">待审核</div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="marquee-section">
        <div className="marquee-track">
          <div className="marquee-content">
            {["Cursor", "Claude Code", "Lovable", "Bolt", "Windsurf", "Replit", "v0", "Cursor", "Claude Code", "Lovable", "Bolt", "Windsurf", "Replit", "v0"].map((tool, i) => (
              <span key={i}>
                <span className="marquee-item">{tool}</span>
                {i < 13 && <span className="marquee-dot" />}
              </span>
            ))}
          </div>
          <div className="marquee-content">
            {["Cursor", "Claude Code", "Lovable", "Bolt", "Windsurf", "Replit", "v0", "Cursor", "Claude Code", "Lovable", "Bolt", "Windsurf", "Replit", "v0"].map((tool, i) => (
              <span key={i}>
                <span className="marquee-item">{tool}</span>
                {i < 13 && <span className="marquee-dot" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Explorations */}
      {featuredProducts.length > 0 && (() => {
        const allImages = featuredProducts.flatMap((p) => {
          const draft = p.published;
          if (!draft) return [];
          const images = fromStoredList(draft.imageUrls);
          return images.map((img) => ({ name: draft.name, slug: p.slug, img }));
        });
        if (allImages.length === 0) return null;
        const dup = [...allImages, ...allImages];

        return (
          <section className="playground">
            <div className="shell">
              <div className="playground-header">
                <div>
                  <p className="eyebrow">Explorations</p>
                  <h2 style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontStyle: 'italic',
                    fontSize: 36,
                    fontWeight: 400,
                    color: 'var(--t1)',
                    marginBottom: 8,
                  }}>Visual playground</h2>
                  <p style={{ fontSize: 14, color: 'var(--t2)', maxWidth: 400 }}>
                    用 AI 工具创造的作品截图，展示 Vibe Coding 的可能性。
                  </p>
                </div>
                <Link href="/products" className="btn-secondary">
                  查看全部
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="playground-track">
              <div className="playground-slide">
                {dup.map((item, i) => (
                  <Link href={`/products/${item.slug}`} className="playground-card" key={`${item.slug}-${i}`}>
                    <img src={item.img} alt={item.name} />
                    <span className="playground-label">View — {item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Gallery */}
      <section id="gallery" style={{ padding: '80px 0' }}>
        <div className="shell">
          <div className="section-header">
            <span className="dot" />
            <h2>精选目录</h2>
            <span className="line" />
            <span className="count">{featuredProducts.length} 个精选</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <p style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.6 }}>
              由管理员挑选的代表作品。完整作品列表可以在作品页查看。
            </p>
            <Link href="/products" className="btn-secondary" style={{ flexShrink: 0 }}>
              全部作品
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          {featuredProducts.length ? (
            <div className="bento-grid">
              {featuredProducts.map((product) => {
                const draft = product.published;
                if (!draft) return null;
                const images = fromStoredList(draft.imageUrls);

                return (
                  <Link
                    href={`/products/${product.slug}`}
                    className="bento-item"
                    key={product.id}
                  >
                    <div className="bento-cover">
                      {images[0] && <img src={images[0]} alt={draft.name} />}
                    </div>
                    <div className="bento-body">
                      <div className="bento-meta">
                        {product.featured && <span className="bento-badge">精选</span>}
                        <span className="bento-category">{displayCategory(draft.category)}</span>
                      </div>
                      <h3 className="bento-title">{draft.name}</h3>
                      <p className="bento-desc">{draft.tagline}</p>
                    </div>
                    <div className="bento-footer">
                      <div className="bento-author">
                        <div className="bento-author-avatar">
                          {product.submitter.username[0].toUpperCase()}
                        </div>
                        <span>@{product.submitter.username}</span>
                      </div>
                      <span className="bento-link">
                        查看
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Icons.Star size={24} />
              </div>
              <h3>还没有精选作品</h3>
              <p>管理员设置精选后，会展示在首页。</p>
              <Link href="/products" className="btn-primary">
                浏览全部作品
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="shell">
          <div className="footer-content">
            <div className="footer-brand">
              <img src="/vibepku.png" alt="VibePKU" className="footer-brand-logo" />
              <div className="footer-brand-text">
                <div className="name">VibePKU</div>
              </div>
            </div>
            <div className="footer-links">
              <Link href="/products">全部作品</Link>
              <Link href="/about">关于我们</Link>
              <Link href="/submit">提交作品</Link>
            </div>
            <div className="footer-copy">© 2026 VibePKU</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
