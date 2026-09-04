import { SignButton } from "@/components/auth/sign-button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { Logo } from "@/components/ui/logo"
import { Mail } from "lucide-react"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto h-full px-4">
        <div className="h-full flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-y-4 gap-x-3 sm:gap-x-4">
            <a
              href="mailto:luri@luri.cc.cd"
              title="联系站长"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">联系站长</span>
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
            <SignButton />
          </div>
        </div>
      </div>
    </header>
  )
} 