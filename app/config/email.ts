export const EMAIL_CONFIG = {
  POLL_INTERVAL: 10_000, // 轮询间隔（毫秒）

  // 各角色活跃邮箱数量上限（非永久邮箱 + 永久邮箱合计）
  MAX_ACTIVE_EMAILS: 30, // 兜底默认值（管理员可在后台覆盖）

  // 角色限制配置
  ROLE_LIMITS: {
    emperor: {
      maxEmails: 0,          // 0 = 无限制
      maxPermanentEmails: 0, // 0 = 无限制
      maxMonthlyApiCalls: 0, // 0 = 无限制
      dailySendLimit: 0,     // 0 = 无限制
      allowWebhook: true,
      allowPermanentEmail: true,
    },
    duke: {
      maxEmails: 50,
      maxPermanentEmails: 5,
      maxMonthlyApiCalls: 100_000,
      dailySendLimit: 5,
      allowWebhook: true,
      allowPermanentEmail: true,
    },
    knight: {
      maxEmails: 10,
      maxPermanentEmails: 1,
      maxMonthlyApiCalls: 0,  // 不开放 API
      dailySendLimit: 2,
      allowWebhook: false,
      allowPermanentEmail: true,
    },
    civilian: {
      maxEmails: 1,
      maxPermanentEmails: 0, // 不允许永久邮箱
      maxMonthlyApiCalls: 0, // 不开放 API
      dailySendLimit: -1,    // -1 = 禁止发件
      allowWebhook: false,
      allowPermanentEmail: false,
    },
  },

  // 发件日限额（兼容旧逻辑，从 ROLE_LIMITS 派生）
  DEFAULT_DAILY_SEND_LIMITS: {
    emperor: 0,
    duke: 5,
    knight: 2,
    civilian: -1,
  },
} as const

export type RoleName = keyof typeof EMAIL_CONFIG.ROLE_LIMITS
export type RoleLimit = typeof EMAIL_CONFIG.ROLE_LIMITS[RoleName]
export type EmailConfig = typeof EMAIL_CONFIG
