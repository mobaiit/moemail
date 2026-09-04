export const STYLES = ["default", "pixel", "cyber"] as const
export type SiteStyle = (typeof STYLES)[number]

export const STYLE_LABELS: Record<SiteStyle, { label: string; desc: string; icon: string }> = {
  default: { label: "默认", desc: "简约圆润", icon: "✦" },
  pixel:   { label: "像素", desc: "复古方块", icon: "⊞" },
  cyber:   { label: "赛博", desc: "霓虹朋克", icon: "⚡" },
}

export const STYLE_STORAGE_KEY = "moemail-site-style"

export function getInitialStyle(): SiteStyle {
  if (typeof window === "undefined") return "default"
  const stored = localStorage.getItem(STYLE_STORAGE_KEY) as SiteStyle | null
  return stored && STYLES.includes(stored) ? stored : "default"
}

export function applyStyle(style: SiteStyle) {
  const html = document.documentElement
  if (style === "default") {
    html.removeAttribute("data-style")
  } else {
    html.setAttribute("data-style", style)
  }
}
