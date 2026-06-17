import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icons } from "@/app/components/icons";
import { prisma } from "@/app/lib/db";
import { displayCategory, fromStoredList, productWithDrafts } from "@/app/lib/products";
import { getCurrentUser } from "@/app/lib/session";
import { absoluteUrl } from "@/app/lib/site-url";

type ProductDetailParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductDetailParams): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { published: true },
  });

  if (!product?.published) {
    return {
      title: "作品不存在 | VibePKU",
    };
  }

  const draft = product.published;
  const images = fromStoredList(draft.imageUrls);
  const title = `${draft.name} | VibePKU`;
  const url = absoluteUrl(`/products/${product.slug}`);

  return {
    title,
    description: draft.tagline,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: draft.tagline,
      url,
      siteName: "VibePKU",
      images: images[0] ? [{ url: images[0], alt: draft.name }] : undefined,
      type: "website",
    },
    twitter: {
      card: images[0] ? "summary_large_image" : "summary",
      title,
      description: draft.tagline,
      images: images[0] ? [images[0]] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailParams) {
  const { slug } = await params;
  const [product, user] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: productWithDrafts.include,
    }),
    getCurrentUser(),
  ]);

  if (!product || !product.published) {
    notFound();
  }

  const draft = product.published;
  const images = fromStoredList(draft.imageUrls);
  const tools = fromStoredList(draft.tools);
  const tags = fromStoredList(draft.tags);
  const canEdit = user && (user.id === product.submitterId || user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '120px 0 32px' }}>
        <div className="shell">
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t3)', marginBottom: 24 }}>
            <Link href="/" style={{ color: 'var(--t2)' }}>首页</Link>
            <span>/</span>
            <span>{displayCategory(draft.category)}</span>
            <span>/</span>
            <span style={{ color: 'var(--t1)' }}>{draft.name}</span>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {product.featured && (
                <span className="bento-badge">精选</span>
              )}
              <span style={{
                padding: '4px 12px',
                borderRadius: 100,
                fontSize: 10,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--t3)',
              }}>
                {displayCategory(draft.category)}
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 400,
              marginBottom: 16,
              lineHeight: 1.1,
            }}>
              {draft.name}
            </h1>
            <p style={{ fontSize: 17, color: 'var(--t2)', maxWidth: 600, lineHeight: 1.6 }}>
              {draft.tagline}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a className="btn-primary" href={draft.websiteUrl} target="_blank" rel="noreferrer">
              <Icons.ExternalLink size={16} />
              访问产品
            </a>
            {draft.demoVideoUrl && (
              <a className="btn-secondary" href={draft.demoVideoUrl} target="_blank" rel="noreferrer">
                <Icons.ArrowUpRight size={16} />
                演示视频
              </a>
            )}
            {canEdit && (
              <Link className="btn-secondary" href={`/products/${product.slug}/edit`}>
                <Icons.Pencil size={16} />
                编辑
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="shell" style={{ paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>
          {/* Main */}
          <div>
            {/* Cover */}
            {images[0] && (
              <div style={{
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                marginBottom: 24,
              }}>
                <img src={images[0]} alt={`${draft.name} 截图`} style={{ width: '100%', display: 'block' }} />
              </div>
            )}

            {/* Gallery */}
            {images.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
                {images.slice(1).map((image) => (
                  <div key={image} style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}>
                    <img src={image} alt="" style={{ width: '100%', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Build Story */}
            <div className="card">
              <div className="card-body">
                <div className="form-section-title" style={{ marginBottom: 20 }}>
                  <span className="number">STORY</span>
                  <span className="text">构建故事</span>
                  <span className="line" />
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--t2)', whiteSpace: 'pre-wrap' }}>
                  {draft.buildStory}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Logo + Info */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  margin: '0 auto 16px',
                }}>
                  <img src={draft.logoUrl} alt={`${draft.name} Logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>{draft.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--t3)' }}>@{product.submitter.username}</p>
              </div>
            </div>

            {/* Tools */}
            {tools.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 12 }}>使用工具</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {tools.map((tool) => (
                      <span key={tool} style={{
                        padding: '6px 14px',
                        borderRadius: 100,
                        fontSize: 11,
                        background: 'var(--accent-dim)',
                        color: 'var(--accent)',
                        fontWeight: 500,
                      }}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 12 }}>标签</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {tags.map((tag) => (
                      <span key={tag} style={{
                        padding: '6px 14px',
                        borderRadius: 100,
                        fontSize: 11,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--t2)',
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
