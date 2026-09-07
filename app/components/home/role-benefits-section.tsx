"use client"

import { Crown, Gem, Sword, User2, Check, X } from "lucide-react"
import { ROLES } from "@/lib/permissions"
import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

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

const BENEFIT_ROWS: { label: string; values: (string | boolean)[] }[] = [
  { label: "邮箱数量",  values: ["1 个",  "10 个",  "50 个",  "无限制"] },
  { label: "永久邮箱",  values: [false,    "1 个",   "5 个",   "无限制"] },
  { label: "每日发件",  values: [false,    "2 封",   "5 封",   "无限制"] },
  { label: "Webhook",  values: [false,    false,    true,     true     ] },
  { label: "API Key",  values: [false,    false,    true,     true     ] },
  { label: "删除冷却",  values: ["24h",   "24h",    false,    false    ] },
]

interface Config {
  upgradeUrlKnight?: string
  upgradeUrlDuke?: string
}

export function RoleBenefitsSection() {
  const [config, setConfig] = useState<Config>({})
  const locale = useLocale()
  const router = useRouter()
  const { data: session } = useSession()

  // 公爵和皇帝不显示升级按钮
  const currentRole = session?.user?.roles?.[0]?.name
  const hideUpgrade = currentRole === ROLES.DUKE || currentRole === ROLES.EMPEROR

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json() as Promise<Config>)
      .then(data => setConfig({
        upgradeUrlKnight: data.upgradeUrlKnight,
        upgradeUrlDuke: data.upgradeUrlDuke,
      }))
      .catch(console.error)
  }, [])

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
            {BENEFIT_ROWS.map((row, i) => (
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
