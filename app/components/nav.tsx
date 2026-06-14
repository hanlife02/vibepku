import Link from "next/link";
import { getCurrentUser } from "@/app/lib/session";
import { Icons } from "@/app/components/icons";
import { ThemeToggle } from "./theme-toggle";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link href="/" className="brand">
          <img src="/vibepku.png" alt="VibePKU" className="brand-logo" />
          <span className="brand-name">VibePKU</span>
        </Link>

        <nav className="nav">
          <Link href="/" className="nav-link">首页</Link>
          <Link href="/products" className="nav-link">作品</Link>
          <Link href="/submit" className="nav-link">提交</Link>
          <Link href="/about" className="nav-link">关于</Link>
          {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
            <Link href="/admin" className="nav-link">管理</Link>
          )}
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/dashboard" className="user-avatar" title={`@${user.username}`}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" />
                ) : (
                  user.username[0].toUpperCase()
                )}
              </Link>
              <form action="/auth/logout" method="post">
                <button type="submit" className="btn-ghost" style={{ fontSize: 12, color: 'var(--t3)' }}>
                  退出
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
