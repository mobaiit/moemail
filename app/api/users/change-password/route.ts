import { auth } from "@/lib/auth"
import { createDb } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { hashPassword, comparePassword } from "@/lib/utils"

export const runtime = "edge"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }

  const { currentPassword, newPassword } = await request.json() as {
    currentPassword: string
    newPassword: string
  }

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "请填写完整信息" }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return Response.json({ error: "新密码长度不能少于8位" }, { status: 400 })
  }

  const db = createDb()
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) {
    return Response.json({ error: "用户不存在" }, { status: 404 })
  }

  if (!user.password) {
    return Response.json({ error: "该账号未设置密码，无法修改" }, { status: 400 })
  }

  const isValid = await comparePassword(currentPassword, user.password)
  if (!isValid) {
    return Response.json({ error: "当前密码不正确" }, { status: 400 })
  }

  const hashedPassword = await hashPassword(newPassword)
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, session.user.id))

  return Response.json({ success: true })
}
