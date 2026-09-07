"use client"

import { Crown, Gem, Sword, User2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROLES } from "@/lib/permissions"
import { EMAIL_CONFIG } from "@/config"
import { useSession } from "next-auth/react"

const ROLE_CONFIGS = [
  {
    key: ROLES.CIVILIAN,
    label: "平民",
    icon: User2,
    color: "text-gray-500",
    bg: "bg-gray-50 dark:bg-gray-900/50",
    border: "border-gray-200 dark:border-gray-700",
  },
  {
    key: ROLES.KNIGHT,
    label: "骑士",
    icon: Sword,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    key: ROLES.DUKE,
    label: "公爵",
    icon: Gem,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    highlight: true,
  },
  {
    key: ROLES.EMPEROR,
    label: "皇帝",
    icon: Crown,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
] as const

function BenefitRow({ label, values }: { label: string; values: (string | boolean)[] }) {
  return (
    <tr className="border-t border-border">
      <td className="py-2.5 pr-4 text-sm text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-2.5 text-center text-sm">
          {typeof v === "boolean" ? (
            v
              ? <Check className="w-4 h-4 text-green-500 mx-auto" />
              : <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
          ) : (
            <span className="font-medium">{v}</span>
          )}
        </td>
      ))}
    </tr>
  )
}

interface RoleBenefitsTableProps {
  compact?: boolean // 紧凑模式用于个人中心，完整模式用于首页
  upgradeUrlKnight?: string
  upgradeUrlDuke?: string
}

export function RoleBenefitsTable({ compact, upgradeUrlKnight, upgradeUrlDuke }: RoleBenefitsTableProps) {
  const { data: session } = useSession()
  const currentRole = session?.user?.roles?.[0]?.name ?? ROLES.CIVILIAN

  const limits = EMAIL_CONFIG.ROLE_LIMITS

  const rows = [
    { label: "邮箱数量", values: ["1 个", "10 个", "50 个", "无限制"] },
    { label: "永久邮箱", values: [false, "1 个", "5 个", "无限制"] },
    { label: "每日发件", values: [false, "2 封", "5 封", "无限制"] },
    { label: "Webhook", values: [false, false, true, true] },
    { label: "API Key", values: [false, false, true, true] },
    { label: "删除冷却", values: ["24h", "24h", false, false] },
  ]

  return (
    <div className={cn("w-full overflow-x-auto", compact && "text-sm")}>
      <table className="w-full min-w-[480px]">
        <thead>
          <tr>
            <th className="text-left pb-3 text-sm font-medium text-muted-foreground w-32">权益</th>
            {ROLE_CONFIGS.map(role => {
              const Icon = role.icon
              const isCurrent = role.key === currentRole
              return (
                <th key={role.key} className="pb-3 text-center">
                  <div className={cn(
                    "inline-flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg",
                    role.bg, role.border, "border",
                    isCurrent && "ring-2 ring-primary ring-offset-1"
                  )}>
                    <Icon className={cn("w-4 h-4", role.color)} />
                    <span className={cn("text-xs font-semibold", role.color)}>{role.label}</span>
                    {isCurrent && (
                      <span className="text-xs bg-primary text-primary-foreground px-1.5 rounded-full leading-tight">当前</span>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <BenefitRow key={row.label} label={row.label} values={row.values} />
          ))}
        </tbody>
      </table>

      {/* 升级按钮（仅对平民/骑士显示） */}
      {(currentRole === ROLES.CIVILIAN || currentRole === ROLES.KNIGHT) && (upgradeUrlKnight || upgradeUrlDuke) && (
        <div className={cn("mt-4 flex gap-3", compact ? "flex-col" : "flex-row flex-wrap")}>
          {currentRole === ROLES.CIVILIAN && upgradeUrlKnight && (
            <a
              href={upgradeUrlKnight}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              升级为骑士 →
            </a>
          )}
          {upgradeUrlDuke && (
            <a
              href={upgradeUrlDuke}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
            >
              升级为公爵 →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
