"use client"

import { create } from "zustand"
import { Role, ROLES } from "@/lib/permissions"
import { EMAIL_CONFIG } from "@/config"
import { useEffect } from "react"

export interface RoleLimitConfig {
  maxEmails: number
  maxPermanentEmails: number
  dailySendLimit: number
  allowPermanentEmail: boolean
}

export interface RoleLimitsMap {
  civilian: RoleLimitConfig
  knight: RoleLimitConfig
  duke: RoleLimitConfig
  emperor: RoleLimitConfig
}

const DEFAULT_ROLE_LIMITS: RoleLimitsMap = {
  emperor: {
    maxEmails: EMAIL_CONFIG.ROLE_LIMITS.emperor.maxEmails,
    maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.emperor.maxPermanentEmails,
    dailySendLimit: EMAIL_CONFIG.ROLE_LIMITS.emperor.dailySendLimit,
    allowPermanentEmail: EMAIL_CONFIG.ROLE_LIMITS.emperor.allowPermanentEmail,
  },
  duke: {
    maxEmails: EMAIL_CONFIG.ROLE_LIMITS.duke.maxEmails,
    maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.duke.maxPermanentEmails,
    dailySendLimit: EMAIL_CONFIG.ROLE_LIMITS.duke.dailySendLimit,
    allowPermanentEmail: EMAIL_CONFIG.ROLE_LIMITS.duke.allowPermanentEmail,
  },
  knight: {
    maxEmails: EMAIL_CONFIG.ROLE_LIMITS.knight.maxEmails,
    maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.knight.maxPermanentEmails,
    dailySendLimit: EMAIL_CONFIG.ROLE_LIMITS.knight.dailySendLimit,
    allowPermanentEmail: EMAIL_CONFIG.ROLE_LIMITS.knight.allowPermanentEmail,
  },
  civilian: {
    maxEmails: EMAIL_CONFIG.ROLE_LIMITS.civilian.maxEmails,
    maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.civilian.maxPermanentEmails,
    dailySendLimit: EMAIL_CONFIG.ROLE_LIMITS.civilian.dailySendLimit,
    allowPermanentEmail: EMAIL_CONFIG.ROLE_LIMITS.civilian.allowPermanentEmail,
  },
}

interface Config {
  defaultRole: Exclude<Role, typeof ROLES.EMPEROR>
  emailDomains: string
  emailDomainsArray: string[]
  adminContact: string
  maxEmails: number
  upgradeUrlKnight: string
  upgradeUrlDuke: string
  roleLimits: RoleLimitsMap
}

interface ConfigStore {
  config: Config | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
}

const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  loading: false,
  error: null,
  fetch: async () => {
    try {
      set({ loading: true, error: null })
      const res = await fetch("/api/config")
      if (!res.ok) throw new Error("获取配置失败")
      const data = await res.json() as Config & { roleLimits?: Partial<RoleLimitsMap> }

      // 合并 KV 里的角色限制和代码默认值
      const roleLimits: RoleLimitsMap = {
        emperor: { ...DEFAULT_ROLE_LIMITS.emperor, ...data.roleLimits?.emperor },
        duke:    { ...DEFAULT_ROLE_LIMITS.duke,    ...data.roleLimits?.duke    },
        knight:  { ...DEFAULT_ROLE_LIMITS.knight,  ...data.roleLimits?.knight  },
        civilian:{ ...DEFAULT_ROLE_LIMITS.civilian, ...data.roleLimits?.civilian},
      }

      set({
        config: {
          defaultRole: data.defaultRole || ROLES.CIVILIAN,
          emailDomains: data.emailDomains,
          emailDomainsArray: data.emailDomains?.split(',') ?? [],
          adminContact: data.adminContact || "",
          maxEmails: Number(data.maxEmails) || EMAIL_CONFIG.MAX_ACTIVE_EMAILS,
          upgradeUrlKnight: data.upgradeUrlKnight || "",
          upgradeUrlDuke: data.upgradeUrlDuke || "",
          roleLimits,
        },
        loading: false
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "获取配置失败",
        loading: false
      })
    }
  }
}))

export function useConfig() {
  const store = useConfigStore()

  useEffect(() => {
    if (!store.config && !store.loading) {
      store.fetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return store
}
