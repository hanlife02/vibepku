# VibePKU

一个收集 AI coding / Vibe coding 作品的精选目录。

## V1 功能

- 普通访客无需登录即可浏览已上线作品。
- 提交作品必须登录。
- 生产环境支持 GitHub OAuth。
- 开发环境可以访问 `/auth/dev-login` 创建本地测试用户。
- 非生产环境第一个登录用户会自动成为 `SUPER_ADMIN`；生产环境必须显式配置初始超管 provider id。
- 创作者可以修改作品，但修改会生成待审核草稿。
- 管理员批准修改前，公开页面继续展示上一版已审核内容。
- 管理员可以批准、驳回并填写备注，也可以把作品设为精选。

## 本地启动

要求 Node.js 20.9+ 和 pnpm 10.28+。

```bash
pnpm install
pnpm prisma generate
pnpm run db:migrate
pnpm run dev
```

默认使用 SQLite：

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

如需配置 GitHub OAuth，请创建 OAuth app，并把 callback URL 设置为：

```text
http://localhost:3001/auth/github/callback
```

部署时把域名替换成生产环境域名。

## 管理员初始化

生产环境上线前，请先设置至少一个初始超管 provider id，避免公开部署后被第一个访客抢占后台：

```env
INITIAL_SUPER_ADMIN_GITHUB_IDS="123456"
INITIAL_SUPER_ADMIN_CASDOOR_IDS="casdoor-user-sub"
```

GitHub 请使用账号的 numeric id，Casdoor 请使用用户 `sub`。当数据库里还没有 `SUPER_ADMIN` 时，匹配这些 id 的用户登录后会被授予 `SUPER_ADMIN`；未配置时，生产环境不会自动授予任何首个登录用户超管权限。非生产环境仍保留首个登录用户自动成为 `SUPER_ADMIN`，便于本地开发。

## 生产部署注意事项

- 生产环境必须设置 `DATABASE_URL` 和 `NEXT_PUBLIC_APP_URL`。
- 生产环境必须设置 `INITIAL_SUPER_ADMIN_GITHUB_IDS` 或 `INITIAL_SUPER_ADMIN_CASDOOR_IDS` 来初始化后台管理员。
- 首次部署和每次 schema 变更后，先运行 `pnpm run db:deploy` 应用 Prisma migrations。
- 部署前运行 `pnpm run check:env`，确认生产环境变量足以支持登录、管理员初始化和上传。
- 至少配置一种登录方式：GitHub OAuth 或 Casdoor OAuth。
- `/auth/dev-login` 只在非生产环境可用，生产环境会回到登录页。
- 上传接口默认把图片写入 `public/uploads`，适合持久化磁盘部署；如果部署到 Vercel、Netlify 等无状态平台，请把 `UPLOAD_STORAGE_DRIVER` 设为 `s3`，并配置 S3/R2 兼容对象存储。
- 上传文件会按真实文件头限制为 PNG、JPG、GIF、WebP，单个文件最大 5MB。
- 部署后可以访问 `/api/health` 检查应用和数据库连通性；正常返回 HTTP 200，数据库不可用时返回 HTTP 503。
- 部署后会提供 `/robots.txt` 和 `/sitemap.xml`；sitemap 会包含已上线作品详情页。
- 应用默认发送 `X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy` 和 `Permissions-Policy` 安全响应头；CSP 需要先迁移内联样式和主题脚本后再启用。

对象存储需要配置：

```env
UPLOAD_STORAGE_DRIVER="s3"
S3_BUCKET=""
S3_REGION=""
S3_ENDPOINT=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_PUBLIC_BASE_URL=""
S3_UPLOAD_PREFIX="uploads"
S3_FORCE_PATH_STYLE="true"
```

## 常用命令

```bash
pnpm prisma generate
pnpm run db:migrate
pnpm run db:deploy
pnpm test
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run check:env
pnpm prisma studio
```

合并或部署前至少确认 `pnpm prisma generate`、`pnpm run db:deploy`、`pnpm test`、`pnpm run lint`、`pnpm run typecheck`、`pnpm run build` 全部通过；生产部署环境还要确认 `pnpm run check:env` 通过。GitHub Actions 会在 push 到 `main` 和 pull request 时执行代码门禁。

部署后可用下面的命令做一次冒烟检查：

```bash
curl -f https://your-domain.example/api/health
curl -f https://your-domain.example/robots.txt
curl -f https://your-domain.example/sitemap.xml
```

`pnpm run smoke -- https://your-domain.example` 会同时检查 health、robots、sitemap 和基础安全响应头。
