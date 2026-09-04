"use client"

import { SignButton } from "@/components/auth/sign-button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Logo } from "@/components/ui/logo"
import { Mail, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useTranslations } from "next-intl"

const ADMIN_EMAIL = "luri@luri.cc.cd"

export function Header() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const t = useTranslations("common.contact")

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(ADMIN_EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
              <span className="hidden sm:inline">{t("button")}</span>
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
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {t("description")}
          </DialogDescription>
          <p className="text-sm text-muted-foreground">
            {t("adminContact")}
            <button
              onClick={handleCopyEmail}
              title={t("copied")}
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">{t("copied")}</span>
                </>
              ) : (
                ADMIN_EMAIL
              )}
            </button>
          </p>
        </DialogContent>
      </Dialog>
    </header>
  )
}
