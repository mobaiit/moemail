<p align="center">
  <img src="public/icons/icon-192x192.png" alt="WinkMail Logo" width="100" height="100">
  <h1 align="center">WinkMail</h1>
</p>

<p align="center">
  闪邮临时邮箱服务，像流星送达，像眨眼告别。
</p>

<p align="center">
  <span>简体中文</span> |
  <a href="./README.md">English</a>
</p>

---
闪邮：[https://winkmail.ccwu.cc](https://winkmail.ccwu.cc)

## 特性

- 📬 即时生成临时邮箱地址
- 🔒 隐私保护，远离垃圾邮件
- 📤 支持发件
- 🔗 邮箱分享
- ⏱️ 到期自动失效
- 🔑 开放 API，支持 API Key 鉴权
- 🌍 多语言支持（zh-CN / zh-TW / en / ja / ko）
- 🎨 多种网站风格
- 🔔 Webhook 集成

## 技术栈

- **框架**：[Next.js](https://nextjs.org/)
- **平台**：[Cloudflare Pages](https://pages.cloudflare.com/)
- **数据库**：[Cloudflare D1](https://developers.cloudflare.com/d1/)（SQLite）
- **认证**：[NextAuth](https://authjs.dev/)，支持 GitHub / Google 登录
- **样式**：[Tailwind CSS](https://tailwindcss.com/)
- **UI 组件**：基于 [Radix UI](https://www.radix-ui.com/) 的自定义组件

## 部署

本项目通过 GitHub Actions 部署至 Cloudflare Pages。

### 环境变量

| 变量名 | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |
| `PROJECT_NAME` | Cloudflare Pages 项目名 |
| `DATABASE_NAME` | D1 数据库名 |
| `DATABASE_ID` | D1 数据库 ID |
| `KV_NAMESPACE_NAME` | KV 命名空间名 |
| `KV_NAMESPACE_ID` | KV 命名空间 ID |
| `CUSTOM_DOMAIN` | 自定义域名（可选）|
| `AUTH_GITHUB_ID` | GitHub OAuth App ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Secret |
| `AUTH_GOOGLE_ID` | Google OAuth App ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth App Secret |
| `AUTH_SECRET` | NextAuth 密钥 |

## 许可证

[MIT](./LICENSE)
