"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { CreateDialog } from "./create-dialog"
import { ShareDialog } from "./share-dialog"
import { Mail, RefreshCw, Trash2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useThrottle } from "@/hooks/use-throttle"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ROLES } from "@/lib/permissions"
import { useUserRole } from "@/hooks/use-user-role"
import { EMAIL_CONFIG, RoleName } from "@/config"

interface Email {
  id: string
  address: string
  createdAt: number
  expiresAt: number
}

interface CooldownInfo {
  inCooldown: boolean
  remainingMs: number
}

interface EmailListProps {
  onEmailSelect: (email: Email | null) => void
  selectedEmailId?: string
}

interface EmailResponse {
  emails: Email[]
  nextCursor: string | null
  total: number
  cooldown: CooldownInfo | null
}

function formatRemainingTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`
  return `${minutes} 分钟`
}

export function EmailList({ onEmailSelect, selectedEmailId }: EmailListProps) {
  const { data: session } = useSession()
  const { role } = useUserRole()
  const t = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")

  const roleName = (role ?? "civilian") as RoleName
  const roleMaxEmails = EMAIL_CONFIG.ROLE_LIMITS[roleName]?.maxEmails ?? 1
  const needCooldown = role === ROLES.CIVILIAN || role === ROLES.KNIGHT

  const [emailList, setEmailList] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [cooldown, setCooldown] = useState<CooldownInfo | null>(null)
  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null)
  const { toast } = useToast()

  const fetchEmails = async (cursor?: string) => {
    try {
      const url = new URL("/api/emails", window.location.origin)
      if (cursor) url.searchParams.set('cursor', cursor)
      const response = await fetch(url)
      const data = await response.json() as EmailResponse

      if (data.cooldown !== undefined) setCooldown(data.cooldown)

      if (!cursor) {
        const newEmails = data.emails
        const oldEmails = emailList
        const lastDuplicateIndex = newEmails.findIndex(
          e => oldEmails.some(o => o.id === e.id)
        )
        if (lastDuplicateIndex === -1) {
          setEmailList(newEmails)
          setNextCursor(data.nextCursor)
          setTotal(data.total)
          return
        }
        const uniqueNew = newEmails.slice(0, lastDuplicateIndex)
        setEmailList([...uniqueNew, ...oldEmails])
        setTotal(data.total)
        return
      }
      setEmailList(prev => [...prev, ...data.emails])
      setNextCursor(data.nextCursor)
      setTotal(data.total)
    } catch (error) {
      console.error("Failed to fetch emails:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchEmails()
  }

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    if (loadingMore) return
    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && nextCursor) {
      setLoadingMore(true)
      fetchEmails(nextCursor)
    }
  }, 200)

  useEffect(() => {
    if (session) fetchEmails()
  }, [session])

  const handleDelete = async (email: Email) => {
    try {
      const response = await fetch(`/api/emails/${email.id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json() as { error: string }
        toast({ title: t("error"), description: data.error, variant: "destructive" })
        return
      }

      setEmailList(prev => prev.filter(e => e.id !== email.id))
      setTotal(prev => prev - 1)

      if (needCooldown) {
        // 软删除：更新冷却状态
        setCooldown({ inCooldown: true, remainingMs: 24 * 60 * 60 * 1000 })
        toast({ title: t("success"), description: `邮箱已删除，24 小时内无法创建新邮箱` })
      } else {
        toast({ title: t("success"), description: t("deleteSuccess") })
      }

      if (selectedEmailId === email.id) onEmailSelect(null)
    } catch {
      toast({ title: t("error"), description: t("deleteFailed"), variant: "destructive" })
    } finally {
      setEmailToDelete(null)
    }
  }

  if (!session) return null

  const isCooling = needCooldown && cooldown?.inCooldown

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-2 flex justify-between items-center border-b border-primary/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn("h-8 w-8", refreshing && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500">
              {role === ROLES.EMPEROR
                ? t("emailCountUnlimited", { count: total })
                : t("emailCount", { count: total, max: roleMaxEmails })}
            </span>
          </div>

          {isCooling ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
              <Clock className="h-3.5 w-3.5" />
              <span>冷却中，还剩 {formatRemainingTime(cooldown!.remainingMs)}</span>
            </div>
          ) : (
            <CreateDialog onEmailCreated={handleRefresh} />
          )}
        </div>

        <div className="flex-1 overflow-auto p-2" onScroll={handleScroll}>
          {loading ? (
            <div className="text-center text-sm text-gray-500">{t("loading")}</div>
          ) : emailList.length > 0 ? (
            <div className="space-y-1">
              {emailList.map(email => (
                <div
                  key={email.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded cursor-pointer text-sm group",
                    "hover:bg-primary/5",
                    selectedEmailId === email.id && "bg-primary/10"
                  )}
                  onClick={() => onEmailSelect(email)}
                >
                  <Mail className="h-4 w-4 text-primary/60" />
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{email.address}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(email.expiresAt).getFullYear() === 9999
                        ? t("permanent")
                        : `${t("expiresAt")}: ${new Date(email.expiresAt).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <ShareDialog emailId={email.id} emailAddress={email.address} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); setEmailToDelete(email) }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {loadingMore && (
                <div className="text-center text-sm text-gray-500 py-2">{t("loadingMore")}</div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">{t("noEmails")}</div>
          )}
        </div>
      </div>

      {/* 删除确认弹窗 - 根据角色区分强弱提醒 */}
      <AlertDialog open={!!emailToDelete} onOpenChange={() => setEmailToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={needCooldown ? "text-destructive" : ""}>
              {needCooldown ? "⚠️ 删除邮箱（冷却警告）" : t("deleteConfirm")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>{t("deleteDescription", { email: emailToDelete?.address || "" })}</p>
                {needCooldown && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive font-medium">
                    ⚠️ 注意：删除后 <strong>24 小时内</strong>无法创建新邮箱，请谨慎操作！
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => emailToDelete && handleDelete(emailToDelete)}
            >
              {needCooldown ? "确认删除（我已了解冷却限制）" : tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
