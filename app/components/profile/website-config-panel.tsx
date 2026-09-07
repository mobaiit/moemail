"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { Role, ROLES } from "@/lib/permissions"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EMAIL_CONFIG } from "@/config"
import { STYLES, STYLE_ICONS, type SiteStyle } from "@/lib/style"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface RoleLimitForm {
  maxEmails: number
  maxPermanentEmails: number
  dailySendLimit: number
}

const DEFAULT_LIMITS = {
  civilian: {
    maxEmails:          EMAIL_CONFIG.ROLE_LIMITS.civilian.maxEmails,
    maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.civilian.maxPermanentEmails,
    dailySendLimit:     EMAIL_CONFIG.ROLE_LIMITS.civilian.dailySendLimit,
  },
  knight: {
    maxEmails:          EMAIL_CONFIG.ROLE_LIMITS.knight.maxEmails,
    maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.knight.maxPermanentEmails,
    dailySendLimit:     EMAIL_CONFIG.ROLE_LIMITS.knight.dailySendLimit,
  },
  duke: {
    maxEmails:          EMAIL_CONFIG.ROLE_LIMITS.duke.maxEmails,
    maxPermanentEmails: EMAIL_CONFIG.ROLE_LIMITS.duke.maxPermanentEmails,
    dailySendLimit:     EMAIL_CONFIG.ROLE_LIMITS.duke.dailySendLimit,
  },
}

function RoleLimitRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <Input
        type="number"
        min="-1"
        className="h-8 text-sm w-24"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function WebsiteConfigPanel() {
  const t = useTranslations("profile.website")
  const tCard = useTranslations("profile.card")
  const tStyle = useTranslations("common.style")
  const [defaultRole, setDefaultRole] = useState<string>("")
  const [emailDomains, setEmailDomains] = useState<string>("")
  const [adminContact, setAdminContact] = useState<string>("")
  const [siteStyle, setSiteStyle] = useState<SiteStyle>("default")
  const [upgradeUrlKnight, setUpgradeUrlKnight] = useState("")
  const [upgradeUrlDuke, setUpgradeUrlDuke] = useState("")
  const [roleLimits, setRoleLimits] = useState<typeof DEFAULT_LIMITS>(DEFAULT_LIMITS)
  const [turnstileEnabled, setTurnstileEnabled] = useState(false)
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("")
  const [turnstileSecretKey, setTurnstileSecretKey] = useState("")
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => { fetchConfig() }, [])

  const fetchConfig = async () => {
    const res = await fetch("/api/config")
    if (!res.ok) return
    const data = await res.json() as {
      defaultRole: Exclude<Role, typeof ROLES.EMPEROR>
      emailDomains: string
      adminContact: string
      siteStyle: string
      upgradeUrlKnight?: string
      upgradeUrlDuke?: string
      roleLimits?: typeof DEFAULT_LIMITS
      turnstile?: { enabled: boolean; siteKey: string; secretKey?: string }
    }
    setDefaultRole(data.defaultRole)
    setEmailDomains(data.emailDomains)
    setAdminContact(data.adminContact)
    setSiteStyle((data.siteStyle as SiteStyle) || "default")
    setUpgradeUrlKnight(data.upgradeUrlKnight ?? "")
    setUpgradeUrlDuke(data.upgradeUrlDuke ?? "")
    if (data.roleLimits) {
      setRoleLimits({
        civilian: { ...DEFAULT_LIMITS.civilian, ...data.roleLimits.civilian },
        knight:   { ...DEFAULT_LIMITS.knight,   ...data.roleLimits.knight   },
        duke:     { ...DEFAULT_LIMITS.duke,     ...data.roleLimits.duke     },
      })
    }
    setTurnstileEnabled(Boolean(data.turnstile?.enabled))
    setTurnstileSiteKey(data.turnstile?.siteKey ?? "")
    setTurnstileSecretKey(data.turnstile?.secretKey ?? "")
  }

  const updateLimit = (
    role: keyof typeof DEFAULT_LIMITS,
    field: keyof RoleLimitForm,
    value: number
  ) => {
    setRoleLimits(prev => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultRole,
          emailDomains,
          adminContact,
          siteStyle,
          upgradeUrlKnight,
          upgradeUrlDuke,
          roleLimits,
          turnstile: {
            enabled: turnstileEnabled,
            siteKey: turnstileSiteKey,
            secretKey: turnstileSecretKey,
          },
        }),
      })

      if (!res.ok) throw new Error(t("saveFailed"))

      toast({ title: t("saveSuccess"), description: t("saveSuccess") })
      router.refresh()
      window.location.reload()
    } catch (error) {
      toast({
        title: t("saveFailed"),
        description: error instanceof Error ? error.message : t("saveFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      <div className="space-y-4">
        {/* 基础配置 */}
        <div className="flex items-center gap-4">
          <span className="text-sm">{t("defaultRole")}:</span>
          <Select value={defaultRole} onValueChange={setDefaultRole}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ROLES.DUKE}>{tCard("roles.DUKE")}</SelectItem>
              <SelectItem value={ROLES.KNIGHT}>{tCard("roles.KNIGHT")}</SelectItem>
              <SelectItem value={ROLES.CIVILIAN}>{tCard("roles.CIVILIAN")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm">{t("emailDomains")}:</span>
          <div className="flex-1">
            <Input value={emailDomains} onChange={e => setEmailDomains(e.target.value)} placeholder={t("emailDomainsPlaceholder")} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm">{t("adminContact")}:</span>
          <div className="flex-1">
            <Input value={adminContact} onChange={e => setAdminContact(e.target.value)} placeholder={t("adminContactPlaceholder")} />
          </div>
        </div>

        {/* 角色权益配置 */}
        <div className="rounded-lg border border-dashed border-primary/40 p-4 space-y-4">
          <div>
            <Label className="text-sm font-medium">{t("roleLimitsConfig.title")}</Label>
            <p className="text-xs text-muted-foreground mt-1">{t("roleLimitsConfig.hint")}</p>
          </div>

          {(["civilian", "knight", "duke"] as const).map(role => {
            const roleLabel = t(`roleLimitsConfig.roles.${role}` as `roleLimitsConfig.roles.civilian`)
            return (
              <div key={role} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{roleLabel}</p>
                <div className="space-y-1.5 pl-2">
                  <RoleLimitRow
                    label={t("roleLimitsConfig.maxEmails")}
                    value={roleLimits[role].maxEmails}
                    onChange={v => updateLimit(role, "maxEmails", v)}
                    hint={t("roleLimitsConfig.countHint")}
                  />
                  <RoleLimitRow
                    label={t("roleLimitsConfig.maxPermanentEmails")}
                    value={roleLimits[role].maxPermanentEmails}
                    onChange={v => updateLimit(role, "maxPermanentEmails", v)}
                    hint={t("roleLimitsConfig.permanentHint")}
                  />
                  <RoleLimitRow
                    label={t("roleLimitsConfig.dailySendLimit")}
                    value={roleLimits[role].dailySendLimit}
                    onChange={v => updateLimit(role, "dailySendLimit", v)}
                    hint={t("roleLimitsConfig.sendHint")}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* 升级地址 */}
        <div className="rounded-lg border border-dashed border-primary/40 p-4 space-y-3">
          <div>
            <Label className="text-sm font-medium">{t("upgradeUrlConfig.title")}</Label>
            <p className="text-xs text-muted-foreground mt-1">{t("upgradeUrlConfig.hint")}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 shrink-0">{t("upgradeUrlConfig.knightLabel")}</span>
              <Input value={upgradeUrlKnight} onChange={e => setUpgradeUrlKnight(e.target.value)} placeholder="https://..." type="url" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 shrink-0">{t("upgradeUrlConfig.dukeLabel")}</span>
              <Input value={upgradeUrlDuke} onChange={e => setUpgradeUrlDuke(e.target.value)} placeholder="https://..." type="url" />
            </div>
          </div>
        </div>

        {/* 网站风格 */}
        <div className="rounded-lg border border-dashed border-primary/40 p-4 space-y-2">
          <Label className="text-sm font-medium">{t("siteStyle.title")}</Label>
          <p className="text-xs text-muted-foreground">{t("siteStyle.hint")}</p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {STYLES.map(s => {
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSiteStyle(s)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all hover:bg-accent text-center",
                    siteStyle === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  <span className="text-xl leading-none">{STYLE_ICONS[s]}</span>
                  <span className="text-xs font-medium">{tStyle(`${s}.label` as `default.label` | `pixel.label`)}</span>
                  <span className="text-xs opacity-60">{tStyle(`${s}.desc` as `default.desc` | `pixel.desc`)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Turnstile */}
        <div className="rounded-lg border border-dashed border-primary/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="turnstile-enabled" className="text-sm font-medium">{t("turnstile.enable")}</Label>
              <p className="text-xs text-muted-foreground">{t("turnstile.enableDescription")}</p>
            </div>
            <Switch id="turnstile-enabled" checked={turnstileEnabled} onCheckedChange={setTurnstileEnabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="turnstile-site-key" className="text-sm font-medium">{t("turnstile.siteKey")}</Label>
            <Input id="turnstile-site-key" value={turnstileSiteKey} onChange={e => setTurnstileSiteKey(e.target.value)} placeholder={t("turnstile.siteKeyPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="turnstile-secret-key" className="text-sm font-medium">{t("turnstile.secretKey")}</Label>
            <div className="relative">
              <Input
                id="turnstile-secret-key"
                type={showSecretKey ? "text" : "password"}
                value={turnstileSecretKey}
                onChange={e => setTurnstileSecretKey(e.target.value)}
                placeholder={t("turnstile.secretKeyPlaceholder")}
              />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowSecretKey(p => !p)}>
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("turnstile.secretKeyDescription")}</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {t("save")}
        </Button>
      </div>
    </div>
  )
}
