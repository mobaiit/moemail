"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import { RoleBenefitsTable } from "./role-benefits"
import type { RoleLimitsMap } from "@/hooks/use-config"

interface UpgradeConfig {
  upgradeUrlKnight?: string
  upgradeUrlDuke?: string
  roleLimits?: RoleLimitsMap
}

export function UpgradePanel() {
  const [config, setConfig] = useState<UpgradeConfig>({})

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json() as Promise<UpgradeConfig>)
      .then(data => setConfig({
        upgradeUrlKnight: data.upgradeUrlKnight,
        upgradeUrlDuke: data.upgradeUrlDuke,
        roleLimits: data.roleLimits,
      }))
      .catch(console.error)
  }, [])

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">我的权益</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        对比各角色权益，选择适合你的套餐，联系管理员完成升级。
      </p>
      <RoleBenefitsTable
        compact
        upgradeUrlKnight={config.upgradeUrlKnight}
        upgradeUrlDuke={config.upgradeUrlDuke}
        roleLimits={config.roleLimits}
      />
    </div>
  )
}
