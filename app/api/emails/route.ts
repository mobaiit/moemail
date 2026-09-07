import { createDb } from "@/lib/db"
import { and, eq, gt, lt, or, sql, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails, userRoles, roles } from "@/lib/schema"
import { encodeCursor, decodeCursor } from "@/lib/cursor"
import { getUserId } from "@/lib/apiKey"
import { ROLES } from "@/lib/permissions"

export const runtime = "edge"

const PAGE_SIZE = 20
const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 小时

export async function GET(request: Request) {
  const userId = await getUserId()

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  
  const db = createDb()

  try {
    // 查询冷却状态（平民/骑士）
    const userRoleRecord = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId!))
      .get()

    const roleName = userRoleRecord?.roleName ?? ROLES.CIVILIAN
    const needCooldown = roleName === ROLES.CIVILIAN || roleName === ROLES.KNIGHT

    let cooldownInfo: { inCooldown: boolean; remainingMs: number } | null = null

    if (needCooldown) {
      // 查找最近一次软删除时间
      const lastDeleted = await db.query.emails.findFirst({
        where: and(
          eq(emails.userId, userId!),
          sql`${emails.deletedAt} IS NOT NULL`
        ),
        orderBy: (emails, { desc }) => [desc(emails.deletedAt)],
      })

      if (lastDeleted?.deletedAt) {
        const elapsed = Date.now() - lastDeleted.deletedAt.getTime()
        if (elapsed < COOLDOWN_MS) {
          cooldownInfo = {
            inCooldown: true,
            remainingMs: COOLDOWN_MS - elapsed,
          }
        } else {
          cooldownInfo = { inCooldown: false, remainingMs: 0 }
        }
      } else {
        cooldownInfo = { inCooldown: false, remainingMs: 0 }
      }
    }

    const baseConditions = and(
      eq(emails.userId, userId!),
      gt(emails.expiresAt, new Date()),
      isNull(emails.deletedAt)
    )

    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(baseConditions)
    const totalCount = Number(totalResult[0].count)

    const conditions = [baseConditions]

    if (cursor) {
      const { timestamp, id } = decodeCursor(cursor)
      conditions.push(
        or(
          lt(emails.createdAt, new Date(timestamp)),
          and(
            eq(emails.createdAt, new Date(timestamp)),
            lt(emails.id, id)
          )
        )
      )
    }

    const results = await db.query.emails.findMany({
      where: and(...conditions),
      orderBy: (emails, { desc }) => [
        desc(emails.createdAt),
        desc(emails.id)
      ],
      limit: PAGE_SIZE + 1
    })
    
    const hasMore = results.length > PAGE_SIZE
    const nextCursor = hasMore 
      ? encodeCursor(
          results[PAGE_SIZE - 1].createdAt.getTime(),
          results[PAGE_SIZE - 1].id
        )
      : null
    const emailList = hasMore ? results.slice(0, PAGE_SIZE) : results

    return NextResponse.json({ 
      emails: emailList,
      nextCursor,
      total: totalCount,
      cooldown: cooldownInfo,
    })
  } catch (error) {
    console.error('Failed to fetch user emails:', error)
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    )
  }
} 