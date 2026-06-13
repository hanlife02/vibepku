import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/app/components/product-form";
import { submitProduct } from "@/app/actions/products";
import { getCurrentUser } from "@/app/lib/session";

export default async function SubmitPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.bannedAt) {
    return (
      <div>
        <div className="page-header">
          <p className="eyebrow">Submit</p>
          <h1>账号已被封禁</h1>
          <p className="desc">你的账号无法提交作品。封禁原因：{user.banReason || "未注明"}</p>
        </div>
        <div className="shell" style={{ paddingBottom: 80, textAlign: 'center' }}>
          <Link href="/" className="btn-secondary">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <p className="eyebrow">Submit</p>
        <h1>提交你的作品</h1>
        <p className="desc">分享你用 Vibe Coding 创建的产品，审核通过后将展示在展台。</p>
      </div>

      <div className="shell" style={{ maxWidth: 720, paddingBottom: 80 }}>
        <div className="card">
          <div className="card-body">
            <ProductForm action={submitProduct} buttonLabel="提交审核" />
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <div className="form-section-title">
            <span className="number">INFO</span>
            <span className="text">审核规则</span>
            <span className="line" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              "作品必须有可公开访问的网址",
              "Logo 和至少一张截图是必填项",
              "请在构建故事里说明你用了哪些 AI coding 工具",
              "管理员审核通过后，作品才会出现在公开页面",
            ].map((rule, i) => (
              <div key={i} style={{
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
                }}>{i + 1}</span>
                {rule}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
