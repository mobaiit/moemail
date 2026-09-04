"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  type SiteStyle,
  STYLE_STORAGE_KEY,
  getInitialStyle,
  applyStyle,
} from "@/lib/style"

interface StyleContextValue {
  style: SiteStyle
  setStyle: (style: SiteStyle) => void
}

const StyleContext = createContext<StyleContextValue>({
  style: "default",
  setStyle: () => {},
})

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyleState] = useState<SiteStyle>("default")

  // 初始化：从 localStorage 读取并应用
  useEffect(() => {
    const initial = getInitialStyle()
    setStyleState(initial)
    applyStyle(initial)
  }, [])

  const setStyle = useCallback((newStyle: SiteStyle) => {
    setStyleState(newStyle)
    applyStyle(newStyle)
    localStorage.setItem(STYLE_STORAGE_KEY, newStyle)
  }, [])

  return (
    <StyleContext.Provider value={{ style, setStyle }}>
      {children}
    </StyleContext.Provider>
  )
}

export function useStyle() {
  return useContext(StyleContext)
}
