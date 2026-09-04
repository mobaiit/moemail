"use client"

import { SignButton } from "@/components/auth/sign-button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Logo } from "@/components/ui/logo"
import { Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useState } from "react"

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto h-full px-4">
        <div className="h-full flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-y-4 gap-x-3 sm:gap-x-4">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">联系站长</span>
            </button>
            <LanguageSwitcher />
            <ThemeToggle />
            <SignButton />
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>访问提示</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            你没有权限使用该网站，如有需要，请联系网站管理员
            <br /><br />
            管理员联系方式：
            <a
              href="mailto:luri@luri.cc.cd"
              className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
            >
              luri@luri.cc.cd
            </a>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </header>
  )
}
