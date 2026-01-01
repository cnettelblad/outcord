import type {
  DiscordChannel,
  DiscordRole,
  GuildMember,
  PermissionOverwrite,
  PermissionResolution,
} from '../types/discord'

/**
 * Permission bit values as bigints for bitwise operations
 */
export const PERMISSION_BITS = {
  VIEW_CHANNEL: 1024n,
  ADMINISTRATOR: 8n,
} as const

/**
 * Checks if a specific permission bit is set in a permission bitfield
 * @param permissions - Permission bitfield as string or bigint
 * @param bit - The permission bit to check
 * @returns true if the permission is set
 */
export function hasPermission(permissions: string | bigint, bit: bigint): boolean {
  const perms = typeof permissions === 'string' ? BigInt(permissions) : permissions
  return (perms & bit) === bit
}

/**
 * Applies allow/deny overwrites to base permissions
 * Deny takes precedence: permissions = (base & ~deny) | allow
 * @param base - Base permission value
 * @param allow - Allowed permissions to add
 * @param deny - Denied permissions to remove
 * @returns Computed permissions after applying overwrites
 */
export function applyOverwrites(base: bigint, allow: bigint, deny: bigint): bigint {
  return (base & ~deny) | allow
}

/**
 * Finds the @everyone role from a roles array
 * The @everyone role always has the same ID as the guild ID
 * @param roles - Array of roles
 * @param guildId - The guild ID
 * @returns The @everyone role or null if not found
 */
export function getEveryoneRole(roles: DiscordRole[], guildId: string): DiscordRole | null {
  return roles.find((role) => role.id === guildId) || null
}

/**
 * Resolves permission overwrites for all roles a member has
 * Combines multiple role overwrites by ORing all allow bits and deny bits together
 * @param roleIds - Array of role IDs the member has
 * @param overwrites - Channel permission overwrites
 * @returns Object with combined allow and deny bitfields
 */
export function resolveRoleOverwrites(
  roleIds: string[],
  overwrites: PermissionOverwrite[]
): { allow: bigint; deny: bigint } {
  let allow = 0n
  let deny = 0n

  const roleOverwrites = overwrites.filter((ow) => ow.type === 0)

  for (const roleId of roleIds) {
    const overwrite = roleOverwrites.find((ow) => ow.id === roleId)
    if (overwrite) {
      allow |= BigInt(overwrite.allow)
      deny |= BigInt(overwrite.deny)
    }
  }

  return { allow, deny }
}

/**
 * Gets member-specific permission overwrite for a channel
 * @param memberId - The member's user ID
 * @param overwrites - Channel permission overwrites
 * @returns Object with member's allow and deny bitfields, or null if no overwrite
 */
export function getMemberOverwrite(
  memberId: string,
  overwrites: PermissionOverwrite[]
): { allow: bigint; deny: bigint } | null {
  const overwrite = overwrites.find((ow) => ow.type === 1 && ow.id === memberId)

  if (!overwrite) {
    return null
  }

  return {
    allow: BigInt(overwrite.allow),
    deny: BigInt(overwrite.deny),
  }
}

/**
 * Gets effective permission overwrites for a channel, including category inheritance
 * If channel has no overwrites and has a parent category, use category's overwrites
 * @param channel - The channel to check
 * @param channels - All channels in the guild (needed to find parent category)
 * @returns The effective permission overwrites for the channel
 */
export function getEffectiveOverwrites(
  channel: DiscordChannel,
  channels: DiscordChannel[]
): PermissionOverwrite[] {
  if (channel.permission_overwrites && channel.permission_overwrites.length > 0) {
    return channel.permission_overwrites
  }

  if (channel.parent_id) {
    const category = channels.find((ch) => ch.id === channel.parent_id)
    if (category && category.permission_overwrites) {
      return category.permission_overwrites
    }
  }

  return []
}

/**
 * Resolves permissions for a member on a specific channel following Discord's algorithm
 *
 * Algorithm:
 * 1. Start with @everyone role base permissions
 * 2. Apply @everyone role overwrite for the channel
 * 3. Apply all role overwrites (combined with OR)
 * 4. Apply member-specific overwrite (if exists)
 *
 * At each step, deny takes precedence: permissions = (base & ~deny) | allow
 *
 * @param member - The guild member to check permissions for
 * @param channel - The channel to check
 * @param roles - All roles in the guild
 * @param channels - All channels in the guild (for category inheritance)
 * @param guildId - The guild ID
 * @returns PermissionResolution with detailed breakdown
 */
export function resolveChannelPermissions(
  member: GuildMember,
  channel: DiscordChannel,
  roles: DiscordRole[],
  channels: DiscordChannel[],
  guildId: string
): PermissionResolution {
  const everyoneRole = getEveryoneRole(roles, guildId)

  if (!everyoneRole) {
    throw new Error('@everyone role not found - invalid guild data')
  }

  const basePermissions = BigInt(everyoneRole.permissions)

  // Check for Administrator permission (bypasses all checks)
  if (hasPermission(basePermissions, PERMISSION_BITS.ADMINISTRATOR)) {
    return {
      allowed: true,
      basePermissions,
      roleAllow: 0n,
      roleDeny: 0n,
      memberAllow: 0n,
      memberDeny: 0n,
      finalPermissions: basePermissions,
      hasAdministrator: true,
    }
  }

  // Check if member has Administrator from any of their roles
  for (const roleId of member.roles) {
    const role = roles.find((r) => r.id === roleId)
    if (role && hasPermission(role.permissions, PERMISSION_BITS.ADMINISTRATOR)) {
      return {
        allowed: true,
        basePermissions,
        roleAllow: 0n,
        roleDeny: 0n,
        memberAllow: 0n,
        memberDeny: 0n,
        finalPermissions: BigInt(role.permissions),
        hasAdministrator: true,
      }
    }
  }

  // Start with @everyone base permissions
  let permissions = basePermissions

  // Get effective overwrites (with category inheritance)
  const overwrites = getEffectiveOverwrites(channel, channels)

  // Apply @everyone role overwrite if it exists
  const everyoneOverwrite = overwrites.find((ow) => ow.type === 0 && ow.id === guildId)
  if (everyoneOverwrite) {
    const everyoneAllow = BigInt(everyoneOverwrite.allow)
    const everyoneDeny = BigInt(everyoneOverwrite.deny)
    permissions = applyOverwrites(permissions, everyoneAllow, everyoneDeny)
  }

  // Apply role overwrites (combined)
  const { allow: roleAllow, deny: roleDeny } = resolveRoleOverwrites(member.roles, overwrites)
  permissions = applyOverwrites(permissions, roleAllow, roleDeny)

  // Apply member-specific overwrite
  const memberOverwrite = getMemberOverwrite(member.user.id, overwrites)
  let memberAllow = 0n
  let memberDeny = 0n

  if (memberOverwrite) {
    memberAllow = memberOverwrite.allow
    memberDeny = memberOverwrite.deny
    permissions = applyOverwrites(permissions, memberAllow, memberDeny)
  }

  // Check if the member has VIEW_CHANNEL permission
  const allowed = hasPermission(permissions, PERMISSION_BITS.VIEW_CHANNEL)

  return {
    allowed,
    basePermissions,
    roleAllow,
    roleDeny,
    memberAllow,
    memberDeny,
    finalPermissions: permissions,
    hasAdministrator: false,
  }
}

/**
 * Simple check if a user can read/view a channel
 * @param member - The guild member
 * @param channel - The channel to check
 * @param roles - All roles in the guild
 * @param channels - All channels in the guild
 * @param guildId - The guild ID
 * @returns true if member can view the channel
 */
export function canReadChannel(
  member: GuildMember,
  channel: DiscordChannel,
  roles: DiscordRole[],
  channels: DiscordChannel[],
  guildId: string
): boolean {
  const resolution = resolveChannelPermissions(member, channel, roles, channels, guildId)
  return resolution.allowed
}
