import { NextResponse } from "next/server"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { checkPermission } from "@/lib/auth"
import { PERMISSIONS } from "@/lib/permissions"

export const runtime = "edge"

export async function GET() {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const env = getRequestContext().env
    const [enabled, apiKey] = await Promise.all([
      env.SITE_CONFIG.get("EMAIL_SERVICE_ENABLED"),
      env.SITE_CONFIG.get("RESEND_API_KEY"),
    ])

    return NextResponse.json({
      enabled: enabled === "true",
      apiKey: apiKey || "",
    })
  } catch (error) {
    console.error("Failed to get email service config:", error)
    return NextResponse.json({ error: "获取 Resend 发件服务配置失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const canAccess = await checkPermission(PERMISSIONS.MANAGE_CONFIG)
  if (!canAccess) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 })
  }

  try {
    const config = await request.json() as { enabled: boolean; apiKey: string }

    if (config.enabled && !config.apiKey) {
      return NextResponse.json({ error: "启用 Resend 时，API Key 为必填项" }, { status: 400 })
    }

    const env = getRequestContext().env
    await Promise.all([
      env.SITE_CONFIG.put("EMAIL_SERVICE_ENABLED", config.enabled.toString()),
      env.SITE_CONFIG.put("RESEND_API_KEY", config.apiKey),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save email service config:", error)
    return NextResponse.json({ error: "保存 Resend 发件服务配置失败" }, { status: 500 })
  }
}
