import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { createDb } from "@/lib/db"
import { emails } from "@/lib/schema"
import { eq, and, gt, sql, count, isNull } from "drizzle-orm"
import { EXPIRY_OPTIONS } from "@/types/email"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { getUserId } from "@/lib/apiKey"
import { getUserRole } from "@/lib/auth"
import { ROLES } from "@/lib/permissions"
import { getRoleLimitByName } from "@/lib/role-limits"

export const runtime = "edge"

const PERMANENT_EXPIRES = new Date('9999-01-01T00:00:00.000Z')
const COOLDOWN_MS = 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  const db = createDb()
  const env = getRequestContext().env

  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const userRole = await getUserRole(userId)
  const roleLimits = await getRoleLimitByName(userRole ?? "civilian")
  const needCooldown = userRole === ROLES.CIVILIAN || userRole === ROLES.KNIGHT

  try {
    // 冷却期校验（平民/骑士）
    if (needCooldown) {
      const lastDeleted = await db.query.emails.findFirst({
        where: and(
          eq(emails.userId, userId),
          sql`${emails.deletedAt} IS NOT NULL`
        ),
        orderBy: (emails, { desc }) => [desc(emails.deletedAt)],
      })

      if (lastDeleted?.deletedAt) {
        const elapsed = Date.now() - lastDeleted.deletedAt.getTime()
        if (elapsed < COOLDOWN_MS) {
          const remainingHours = Math.ceil((COOLDOWN_MS - elapsed) / (1000 * 60 * 60))
          return NextResponse.json(
            { error: `删除冷却中，还需等待 ${remainingHours} 小时后才能创建新邮箱`, cooldownRemaining: COOLDOWN_MS - elapsed },
            { status: 403 }
          )
        }
      }
    }
    const { name, expiryTime, domain } = await request.json<{
      name: string
      expiryTime: number
      domain: string
    }>()

    if (!EXPIRY_OPTIONS.some(option => option.value === expiryTime)) {
      return NextResponse.json({ error: "无效的过期时间" }, { status: 400 })
    }

    const isPermanent = expiryTime === 0

    // 1. 检查是否允许创建永久邮箱
    if (isPermanent && !roleLimits.allowPermanentEmail) {
      return NextResponse.json(
        { error: "您的角色不允许创建永久邮箱" },
        { status: 403 }
      )
    }

    // 2. 检查活跃邮箱总数（皇帝不限制）
    if (userRole !== ROLES.EMPEROR && roleLimits.maxEmails > 0) {
      const [activeCount] = await db
        .select({ count: count() })
        .from(emails)
        .where(and(
          eq(emails.userId, userId),
          gt(emails.expiresAt, new Date()),
          isNull(emails.deletedAt)
        ))

      if (Number(activeCount.count) >= roleLimits.maxEmails) {
        return NextResponse.json(
          { error: `已达到邮箱数量上限（${roleLimits.maxEmails} 个）` },
          { status: 403 }
        )
      }
    }

    // 3. 检查永久邮箱数量上限（皇帝不限制）
    if (isPermanent && userRole !== ROLES.EMPEROR && roleLimits.maxPermanentEmails > 0) {
      const [permanentCount] = await db
        .select({ count: count() })
        .from(emails)
        .where(and(
          eq(emails.userId, userId),
          eq(emails.expiresAt, PERMANENT_EXPIRES),
          isNull(emails.deletedAt)
        ))

      if (Number(permanentCount.count) >= roleLimits.maxPermanentEmails) {
        return NextResponse.json(
          { error: `已达到永久邮箱数量上限（${roleLimits.maxPermanentEmails} 个）` },
          { status: 403 }
        )
      }
    }

    // 4. 校验域名
    const domainString = await env.SITE_CONFIG.get("EMAIL_DOMAINS")
    const domains = domainString ? domainString.split(',') : ["moemail.app"]

    if (!domains.includes(domain)) {
      return NextResponse.json({ error: "无效的域名" }, { status: 400 })
    }

    // 5. 检查地址是否已存在
    const address = `${name || nanoid(8)}@${domain}`
    const existingEmail = await db.query.emails.findFirst({
      where: eq(sql`LOWER(${emails.address})`, address.toLowerCase())
    })

    if (existingEmail) {
      return NextResponse.json({ error: "该邮箱地址已被使用" }, { status: 409 })
    }

    // 6. 创建邮箱
    const now = new Date()
    const expiresAt = isPermanent
      ? PERMANENT_EXPIRES
      : new Date(now.getTime() + expiryTime)

    const result = await db.insert(emails)
      .values({
        address,
        createdAt: now,
        expiresAt,
        userId,
      })
      .returning({ id: emails.id, address: emails.address })

    return NextResponse.json({
      id: result[0].id,
      email: result[0].address,
    })
  } catch (error) {
    console.error('Failed to generate email:', error)
    return NextResponse.json({ error: "创建邮箱失败" }, { status: 500 })
  }
}
