/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, ChevronDown, ChevronUp } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { WebhookType } from "@/lib/webhook"

const WEBHOOK_TYPES: { value: WebhookType; label: string; desc: string }[] = [
  { value: "custom",   label: "自定义",   desc: "发送原始 JSON，适合自建服务" },
  { value: "wecom",    label: "企业微信", desc: "企业微信群机器人 Webhook" },
  { value: "dingtalk", label: "钉钉",     desc: "钉钉群自定义机器人 Webhook" },
]

export function WebhookConfig() {
  const t = useTranslations("profile.webhook")
  const tCommon = useTranslations("common.actions")
  const tMessages = useTranslations("emails.messages")
  const [enabled, setEnabled] = useState(false)
  const [url, setUrl] = useState("")
  const [type, setType] = useState<WebhookType>("custom")
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/webhook")
      .then(res => res.json() as Promise<{ enabled: boolean; url: string; type?: WebhookType }>)
      .then(data => {
        setEnabled(data.enabled)
        setUrl(data.url)
        setType(data.type || "custom")
      })
      .catch(console.error)
      .finally(() => setInitialLoading(false))
  }, [])

  const saveWebhook = async (overrides?: Partial<{ enabled: boolean; url: string; type: WebhookType }>) => {
    const payload = {
      url: overrides?.url ?? url,
      enabled: overrides?.enabled ?? enabled,
      type: overrides?.type ?? type,
    }
    if (!payload.url && payload.enabled) return
    setLoading(true)
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(t("saveFailed"))
      toast({ title: t("saveSuccess"), description: t("saveSuccess") })
    } catch (_error) {
      toast({ title: t("saveFailed"), description: t("saveFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Switch 切换时立即保存
  const handleToggle = async (val: boolean) => {
    setEnabled(val)
    await saveWebhook({ enabled: val })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    await saveWebhook()
  }

  const handleTest = async () => {
    if (!url) return
    setTesting(true)
    try {
      const res = await fetch("/api/webhook/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      })
      if (!res.ok) throw new Error(t("testFailed"))
      toast({ title: t("testSuccess"), description: t("testSuccess") })
    } catch (_error) {
      toast({ title: t("testFailed"), description: t("testFailed"), variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  const currentTypeInfo = WEBHOOK_TYPES.find(item => item.value === type)

  if (initialLoading) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">{tMessages("loading")}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 启用开关 */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t("enable")}</Label>
          <div className="text-sm text-muted-foreground">{t("description")}</div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {/* 配置区域：关闭时灰显保留内容 */}
      <div className={!enabled ? "opacity-50 pointer-events-none" : ""}>
        <div className="space-y-4">
          {/* 类型选择 */}
          <div className="space-y-2">
            <Label>Webhook 类型</Label>
            <Select value={type} onValueChange={(v) => setType(v as WebhookType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEBHOOK_TYPES.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground text-xs ml-2">{item.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentTypeInfo && (
              <p className="text-xs text-muted-foreground">{currentTypeInfo.desc}</p>
            )}
          </div>

          {/* URL 输入 */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url">{t("url")}</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                placeholder={
                  type === "wecom"
                    ? "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                    : type === "dingtalk"
                    ? "https://oapi.dingtalk.com/robot/send?access_token=..."
                    : t("urlPlaceholder")
                }
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
                required
              />
              <Button type="submit" disabled={loading} className="flex-shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : tCommon("save")}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTest}
                      disabled={testing || !url}
                    >
                      {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t("test")}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">{t("description2")}</p>
          </div>

          {/* 文档（仅自定义） */}
          {type === "custom" && (
            <div className="space-y-2">
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowDocs(!showDocs)}
              >
                {showDocs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {t("description3")}
              </button>
              {showDocs && (
                <div className="rounded-md bg-muted p-4 text-sm space-y-3">
                  <p>{t("docs.intro")}</p>
                  <pre className="bg-background p-2 rounded text-xs">
                    Content-Type: application/json{"\n"}
                    X-Webhook-Event: new_message
                  </pre>
                  <p>{t("docs.exampleBody")}</p>
                  <pre className="bg-background p-2 rounded text-xs overflow-auto">
                    {`{
  "emailId": "email-uuid",
  "messageId": "message-uuid",
  "fromAddress": "sender@example.com",
  "subject": "${t("docs.subject")}",
  "content": "${t("docs.content")}",
  "html": "${t("docs.html")}",
  "receivedAt": "2024-01-01T12:00:00.000Z",
  "toAddress": "your-email@example.com"
}`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 企微说明 */}
          {type === "wecom" && (
            <div className="rounded-md bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">企业微信机器人配置</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                <li>在企业微信群中添加「群机器人」</li>
                <li>复制机器人的 Webhook 地址填入上方</li>
                <li>收到邮件后将以 Markdown 格式推送到群</li>
              </ol>
            </div>
          )}

          {/* 钉钉说明 */}
          {type === "dingtalk" && (
            <div className="rounded-md bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">钉钉机器人配置</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                <li>在钉钉群中添加「自定义（Webhook）」机器人</li>
                <li>安全设置选择「自定义关键词」，填入「邮件」</li>
                <li>复制 Webhook 地址填入上方</li>
                <li>收到邮件后将以 Markdown 格式推送到群</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
