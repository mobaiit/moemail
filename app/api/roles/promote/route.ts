import { createDb } from "@/lib/db";
import { roles, userRoles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { ROLES } from "@/lib/permissions";
import { assignRoleToUser } from "@/lib/auth";
import { checkPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export const runtime = "edge";

export async function POST(request: Request) {
  const canPromote = await checkPermission(PERMISSIONS.PROMOTE_USER);
  if (!canPromote) {
    return Response.json({ error: "权限不足" }, { status: 403 });
  }

  try {
    const { userId, roleName, expiresAt } = await request.json() as {
      userId: string;
      roleName: typeof ROLES.DUKE | typeof ROLES.KNIGHT | typeof ROLES.CIVILIAN | typeof ROLES.EMPEROR;
      expiresAt?: string | null; // ISO 日期字符串，null 表示永久
    };

    if (!userId || !roleName) {
      return Response.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const validRoles = [ROLES.EMPEROR, ROLES.DUKE, ROLES.KNIGHT, ROLES.CIVILIAN];
    if (!validRoles.includes(roleName)) {
      return Response.json({ error: "角色不合法" }, { status: 400 });
    }

    const db = createDb();

    const currentUserRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, userId),
      with: { role: true },
    });

    if (currentUserRole?.role.name === ROLES.EMPEROR && roleName !== ROLES.EMPEROR) {
      return Response.json({ error: "不能降级皇帝" }, { status: 400 });
    }

    let targetRole = await db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    });

    if (!targetRole) {
      const description = {
        [ROLES.EMPEROR]: "皇帝（网站所有者）",
        [ROLES.DUKE]: "超级用户",
        [ROLES.KNIGHT]: "高级用户",
        [ROLES.CIVILIAN]: "普通用户",
      }[roleName];

      const [newRole] = await db.insert(roles)
        .values({ name: roleName, description })
        .returning();
      targetRole = newRole;
    }

    // 计算过期时间
    const expiresAtDate = expiresAt ? new Date(expiresAt) : null;

    // 更新 user_role 记录（含 expires_at）
    const existing = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, userId),
    });

    if (existing) {
      await db.update(userRoles)
        .set({
          roleId: targetRole.id,
          expiresAt: expiresAtDate,
        })
        .where(eq(userRoles.userId, userId));
    } else {
      await db.insert(userRoles).values({
        userId,
        roleId: targetRole.id,
        expiresAt: expiresAtDate,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to change user role:", error);
    return Response.json({ error: "操作失败" }, { status: 500 });
  }
}
