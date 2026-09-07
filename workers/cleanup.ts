interface Env {
  DB: D1Database
}

const CLEANUP_CONFIG = {
  DELETE_EXPIRED_EMAILS: true,
  BATCH_SIZE: 100,
  SOFT_DELETE_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24小时
} as const

const main = {
  async scheduled(_: ScheduledEvent, env: Env) {
    const now = Date.now()

    try {
      // 1. 清理过期临时邮箱（expiresAt < now，且未软删除）
      if (CLEANUP_CONFIG.DELETE_EXPIRED_EMAILS) {
        const result = await env.DB
          .prepare(`
            DELETE FROM email
            WHERE expires_at < ? AND deleted_at IS NULL
            LIMIT ?
          `)
          .bind(now, CLEANUP_CONFIG.BATCH_SIZE)
          .run()
        console.log(`Deleted ${result?.meta?.changes ?? 0} expired emails`)
      }

      // 2. 物理清理软删除超过 24h 的邮箱
      const cutoff = now - CLEANUP_CONFIG.SOFT_DELETE_COOLDOWN_MS
      const softDeleteResult = await env.DB
        .prepare(`
          DELETE FROM email
          WHERE deleted_at IS NOT NULL AND deleted_at < ?
          LIMIT ?
        `)
        .bind(cutoff, CLEANUP_CONFIG.BATCH_SIZE)
        .run()
      console.log(`Physically deleted ${softDeleteResult?.meta?.changes ?? 0} soft-deleted emails`)

      // 3. 自动降级过期角色（expires_at < now）→ 改为 civilian
      // 先确保 civilian role 存在
      const civilianRole = await env.DB
        .prepare(`SELECT id FROM role WHERE name = 'civilian' LIMIT 1`)
        .first<{ id: string }>()

      if (civilianRole) {
        const expiredRoles = await env.DB
          .prepare(`
            SELECT ur.user_id
            FROM user_role ur
            JOIN role r ON ur.role_id = r.id
            WHERE ur.expires_at IS NOT NULL
              AND ur.expires_at < ?
              AND r.name != 'civilian'
            LIMIT ?
          `)
          .bind(now / 1000, CLEANUP_CONFIG.BATCH_SIZE) // expires_at 是秒级时间戳
          .all<{ user_id: string }>()

        if (expiredRoles.results && expiredRoles.results.length > 0) {
          for (const row of expiredRoles.results) {
            await env.DB
              .prepare(`
                UPDATE user_role
                SET role_id = ?, expires_at = NULL
                WHERE user_id = ?
              `)
              .bind(civilianRole.id, row.user_id)
              .run()
          }
          console.log(`Demoted ${expiredRoles.results.length} users with expired roles to civilian`)
        }
      }

    } catch (error) {
      console.error('Failed to cleanup:', error)
      throw error
    }
  }
}

export default main
