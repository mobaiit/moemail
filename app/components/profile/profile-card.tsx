"use client"

import { User } from "next-auth"
import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Github, Crown, Sword, User2, Gem, Mail, TrendingUp, Settings, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { WebhookConfig } from "./webhook-config"
import { PromotePanel } from "./promote-panel"
import { EmailServiceConfig } from "./email-service-config"
import { useRolePermission } from "@/hooks/use-role-permission"
import { PERMISSIONS, ROLES } from "@/lib/permissions"
import { WebsiteConfigPanel } from "./website-config-panel"
import { ApiKeyPanel } from "./api-key-panel"
import { ChangePasswordPanel } from "./change-password-panel"
import { UpgradePanel } from "./upgrade-panel"
import { useUserRole } from "@/hooks/use-user-role"

interface ProfileCardProps {
  user: User
}

const roleConfigs = {
  emperor: { key: 'EMPEROR', icon: Crown },
  duke:    { key: 'DUKE',    icon: Gem   },
  knight:  { key: 'KNIGHT',  icon: Sword },
  civilian:{ key: 'CIVILIAN',icon: User2 },
} as const

const providerConfigs = {
  google: {
    label: "Google",
    className: "text-red-500 bg-red-500/10",
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg viewBox="0 0 24 24" {...props}>
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  github: {
    label: "GitHub",
    className: "text-primary bg-primary/10",
    icon: Github,
  },
} as const

export function ProfileCard({ user }: ProfileCardProps) {
  const t = useTranslations("profile.card")
  const tAuth = useTranslations("auth.signButton")
  const tWebhook = useTranslations("profile.webhook")
  const tNav = useTranslations("common.nav")
  const tTabs = useTranslations("profile.tabs")
  const locale = useLocale()
  const router = useRouter()
  const { checkPermission } = useRolePermission()
  const { role } = useUserRole()

  const canManageWebhook = checkPermission(PERMISSIONS.MANAGE_WEBHOOK)
  const canManageApiKey = checkPermission(PERMISSIONS.MANAGE_API_KEY)
  const isEmperor = role === ROLES.EMPEROR

  // 账号设置 tab 是否有内容
  const hasAccountSettings = canManageWebhook || canManageApiKey || (user.providers && user.providers.length === 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 用户资料卡片 */}
      <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || tAuth("userAvatar")}
                width={72}
                height={72}
                className="rounded-full ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-primary/10 flex items-center justify-center">
                <User2 className="w-8 h-8 text-primary/60" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold truncate">{user.name}</h2>
              {!!user?.providers?.length && (
                <div className="flex gap-2">
                  {user.providers.map(provider => {
                    const config = providerConfigs[provider as keyof typeof providerConfigs]
                    if (!config) return null
                    const Icon = config.icon
                    return (
                      <div key={provider} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${config.className}`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {user.email || `${t("name")}: ${user.username}`}
            </p>
            {user.roles && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {user.roles.map(({ name }) => {
                  const rc = roleConfigs[name as keyof typeof roleConfigs]
                  if (!rc) return null
                  const Icon = rc.icon
                  const roleName = t(`roles.${rc.key}` as Parameters<typeof t>[0])
                  return (
                    <div key={name} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded" title={roleName}>
                      <Icon className="w-3 h-3" />
                      {roleName}
                    </div>
                  )
                })}
                {user.roleExpiresAt && role !== ROLES.CIVILIAN && role !== ROLES.EMPEROR && (
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded border border-border">
                    {t("roleExpiresAt")}：{new Date(user.roleExpiresAt).toLocaleDateString(locale)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab 区域 */}
      <Tabs defaultValue="benefits" className="w-full">
        <TabsList className={`w-full ${isEmperor ? "grid-cols-3" : "grid-cols-2"} grid h-auto p-1`}>
          <TabsTrigger value="benefits" className="flex items-center gap-1.5 py-2">
            <TrendingUp className="w-4 h-4" />
            <span>{tTabs("benefits")}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5 py-2">
            <Settings className="w-4 h-4" />
            <span>{tTabs("settings")}</span>
          </TabsTrigger>
          {isEmperor && (
            <TabsTrigger value="admin" className="flex items-center gap-1.5 py-2">
              <Shield className="w-4 h-4" />
              <span>{tTabs("admin")}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* 我的权益 */}
        <TabsContent value="benefits" className="space-y-4 mt-4">
          <UpgradePanel />
        </TabsContent>

        {/* 账号设置 */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {canManageWebhook && (
            <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">{tWebhook("title")}</h2>
              </div>
              <WebhookConfig />
            </div>
          )}
          {canManageApiKey && <ApiKeyPanel />}
          {user.providers && user.providers.length === 0 && <ChangePasswordPanel />}
          {!hasAccountSettings && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {tTabs("noSettings")}
            </div>
          )}
        </TabsContent>

        {/* 管理后台（仅皇帝） */}
        {isEmperor && (
          <TabsContent value="admin" className="space-y-4 mt-4">
            <WebsiteConfigPanel />
            <EmailServiceConfig />
            <PromotePanel />
          </TabsContent>
        )}
      </Tabs>

      {/* 底部操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 px-1">
        <Button onClick={() => router.push(`/${locale}/moe`)} className="gap-2 flex-1">
          <Mail className="w-4 h-4" />
          {tNav("backToMailbox")}
        </Button>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: `/${locale}` })} className="flex-1">
          {tAuth("logout")}
        </Button>
      </div>
    </div>
  )
}
