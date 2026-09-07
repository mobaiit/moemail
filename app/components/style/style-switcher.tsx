"use client"

import { useState } from "react"
import { Palette } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStyle } from "@/components/style/style-provider"
import { STYLES, STYLE_ICONS, type SiteStyle } from "@/lib/style"
import { cn } from "@/lib/utils"

export function StyleSwitcher() {
  const [open, setOpen] = useState(false)
  const { style, setStyle } = useStyle()
  const t = useTranslations("common.style")

  const handleSelect = (s: SiteStyle) => {
    setStyle(s)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="rounded-full"
        title={t("toggle")}
      >
        <Palette className="h-5 w-5" />
        <span className="sr-only">{t("toggle")}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {STYLES.map((s) => {
              const isActive = style === s
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  <span className="text-2xl leading-none">{STYLE_ICONS[s]}</span>
                  <span className="text-sm font-medium">{t(`${s}.label` as `default.label` | `pixel.label`)}</span>
                  <span className="text-xs opacity-70">{t(`${s}.desc` as `default.desc` | `pixel.desc`)}</span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
