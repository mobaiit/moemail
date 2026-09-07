export const ROLES = {
  EMPEROR: 'emperor',
  DUKE: 'duke',
  KNIGHT: 'knight',
  CIVILIAN: 'civilian',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
  MANAGE_EMAIL: 'manage_email',       // 创建/删除临时邮箱
  MANAGE_WEBHOOK: 'manage_webhook',   // 配置 Webhook（公爵及以上）
  PROMOTE_USER: 'promote_user',       // 管理用户角色
  MANAGE_CONFIG: 'manage_config',     // 网站配置（皇帝专属）
  MANAGE_API_KEY: 'manage_api_key',   // 创建/使用 API Key
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.EMPEROR]: Object.values(PERMISSIONS),
  [ROLES.DUKE]: [
    PERMISSIONS.MANAGE_EMAIL,
    PERMISSIONS.MANAGE_WEBHOOK,
    PERMISSIONS.MANAGE_API_KEY,
    PERMISSIONS.PROMOTE_USER,
  ],
  [ROLES.KNIGHT]: [
    PERMISSIONS.MANAGE_EMAIL,
    PERMISSIONS.MANAGE_API_KEY,
  ],
  [ROLES.CIVILIAN]: [
    PERMISSIONS.MANAGE_EMAIL,
  ],
} as const;

export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  return userRoles.some(role => ROLE_PERMISSIONS[role]?.includes(permission));
}
