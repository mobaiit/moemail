"use client"

import { useState } from "react"
import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStyle } from "@/components/style/style-provider"
import { STYLES, STYLE_LABELS, type SiteStyle } from "@/lib/style"
import { cn } from "@/lib/utils"

export function StyleSwitcher() {
  const [open, setOpen] = useState(false)
  const { style, setStyle } = useStyle()

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
        title="切换风格"
      >
        <Palette className="h-5 w-5" />
        <span className="sr-only">切换风格</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>选择网站风格</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {STYLES.map((s) => {
              const info = STYLE_LABELS[s]
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
                  <span className="text-2xl leading-none">{info.icon}</span>
                  <span className="text-sm font-medium">{info.label}</span>
                  <span className="text-xs opacity-70">{info.desc}</span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
