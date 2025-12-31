import type { DiscordDMChannel } from '../types/discord'
import { DISCORD_CDN_BASE } from '../constants/discord'

const CDN_BASE = DISCORD_CDN_BASE

export function getAvatarUrl(
  userId: string,
  avatar: string | null,
  size: number = 64
): string | null {
  if (!avatar) return null
  return `${CDN_BASE}/avatars/${userId}/${avatar}.png?size=${size}`
}

export function getGuildIconUrl(
  guildId: string,
  icon: string | null,
  size: number = 64
): string | null {
  if (!icon) return null
  return `${CDN_BASE}/icons/${guildId}/${icon}.png?size=${size}`
}

export function getDMChannelAvatarUrl(dm: DiscordDMChannel, size: number = 64): string | null {
  if (dm.type === 3 || !dm.recipients[0]) return null
  const recipient = dm.recipients[0]
  return getAvatarUrl(recipient.id, recipient.avatar, size)
}
