# VibePKU

一个收集 AI coding / Vibe coding 作品的精选目录。

## V1 功能

- 普通访客无需登录即可浏览已上线作品。
- 提交作品必须登录。
- 生产环境支持 GitHub OAuth。
- 开发环境可以访问 `/auth/dev-login` 创建本地测试用户。
- 第一个登录用户自动成为 `ADMIN`，之后登录的用户默认为 `USER`。
- 创作者可以修改作品，但修改会生成待审核草稿。
- 管理员批准修改前，公开页面继续展示上一版已审核内容。
- 管理员可以批准、驳回并填写备注，也可以把作品设为精选。

## 本地启动

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm run dev
```

默认使用 SQLite：

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

如需配置 GitHub OAuth，请创建 OAuth app，并把 callback URL 设置为：

```text
http://localhost:3000/auth/github/callback
```

部署时把域名替换成生产环境域名。

## 管理员初始化

第一个登录用户会成为站点管理员。生产环境上线后，请先自己登录一次，再公开分享网址。

## 常用命令

```bash
pnpm run typecheck
pnpm run build
pnpm prisma db push
pnpm prisma studio
```
