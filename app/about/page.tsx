import Link from "next/link";
import { Icons } from "@/app/components/icons";
import { prisma } from "@/app/lib/db";

export default async function AboutPage() {
  const [totalProducts, totalUsers, featuredCount] = await Promise.all([
    prisma.product.count({ where: { publishedId: { not: null } } }),
    prisma.user.count(),
    prisma.product.count({ where: { publishedId: { not: null }, featured: true } }),
  ]);

  return (
    <div>
      <div className="page-header">
        <p className="eyebrow">About</p>
        <h1>关于 VibePKU</h1>
        <p className="desc">一个展示 AI Coding 作品的开放平台</p>
      </div>

      <div className="shell" style={{ maxWidth: 720, paddingBottom: 80 }}>
        {/* 项目介绍 */}
        <section style={{ marginBottom: 48 }}>
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">什么是 Vibe Coding？</h2>
              <p className="card-text" style={{ marginBottom: 20 }}>
                Vibe Coding 是一种全新的创造方式——借助 AI 编程工具（如 Cursor、Claude Code、Lovable、Bolt 等），
                快速将想法变成可运行的产品。不需要深厚的编程功底，重要的是创意和执行力。
              </p>
              <p className="card-text">
                VibePKU 收集和展示这些用 AI 快速构建的真实作品。每个提交都经过人工审核，
                确保是可访问的、有实际价值的产品。
              </p>
            </div>
          </div>
        </section>

        {/* 数据统计 */}
        <section style={{ marginBottom: 48 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {[
              { value: totalProducts, label: '已上线作品', color: 'var(--accent)' },
              { value: totalUsers, label: '注册用户', color: 'var(--green)' },
              { value: featuredCount, label: '精选作品', color: 'var(--amber)' },
            ].map((stat) => (
              <div key={stat.label} className="card">
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 36,
                    fontWeight: 700,
                    color: stat.color,
                    letterSpacing: -2,
                  }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 运作方式 */}
        <section style={{ marginBottom: 48 }}>
          <div className="form-section-title">
            <span className="number">01</span>
            <span className="text">如何运作</span>
            <span className="line" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { step: '1', text: '用 AI 工具构建你的产品，并部署到可公开访问的地址' },
              { step: '2', text: '在 VibePKU 提交作品，附上链接、截图和构建故事' },
              { step: '3', text: '管理员审核通过后，作品展示在公开展台' },
              { step: '4', text: '优秀作品有机会获得精选推荐' },
            ].map((item) => (
              <div key={item.step} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                fontSize: 13,
                color: 'var(--t2)',
              }}>
                <span style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>{item.step}</span>
                {item.text}
              </div>
            ))}
          </div>
        </section>

        {/* 支持的工具 */}
        <section style={{ marginBottom: 48 }}>
          <div className="form-section-title">
            <span className="number">02</span>
            <span className="text">支持的 AI 工具</span>
            <span className="line" />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}>
            {["Cursor", "Claude Code", "Lovable", "Bolt", "Windsurf", "Replit", "v0", "ChatGPT"].map((tool) => (
              <div key={tool} style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--t1)',
                textAlign: 'center',
              }}>{tool}</div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', paddingTop: 16 }}>
          <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 24 }}>
            用 AI 创造了什么？分享你的作品。
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/submit" className="btn-primary">
              <Icons.Plus size={16} />
              提交作品
            </Link>
            <Link href="/" className="btn-secondary">
              浏览展台
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
