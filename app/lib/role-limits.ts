import { getRequestContext } from "@cloudflare/next-on-pages"
import { EMAIL_CONFIG } from "@/config"

export interface RoleLimitConfig {
  maxEmails: number
  maxPermanentEmails: number
  dailySendLimit: number
  allowPermanentEmail: boolean
}

export type RoleLimitsMap = {
  civilian: RoleLimitConfig
  knight: RoleLimitConfig
  duke: RoleLimitConfig
  emperor: RoleLimitConfig
}

const KV_KEY = "ROLE_LIMITS_CONFIG"

/**
 * 从 KV 读取角色限制配置，读不到则用代码默认值兜底
 */
export async function getRoleLimits(): Promise<RoleLimitsMap> {
  try {
    const env = getRequestContext().env
    const stored = await env.SITE_CONFIG.get(KV_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<RoleLimitsMap>
      return mergeWithDefaults(parsed)
    }
  } catch {
    // 读取失败时使用默认值
  }
  return getDefaultLimits()
}

/**
 * 获取特定角色的限制
 */
export async function getRoleLimitByName(roleName: string): Promise<RoleLimitConfig> {
  const limits = await getRoleLimits()
  if (roleName === "emperor") return limits.emperor
  if (roleName === "duke") return limits.duke
  if (roleName === "knight") return limits.knight
  return limits.civilian
}

function getDefaultLimits(): RoleLimitsMap {
  const d = EMAIL_CONFIG.ROLE_LIMITS
  return {
    emperor: {
      maxEmails: d.emperor.maxEmails,
      maxPermanentEmails: d.emperor.maxPermanentEmails,
      dailySendLimit: d.emperor.dailySendLimit,
      allowPermanentEmail: d.emperor.allowPermanentEmail,
    },
    duke: {
      maxEmails: d.duke.maxEmails,
      maxPermanentEmails: d.duke.maxPermanentEmails,
      dailySendLimit: d.duke.dailySendLimit,
      allowPermanentEmail: d.duke.allowPermanentEmail,
    },
    knight: {
      maxEmails: d.knight.maxEmails,
      maxPermanentEmails: d.knight.maxPermanentEmails,
      dailySendLimit: d.knight.dailySendLimit,
      allowPermanentEmail: d.knight.allowPermanentEmail,
    },
    civilian: {
      maxEmails: d.civilian.maxEmails,
      maxPermanentEmails: d.civilian.maxPermanentEmails,
      dailySendLimit: d.civilian.dailySendLimit,
      allowPermanentEmail: d.civilian.allowPermanentEmail,
    },
  }
}

function mergeWithDefaults(partial: Partial<RoleLimitsMap>): RoleLimitsMap {
  const defaults = getDefaultLimits()
  return {
    emperor: { ...defaults.emperor, ...partial.emperor },
    duke:    { ...defaults.duke,    ...partial.duke    },
    knight:  { ...defaults.knight,  ...partial.knight  },
    civilian:{ ...defaults.civilian,...partial.civilian },
  }
}
