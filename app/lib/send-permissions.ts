import { createDb } from "@/lib/db"
import { userRoles, roles, messages, emails } from "@/lib/schema"
import { eq, and, gte } from "drizzle-orm"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { getRoleLimitByName } from "@/lib/role-limits"

export interface SendPermissionResult {
  canSend: boolean
  error?: string
  remainingEmails?: number
}

export async function checkSendPermission(
  userId: string,
  skipDailyLimitCheck = false
): Promise<SendPermissionResult> {
  try {
    const env = getRequestContext().env
    const enabled = await env.SITE_CONFIG.get("EMAIL_SERVICE_ENABLED")

    if (enabled !== "true") {
      return {
        canSend: false,
        error: "邮件发送服务未启用"
      }
    }

    const userDailyLimit = await getUserDailyLimit(userId)
    
    if (userDailyLimit === -1) {
      return {
        canSend: false,
        error: "您的角色没有发件权限"
      }
    }

    if (skipDailyLimitCheck || userDailyLimit === 0) {
      return {
        canSend: true
      }
    }
    
    const db = createDb()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sentToday = await db
      .select()
      .from(messages)
      .innerJoin(emails, eq(messages.emailId, emails.id))
      .where(
        and(
          eq(emails.userId, userId),
          eq(messages.type, "sent"),
          gte(messages.receivedAt, today)
        )
      )

    const remainingEmails = Math.max(0, userDailyLimit - sentToday.length)
    
    if (sentToday.length >= userDailyLimit) {
      return {
        canSend: false,
        error: `您今天已达到发件限制 (${userDailyLimit} 封)，请明天再试`,
        remainingEmails: 0
      }
    }

    return {
      canSend: true,
      remainingEmails
    }
  } catch (error) {
    console.error('Failed to check send permission:', error)
    return {
      canSend: false,
      error: "权限检查失败"
    }
  }
}

async function getUserDailyLimit(userId: string): Promise<number> {
  try {
    const db = createDb()
    const userRoleData = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))

    const roleName = userRoleData[0]?.roleName ?? "civilian"
    const limits = await getRoleLimitByName(roleName)
    return limits.dailySendLimit
  } catch (error) {
    console.error('Failed to get user daily limit:', error)
    return -1
  }
}

export async function checkBasicSendPermission(userId: string): Promise<SendPermissionResult> {
  return checkSendPermission(userId, true)
} 