import type { DiscordUser, DiscordDMChannel } from '../../types/discord'

export function getDisplayName(user: DiscordUser | null | undefined): string {
  if (!user) return 'Unknown'
  return user.global_name || user.username
}

export function getDMChannelName(dm: DiscordDMChannel): string {
  if (dm.type === 3) {
    return dm.recipients.map((r) => r.global_name || r.username).join(', ')
  }
  const recipient = dm.recipients[0]
  return recipient?.global_name || recipient?.username || 'Unknown User'
}

export function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}
