import Link from "next/link";
import { Icons } from "@/app/components/icons";
import { getCurrentUser } from "@/app/lib/session";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ missing?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/submit");
  const params = await searchParams;

  return (
    <div className="page-header" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="shell" style={{ maxWidth: 480 }}>
        <div className="card">
          <div className="card-body" style={{ padding: '48px 40px' }}>
            <p className="eyebrow" style={{ textAlign: 'left', marginBottom: 24 }}>Login</p>
            <h1 style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 32,
              fontWeight: 400,
              marginBottom: 16,
              textAlign: 'left',
            }}>
              确认你的身份
            </h1>
            <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 32 }}>
              普通访客可以直接浏览。提交作品需要 GitHub 登录，这样管理员能确认真实项目，也能在需要修改时联系创作者。
            </p>

            {params.missing === "github" && (
              <div style={{
                padding: '14px 20px',
                borderRadius: 12,
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: 'var(--red)',
                fontSize: 13,
                marginBottom: 24,
              }}>
                GitHub OAuth 还没有配置。请添加 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET。
              </div>
            )}
            {params.missing === "casdoor" && (
              <div style={{
                padding: '14px 20px',
                borderRadius: 12,
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: 'var(--red)',
                fontSize: 13,
                marginBottom: 24,
              }}>
                Casdoor OAuth 还没有配置。请添加 CASDOOR_ENDPOINT、CASDOOR_CLIENT_ID 和 CASDOOR_CLIENT_SECRET。
              </div>
            )}
            {params.error && (
              <div style={{
                padding: '14px 20px',
                borderRadius: 12,
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: 'var(--red)',
                fontSize: 13,
                marginBottom: 24,
              }}>
                GitHub 登录失败，请重试。
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a className="btn-primary" href="/auth/github" style={{ justifyContent: 'center', padding: '14px 24px' }}>
                <Icons.Github size={18} />
                使用 GitHub 继续
              </a>
              <a className="btn-secondary" href="/auth/casdoor" style={{ justifyContent: 'center', padding: '14px 24px' }}>
                使用 Casdoor 继续
              </a>
              {process.env.NODE_ENV !== "production" && (
                <Link className="btn-secondary" href="/auth/dev-login" style={{ justifyContent: 'center', padding: '14px 24px' }}>
                  <Icons.ShieldCheck size={16} />
                  开发环境登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
