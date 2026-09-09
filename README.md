<p align="center">
  <img src="public/icons/icon-192x192.png" alt="WinkMail Logo" width="100" height="100">
  <h1 align="center">WinkMail</h1>
</p>

<p align="center">
  Flash your inbox — arrives like a shooting star, gone in a wink.
</p>

<p align="center">
  <span>English</span> |
  <a href="./README.zh-CN.md">简体中文</a>
</p>

---
闪邮：[https://winkmail.ccwu.cc](https://winkmail.ccwu.cc)
## Features

- 📬 Instant temporary email address generation
- 🔒 Privacy protection — keep your real address safe
- 📤 Email sending support
- 🔗 Mailbox sharing
- ⏱️ Auto-expiry
- 🔑 Open API with API Key authentication
- 🌍 Multi-language support (zh-CN / zh-TW / en / ja / ko)
- 🎨 Multiple site styles
- 🔔 Webhook integration

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Platform**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **Authentication**: [NextAuth](https://authjs.dev/) with GitHub / Google Login
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: Custom components based on [Radix UI](https://www.radix-ui.com/)

## Deployment

This project is deployed on Cloudflare Pages via GitHub Actions.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `PROJECT_NAME` | Cloudflare Pages project name |
| `DATABASE_NAME` | D1 database name |
| `DATABASE_ID` | D1 database ID |
| `KV_NAMESPACE_NAME` | KV namespace name |
| `KV_NAMESPACE_ID` | KV namespace ID |
| `CUSTOM_DOMAIN` | Custom domain (optional) |
| `AUTH_GITHUB_ID` | GitHub OAuth App ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Secret |
| `AUTH_GOOGLE_ID` | Google OAuth App ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth App Secret |
| `AUTH_SECRET` | NextAuth secret key |

## License

[MIT](./LICENSE)
