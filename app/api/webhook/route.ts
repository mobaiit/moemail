import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { webhooks } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

export const runtime = "edge"

const webhookSchema = z.object({
  url: z.string().url(),
  enabled: z.boolean(),
  type: z.enum(["custom", "wecom", "dingtalk"]).default("custom"),
})

export async function GET() {
  const session = await auth()

  const db = createDb()
  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.userId, session!.user!.id!)
  })

  return Response.json(webhook || { enabled: false, url: "", type: "custom" })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { url, enabled, type } = webhookSchema.parse(body)

    const db = createDb()
    const now = new Date()

    const existingWebhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.userId, session.user.id)
    })

    if (existingWebhook) {
      await db
        .update(webhooks)
        .set({ url, enabled, type, updatedAt: now })
        .where(eq(webhooks.userId, session.user.id))
    } else {
      await db
        .insert(webhooks)
        .values({ userId: session.user.id, url, enabled, type })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to save webhook:", error)
    return Response.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}
