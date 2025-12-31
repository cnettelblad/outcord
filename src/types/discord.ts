// Discord API Type Definitions

export type ChannelType = 0 | 2 | 4 | 5 | 13 | 15 | 10 | 11 | 12 | 14 | 16

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  bot?: boolean
  global_name?: string | null
}

export interface DiscordChannel {
  id: string
  name: string
  type: ChannelType
  position: number
  parent_id: string | null
  topic?: string
  nsfw?: boolean
  rate_limit_per_user?: number
  permission_overwrites?: PermissionOverwrite[]
}

export interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner_id: string
}

export interface DiscordDMChannel {
  id: string
  type: 1 | 3
  last_message_id: string | null
  recipients: DiscordUser[]
}

export interface PermissionOverwrite {
  id: string
  type: 0 | 1
  allow: string
  deny: string
}

export interface ExportedChannelData {
  metadata: {
    serverId: string
    serverName: string
    exportDate: string
    totalChannels: number
  }
  channels: ChannelExport[]
}

export interface ChannelExport {
  id: string
  name: string
  type: string
  position: number
  categoryId: string | null
  categoryName: string | null
  categoryPosition: number | null
  topic: string | null
  nsfw: boolean
  rateLimit: number | null
  permissionCount: number
  createdAt: string
}

export interface PermissionExport {
  targetId: string
  targetType: 'role' | 'member'
  allow: string[]
  deny: string[]
}
