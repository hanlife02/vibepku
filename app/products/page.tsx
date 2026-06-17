import Link from "next/link";
import { Icons } from "@/app/components/icons";
import { prisma } from "@/app/lib/db";
import {
  displayCategory,
  fromStoredList,
  productWithDrafts,
  publishedProductWhere,
} from "@/app/lib/products";

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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const activeCat = cat && CATEGORY_MAP[cat] ? cat : "all";
  const categoryFilter = activeCat === "all" ? undefined : CATEGORY_MAP[activeCat];

  const where = {
    ...publishedProductWhere,
    ...(categoryFilter ? { published: { category: categoryFilter } } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    include: productWithDrafts.include,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div>
      <div className="page-header">
        <p className="eyebrow">Products</p>
        <h1>全部作品</h1>
        <p className="desc">浏览所有已通过审核的 Vibe Coding 作品。</p>
      </div>

      <section style={{ padding: '0 0 80px' }}>
        <div className="shell">
          <div className="section-header">
            <span className="dot" />
            <h2>作品目录</h2>
            <span className="line" />
            <span className="count">{products.length} 个作品</span>
          </div>

          <div className="cats">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={c.id === "all" ? "/products" : `/products?cat=${c.id}`}
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
    </div>
  );
}
