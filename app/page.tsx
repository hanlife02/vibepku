import Link from "next/link";
import { Icons } from "@/app/components/icons";
import { prisma } from "@/app/lib/db";
import { displayCategory, fromStoredList, productWithDrafts } from "@/app/lib/products";

const CATEGORY_MAP: Record<string, string> = {
  "dev-tools": "Dev Tools",
  creative: "Creative",
  productivity: "Productivity",
  education: "Education",
  social: "Social",
  opensource: "Open Source",
};

const categories = [
  { id: "all", label: "全部", emoji: "✦" },
  { id: "dev-tools", label: "开发工具", emoji: "⚙" },
  { id: "creative", label: "创意设计", emoji: "◎" },
  { id: "productivity", label: "效率工具", emoji: "▸" },
  { id: "education", label: "学习教育", emoji: "◇" },
  { id: "social", label: "社交娱乐", emoji: "◈" },
  { id: "opensource", label: "开源项目", emoji: "⊕" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const activeCat = cat && CATEGORY_MAP[cat] ? cat : "all";
  const categoryFilter = activeCat === "all" ? undefined : CATEGORY_MAP[activeCat];

  const where = {
    publishedId: { not: null },
    status: "APPROVED",
    ...(categoryFilter ? { published: { category: categoryFilter } } : {}),
  };

  const [products, totalApproved, pendingCount, featuredCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productWithDrafts.include,
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.product.count({ where: { publishedId: { not: null }, status: "APPROVED" } }),
    prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.product.count({ where: { publishedId: { not: null }, status: "APPROVED", featured: true } }),
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
            <a href="#gallery" className="btn-secondary">
              浏览展台
            </a>
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
      {products.length > 0 && (() => {
        const allImages = products.flatMap((p) => {
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
                <a href="#gallery" className="btn-secondary">
                  查看全部
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </a>
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
            <span className="count">{products.length} 个作品</span>
          </div>

          <div className="cats">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={c.id === "all" ? "/#gallery" : `/?cat=${c.id}#gallery`}
                className={`cat${activeCat === c.id ? ' active' : ''}`}
              >
                <span style={{ marginRight: 6, opacity: 0.6 }}>{c.emoji}</span>
                {c.label}
              </Link>
            ))}
          </div>

          {products.length ? (
            <div className="bento-grid">
              {products.map((product) => {
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
                <Icons.Plus size={24} />
              </div>
              <h3>还没有上线作品</h3>
              <p>用 GitHub 登录，提交第一个 Vibe coding 作品。</p>
              <Link href="/submit" className="btn-primary">
                <Icons.Plus size={16} />
                提交作品
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
              <a href="/about">关于我们</a>
              <a href="/submit">提交作品</a>
            </div>
            <div className="footer-copy">© 2026 VibePKU</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
