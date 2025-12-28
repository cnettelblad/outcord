import type {
  DiscordChannel,
  DiscordGuild,
  ChannelExport,
  PermissionExport,
  PermissionOverwrite,
  ExportedChannelData,
  ChannelType,
} from '../types/discord'

const CHANNEL_TYPE_NAMES: Record<number, string> = {
  0: 'text',
  1: 'dm',
  2: 'voice',
  3: 'group-dm',
  4: 'category',
  5: 'announcement',
  10: 'announcement-thread',
  11: 'public-thread',
  12: 'private-thread',
  13: 'stage-voice',
  14: 'directory',
  15: 'forum',
  16: 'media',
}

const PERMISSION_FLAGS: Record<string, string> = {
  1: 'CREATE_INSTANT_INVITE',
  2: 'KICK_MEMBERS',
  4: 'BAN_MEMBERS',
  8: 'ADMINISTRATOR',
  16: 'MANAGE_CHANNELS',
  32: 'MANAGE_GUILD',
  64: 'ADD_REACTIONS',
  128: 'VIEW_AUDIT_LOG',
  256: 'PRIORITY_SPEAKER',
  512: 'STREAM',
  1024: 'VIEW_CHANNEL',
  2048: 'SEND_MESSAGES',
  4096: 'SEND_TTS_MESSAGES',
  8192: 'MANAGE_MESSAGES',
  16384: 'EMBED_LINKS',
  32768: 'ATTACH_FILES',
  65536: 'READ_MESSAGE_HISTORY',
  131072: 'MENTION_EVERYONE',
  262144: 'USE_EXTERNAL_EMOJIS',
  524288: 'VIEW_GUILD_INSIGHTS',
  1048576: 'CONNECT',
  2097152: 'SPEAK',
  4194304: 'MUTE_MEMBERS',
  8388608: 'DEAFEN_MEMBERS',
  16777216: 'MOVE_MEMBERS',
  33554432: 'USE_VAD',
  67108864: 'CHANGE_NICKNAME',
  134217728: 'MANAGE_NICKNAMES',
  268435456: 'MANAGE_ROLES',
  536870912: 'MANAGE_WEBHOOKS',
  1073741824: 'MANAGE_GUILD_EXPRESSIONS',
  2147483648: 'USE_APPLICATION_COMMANDS',
  4294967296: 'REQUEST_TO_SPEAK',
  8589934592: 'MANAGE_EVENTS',
  17179869184: 'MANAGE_THREADS',
  34359738368: 'CREATE_PUBLIC_THREADS',
  68719476736: 'CREATE_PRIVATE_THREADS',
  137438953472: 'USE_EXTERNAL_STICKERS',
  274877906944: 'SEND_MESSAGES_IN_THREADS',
  549755813888: 'USE_EMBEDDED_ACTIVITIES',
  1099511627776: 'MODERATE_MEMBERS',
  2199023255552: 'VIEW_CREATOR_MONETIZATION_ANALYTICS',
  4398046511104: 'USE_SOUNDBOARD',
  8796093022208: 'USE_EXTERNAL_SOUNDS',
  17592186044416: 'SEND_VOICE_MESSAGES',
}

export function channelTypeToString(type: ChannelType): string {
  return CHANNEL_TYPE_NAMES[type] || 'unknown'
}

function parsePermissionBits(bits: string): string[] {
  const permissions: string[] = []
  const permissionValue = BigInt(bits)

  for (const [bit, name] of Object.entries(PERMISSION_FLAGS)) {
    if ((permissionValue & BigInt(bit)) !== BigInt(0)) {
      permissions.push(name)
    }
  }

  return permissions
}

export function parsePermissions(overwrite: PermissionOverwrite): PermissionExport {
  return {
    targetId: overwrite.id,
    targetType: overwrite.type === 0 ? 'role' : 'member',
    allow: parsePermissionBits(overwrite.allow),
    deny: parsePermissionBits(overwrite.deny),
  }
}

function getSnowflakeTimestamp(snowflake: string): string {
  const DISCORD_EPOCH = 1420070400000
  const timestamp = Number(BigInt(snowflake) >> BigInt(22)) + DISCORD_EPOCH
  return new Date(timestamp).toISOString()
}

export function formatChannelForExport(
  channel: DiscordChannel,
  categories: Map<string, string>
): ChannelExport {
  return {
    id: channel.id,
    name: channel.name,
    type: channelTypeToString(channel.type),
    position: channel.position,
    categoryId: channel.parent_id,
    categoryName: channel.parent_id ? categories.get(channel.parent_id) || null : null,
    topic: channel.topic || null,
    nsfw: channel.nsfw || false,
    rateLimit: channel.rate_limit_per_user || null,
    permissions: (channel.permission_overwrites || []).map(parsePermissions),
    createdAt: getSnowflakeTimestamp(channel.id),
  }
}

export function buildExportData(
  guild: DiscordGuild,
  channels: DiscordChannel[],
  selectedFields?: string[]
): ExportedChannelData {
  // Separate categories from channels
  const categories = channels.filter((ch) => ch.type === 4)
  const regularChannels = channels.filter((ch) => ch.type !== 4)

  // Build category map for lookups
  const categoryMap = new Map<string, string>()
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat.name)
  })

  // Map selected field keys to ChannelExport keys
  const fieldMapping: Record<string, string> = {
    channelId: 'id',
    channelName: 'name',
    channelType: 'type',
    channelPosition: 'position',
    categoryName: 'categoryName',
    topic: 'topic',
    nsfw: 'nsfw',
    permissions: 'permissions',
    rateLimit: 'rateLimit',
    createdAt: 'createdAt',
  }

  // Convert selected fields to actual field names
  const fieldsToInclude = selectedFields
    ? new Set(selectedFields.map((f) => fieldMapping[f] || f))
    : null

  const filterFields = (data: ChannelExport): Partial<ChannelExport> => {
    if (!fieldsToInclude) return data

    const filtered: Partial<ChannelExport> = {}
    Object.entries(data).forEach(([key, value]) => {
      if (fieldsToInclude.has(key)) {
        ;(filtered as Record<string, unknown>)[key] = value
      }
    })
    return filtered
  }

  return {
    serverId: guild.id,
    serverName: guild.name,
    exportDate: new Date().toISOString(),
    categories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      position: cat.position,
    })),
    channels: regularChannels
      .map((ch) => formatChannelForExport(ch, categoryMap))
      .map((ch) => filterFields(ch)) as ChannelExport[],
  }
}
