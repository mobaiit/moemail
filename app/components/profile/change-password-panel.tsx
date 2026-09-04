"use client"

import { useState } from "react"
import { KeyRound, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function ChangePasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "请填写完整信息", variant: "destructive" })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: "新密码长度不能少于8位", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "两次输入的新密码不一致", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (!res.ok) throw new Error(data.error || "修改失败")

      toast({ title: "密码修改成功" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        title: "修改失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div className="flex items-center gap-2 mb-6">
        <KeyRound className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">修改密码</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">当前密码</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="请输入当前密码"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowCurrent((v) => !v)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">新密码</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少8位"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowNew((v) => !v)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">确认新密码</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "修改中..." : "确认修改"}
        </Button>
      </div>
    </div>
  )
}
