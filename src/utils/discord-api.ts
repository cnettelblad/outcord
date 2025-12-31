import type {
  DiscordChannel,
  DiscordGuild,
  ChannelExport,
  PermissionExport,
  PermissionOverwrite,
  ExportedChannelData,
  ChannelType,
} from '../types/discord'
import { snowflakeToDate } from './discord-utils'

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

export function formatChannelForExport(
  channel: DiscordChannel,
  categoryMap: Map<string, { name: string; position: number }>
): ChannelExport {
  const category = channel.parent_id ? categoryMap.get(channel.parent_id) : null

  return {
    id: channel.id,
    name: channel.name,
    type: channelTypeToString(channel.type),
    position: channel.position,
    categoryId: channel.parent_id || null,
    categoryName: category?.name || null,
    categoryPosition: category?.position || null,
    topic: channel.topic || null,
    nsfw: channel.nsfw || false,
    rateLimit: channel.rate_limit_per_user || null,
    permissionCount: (channel.permission_overwrites || []).length,
    createdAt: snowflakeToDate(channel.id)?.toISOString() || '',
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

  // Build category map with name and position
  const categoryMap = new Map<string, { name: string; position: number }>()
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { name: cat.name, position: cat.position })
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
    permissions: 'permissionCount',
    rateLimit: 'rateLimit',
    createdAt: 'createdAt',
  }

  // Convert selected fields to actual field names
  const fieldsToInclude = selectedFields
    ? new Set(selectedFields.map((f) => fieldMapping[f] || f))
    : null

  const filterFields = (data: ChannelExport): ChannelExport => {
    if (!fieldsToInclude) return data

    const filtered: Record<string, unknown> = {}
    Object.entries(data).forEach(([key, value]) => {
      if (fieldsToInclude.has(key)) {
        filtered[key] = value
      }
    })
    return filtered as ChannelExport
  }

  const exportedChannels = regularChannels
    .map((ch) => formatChannelForExport(ch, categoryMap))
    .map((ch) => filterFields(ch))

  return {
    metadata: {
      serverId: guild.id,
      serverName: guild.name,
      exportDate: new Date().toISOString(),
      totalChannels: exportedChannels.length,
    },
    channels: exportedChannels,
  }
}
