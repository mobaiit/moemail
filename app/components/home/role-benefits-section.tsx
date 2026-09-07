"use client"

import { Crown, Gem, Sword, User2, Check, X } from "lucide-react"
import { ROLES } from "@/lib/permissions"
import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { EMAIL_CONFIG } from "@/config"
import type { RoleLimitsMap } from "@/hooks/use-config"

const ROLE_CONFIGS = [
  {
    key: ROLES.CIVILIAN,
    label: "平民",
    icon: User2,
    color: "text-gray-500",
    headerBg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-200 dark:border-gray-700",
  },
  {
    key: ROLES.KNIGHT,
    label: "骑士",
    icon: Sword,
    color: "text-blue-600",
    headerBg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    key: ROLES.DUKE,
    label: "公爵",
    icon: Gem,
    color: "text-purple-600",
    headerBg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
    highlight: true,
  },
  {
    key: ROLES.EMPEROR,
    label: "皇帝",
    icon: Crown,
    color: "text-amber-600",
    headerBg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
] as const

/** 将 maxEmails/maxPermanentEmails 数字转为展示文字，0 表示无限制 */
function fmtCount(n: number, unit: string) {
  return n === 0 ? "无限制" : `${n} ${unit}`
}

/** 将 dailySendLimit 数字转为展示文字，0 = 无限制，-1 = 禁止 */
function fmtSend(n: number) {
  if (n === 0) return "无限制"
  if (n < 0) return false
  return `${n} 封`
}

/** 根据 roleLimits 动态生成权益行数据 */
function buildBenefitRows(limits: RoleLimitsMap) {
  const { civilian, knight, duke, emperor } = limits
  return [
    {
      label: "邮箱数量",
      values: [
        fmtCount(civilian.maxEmails, "个"),
        fmtCount(knight.maxEmails, "个"),
        fmtCount(duke.maxEmails, "个"),
        fmtCount(emperor.maxEmails, "个"),
      ],
    },
    {
      label: "永久邮箱",
      values: [
        civilian.maxPermanentEmails === 0 ? false : fmtCount(civilian.maxPermanentEmails, "个"),
        knight.maxPermanentEmails === 0 ? false : fmtCount(knight.maxPermanentEmails, "个"),
        duke.maxPermanentEmails === 0 ? false : fmtCount(duke.maxPermanentEmails, "个"),
        emperor.maxPermanentEmails === 0 ? "无限制" : fmtCount(emperor.maxPermanentEmails, "个"),
      ],
    },
    {
      label: "每日发件",
      values: [
        fmtSend(civilian.dailySendLimit),
        fmtSend(knight.dailySendLimit),
        fmtSend(duke.dailySendLimit),
        fmtSend(emperor.dailySendLimit),
      ],
    },
    { label: "Webhook",  values: [false, false, true,  true ] },
    { label: "API Key",  values: [false, false, true,  true ] },
    { label: "删除冷却", values: ["24h", "24h", false, false] },
  ] as { label: string; values: (string | boolean)[] }[]
}

const DEFAULT_LIMITS: RoleLimitsMap = {
  emperor:  { maxEmails: EMAIL_CONFIG.ROLE_LIMITS.emperor.maxEmails,  maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.emperor.maxPermanentEmails,  dailySendLimit: EMAIL_CONFIG.ROLE_LIMITS.emperor.dailySendLimit,  allowPermanentEmail: EMAIL_CONFIG.ROLE_LIMITS.emperor.allowPermanentEmail  },
  duke:     { maxEmails: EMAIL_CONFIG.ROLE_LIMITS.duke.maxEmails,     maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.duke.maxPermanentEmails,     dailySendLimit: EMAIL_CONFIG.ROLE_LIMITS.duke.dailySendLimit,     allowPermanentEmail: EMAIL_CONFIG.ROLE_LIMITS.duke.allowPermanentEmail     },
  knight:   { maxEmails: EMAIL_CONFIG.ROLE_LIMITS.knight.maxEmails,   maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.knight.maxPermanentEmails,   dailySendLimit: EMAIL_CONFIG.ROLE_LIMITS.knight.dailySendLimit,   allowPermanentEmail: EMAIL_CONFIG.ROLE_LIMITS.knight.allowPermanentEmail   },
  civilian: { maxEmails: EMAIL_CONFIG.ROLE_LIMITS.civilian.maxEmails, maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.civilian.maxPermanentEmails, dailySendLimit: EMAIL_CONFIG.ROLE_LIMITS.civilian.dailySendLimit, allowPermanentEmail: EMAIL_CONFIG.ROLE_LIMITS.civilian.allowPermanentEmail },
}

interface ApiConfig {
  upgradeUrlKnight?: string
  upgradeUrlDuke?: string
  roleLimits?: RoleLimitsMap
}

export function RoleBenefitsSection() {
  const [config, setConfig] = useState<ApiConfig>({})
  const locale = useLocale()
  const router = useRouter()
  const { data: session } = useSession()

  // 公爵和皇帝不显示升级按钮
  const currentRole = session?.user?.roles?.[0]?.name
  const hideUpgrade = currentRole === ROLES.DUKE || currentRole === ROLES.EMPEROR

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json() as Promise<ApiConfig>)
      .then(data => setConfig(data))
      .catch(console.error)
  }, [])

  const roleLimits: RoleLimitsMap = {
    emperor:  { ...DEFAULT_LIMITS.emperor,  ...config.roleLimits?.emperor  },
    duke:     { ...DEFAULT_LIMITS.duke,     ...config.roleLimits?.duke     },
    knight:   { ...DEFAULT_LIMITS.knight,   ...config.roleLimits?.knight   },
    civilian: { ...DEFAULT_LIMITS.civilian, ...config.roleLimits?.civilian },
  }
  const benefitRows = buildBenefitRows(roleLimits)

  return (
    <section className="w-full max-w-3xl mx-auto px-2 sm:px-0 py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-wide">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            角色权益对比
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-2">选择适合你的套餐，联系管理员升级</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background/60 backdrop-blur">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground w-28">权益</th>
              {ROLE_CONFIGS.map(role => {
                const Icon = role.icon
                return (
                  <th key={role.key} className="p-3 text-center">
                    <div className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${role.headerBg} border ${role.border}`}>
                      <Icon className={`w-4 h-4 ${role.color}`} />
                      <span className={`text-xs font-bold ${role.color}`}>{role.label}</span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {benefitRows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                <td className="px-4 py-3 text-sm text-muted-foreground">{row.label}</td>
                {row.values.map((v, j) => (
                  <td key={j} className="px-3 py-3 text-center text-sm">
                    {typeof v === "boolean" ? (
                      v
                        ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                        : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                    ) : (
                      <span className="font-medium">{v}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 升级按钮：公爵和皇帝不显示 */}
      {!hideUpgrade && (config.upgradeUrlKnight || config.upgradeUrlDuke) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          {config.upgradeUrlKnight && (
            <a
              href={config.upgradeUrlKnight}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              升级为骑士 →
            </a>
          )}
          {config.upgradeUrlDuke && (
            <a
              href={config.upgradeUrlDuke}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 px-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
            >
              升级为公爵 →
            </a>
          )}
          <button
            onClick={() => router.push(`/${locale}/profile`)}
            className="flex-1 text-center py-2.5 px-6 rounded-lg border border-primary text-primary hover:bg-primary/5 text-sm font-medium transition-colors"
          >
            查看我的权益
          </button>
        </div>
      )}
    </section>
  )
}
