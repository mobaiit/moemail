"use client"

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Zap, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Config {
  enabled: boolean
  apiKey: string
}

export function EmailServiceConfig() {
  const t = useTranslations("profile.emailService")
  const [config, setConfig] = useState<Config>({ enabled: false, apiKey: "" })
  const [loading, setLoading] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/config/email-service")
      .then(r => r.json() as Promise<Config>)
      .then(data => setConfig(data))
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config/email-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error || t("saveFailed"))
      }

      toast({ title: t("saveSuccess"), description: t("saveSuccess") })
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
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("title")}</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-enabled" className="text-sm font-medium">{t("enable")}</Label>
            <p className="text-xs text-muted-foreground">{t("enableDescription")}</p>
          </div>
          <Switch
            id="email-enabled"
            checked={config.enabled}
            onCheckedChange={checked => setConfig(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        {config.enabled && (
          <div className="space-y-2">
            <Label htmlFor="email-apiKey" className="text-sm font-medium">{t("apiKey")}</Label>
            <div className="relative">
              <Input
                id="email-apiKey"
                type={showToken ? "text" : "password"}
                value={config.apiKey}
                onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={t("apiKeyPlaceholder")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowToken(p => !p)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
