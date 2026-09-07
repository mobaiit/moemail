"use client"

import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { AlertTriangle, X } from "lucide-react"
import { useState } from "react"
import { ROLES } from "@/lib/permissions"

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export function RoleExpiryBanner() {
  const { data: session } = useSession()
  const locale = useLocale()
  const t = useTranslations("common.expiryBanner")
  const tRoles = useTranslations("profile.card.roles")
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !session?.user?.roleExpiresAt) return null

  const expiresAt = new Date(session.user.roleExpiresAt)
  const now = new Date()
  const remaining = expiresAt.getTime() - now.getTime()

  if (remaining <= 0 || remaining > THREE_DAYS_MS) return null

  const roleName = session.user.roles?.[0]?.name
  if (!roleName || roleName === ROLES.CIVILIAN || roleName === ROLES.EMPEROR) return null

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const timeStr = days > 0 ? t("days", { days, hours }) : t("hours", { hours })

  const roleKey = roleName.toUpperCase() as "DUKE" | "KNIGHT"
  const label = tRoles(roleKey)
  const expiryDateStr = expiresAt.toLocaleDateString(locale)

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800">
      <div className="container mx-auto px-4 py-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
          {t.rich("message", {
            role: label,
            date: expiryDateStr,
            time: timeStr,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <a
          href={`/${locale}/profile`}
          className="text-xs text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:opacity-80 shrink-0"
        >
          {t("viewDetails")}
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 dark:text-amber-400 hover:opacity-70 shrink-0"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
