import { PERMISSIONS, Role, ROLES } from "@/lib/permissions"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { EMAIL_CONFIG } from "@/config"
import { checkPermission } from "@/lib/auth"
import { getRoleLimits } from "@/lib/role-limits"

export const runtime = "edge"

export async function GET() {
  const env = getRequestContext().env
  const canManageConfig = await checkPermission(PERMISSIONS.MANAGE_CONFIG)

  const [
    defaultRole,
    emailDomains,
    adminContact,
    turnstileEnabled,
    turnstileSiteKey,
    turnstileSecretKey,
    siteStyle,
    upgradeUrlKnight,
    upgradeUrlDuke,
  ] = await Promise.all([
    env.SITE_CONFIG.get("DEFAULT_ROLE"),
    env.SITE_CONFIG.get("EMAIL_DOMAINS"),
    env.SITE_CONFIG.get("ADMIN_CONTACT"),
    env.SITE_CONFIG.get("TURNSTILE_ENABLED"),
    env.SITE_CONFIG.get("TURNSTILE_SITE_KEY"),
    env.SITE_CONFIG.get("TURNSTILE_SECRET_KEY"),
    env.SITE_CONFIG.get("SITE_STYLE"),
    env.SITE_CONFIG.get("UPGRADE_URL_KNIGHT"),
    env.SITE_CONFIG.get("UPGRADE_URL_DUKE"),
  ])

  // 角色限制只对管理员返回
  const roleLimits = canManageConfig ? await getRoleLimits() : undefined

  return Response.json({
    defaultRole: defaultRole || ROLES.CIVILIAN,
    emailDomains: emailDomains || "moemail.app",
    adminContact: adminContact || "",
    siteStyle: siteStyle || "default",
    upgradeUrlKnight: upgradeUrlKnight || "",
    upgradeUrlDuke: upgradeUrlDuke || "",
    roleLimits,
    turnstile: canManageConfig ? {
      enabled: turnstileEnabled === "true",
      siteKey: turnstileSiteKey || "",
      secretKey: turnstileSecretKey || "",
    } : undefined
  })
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return Response.json({ error: "权限不足" }, { status: 403 })
  }

  const {
    defaultRole,
    emailDomains,
    adminContact,
    siteStyle,
    upgradeUrlKnight,
    upgradeUrlDuke,
    roleLimits,
    turnstile
  } = await request.json() as {
    defaultRole: Exclude<Role, typeof ROLES.EMPEROR>,
    emailDomains: string,
    adminContact: string,
    siteStyle: string,
    upgradeUrlKnight?: string,
    upgradeUrlDuke?: string,
    roleLimits?: {
      civilian: { maxEmails: number; maxPermanentEmails: number; dailySendLimit: number }
      knight:   { maxEmails: number; maxPermanentEmails: number; dailySendLimit: number }
      duke:     { maxEmails: number; maxPermanentEmails: number; dailySendLimit: number }
    }
    turnstile?: { enabled: boolean; siteKey: string; secretKey: string }
  }

  if (![ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN].includes(defaultRole)) {
    return Response.json({ error: "无效的角色" }, { status: 400 })
  }

  const turnstileConfig = turnstile ?? { enabled: false, siteKey: "", secretKey: "" }
  if (turnstileConfig.enabled && (!turnstileConfig.siteKey || !turnstileConfig.secretKey)) {
    return Response.json({ error: "Turnstile 启用时需要提供 Site Key 和 Secret Key" }, { status: 400 })
  }

  const env = getRequestContext().env

  // 构建要存储的角色限制（合并 emperor 默认值，皇帝不允许修改）
  const limitsToStore = roleLimits ? {
    emperor: EMAIL_CONFIG.ROLE_LIMITS.emperor,
    duke: {
      ...EMAIL_CONFIG.ROLE_LIMITS.duke,
      maxEmails:          roleLimits.duke.maxEmails,
      maxPermanentEmails: roleLimits.duke.maxPermanentEmails,
      dailySendLimit:     roleLimits.duke.dailySendLimit,
      allowPermanentEmail: roleLimits.duke.maxPermanentEmails > 0,
    },
    knight: {
      ...EMAIL_CONFIG.ROLE_LIMITS.knight,
      maxEmails:          roleLimits.knight.maxEmails,
      maxPermanentEmails: roleLimits.knight.maxPermanentEmails,
      dailySendLimit:     roleLimits.knight.dailySendLimit,
      allowPermanentEmail: roleLimits.knight.maxPermanentEmails > 0,
    },
    civilian: {
      ...EMAIL_CONFIG.ROLE_LIMITS.civilian,
      maxEmails:          roleLimits.civilian.maxEmails,
      maxPermanentEmails: roleLimits.civilian.maxPermanentEmails,
      dailySendLimit:     roleLimits.civilian.dailySendLimit,
      allowPermanentEmail: roleLimits.civilian.maxPermanentEmails > 0,
    },
  } : null

  await Promise.all([
    env.SITE_CONFIG.put("DEFAULT_ROLE", defaultRole),
    env.SITE_CONFIG.put("EMAIL_DOMAINS", emailDomains),
    env.SITE_CONFIG.put("ADMIN_CONTACT", adminContact),
    env.SITE_CONFIG.put("SITE_STYLE", siteStyle || "default"),
    env.SITE_CONFIG.put("UPGRADE_URL_KNIGHT", upgradeUrlKnight || ""),
    env.SITE_CONFIG.put("UPGRADE_URL_DUKE", upgradeUrlDuke || ""),
    env.SITE_CONFIG.put("TURNSTILE_ENABLED", turnstileConfig.enabled.toString()),
    env.SITE_CONFIG.put("TURNSTILE_SITE_KEY", turnstileConfig.siteKey),
    env.SITE_CONFIG.put("TURNSTILE_SECRET_KEY", turnstileConfig.secretKey),
    limitsToStore
      ? env.SITE_CONFIG.put("ROLE_LIMITS_CONFIG", JSON.stringify(limitsToStore))
      : Promise.resolve(),
  ])

  return Response.json({ success: true })
}
