import { getSnowflakeTimestamp } from '../discord-utils'
import type { DiscordDMChannel } from '../../types/discord'

export function formatRelativeDate(timestamp: number | null): string {
  if (!timestamp) return 'No messages'

  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'long' })
  }

  if (diff < 365 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDMLastMessageDate(dm: DiscordDMChannel): string {
  const timestamp = getSnowflakeTimestamp(dm.last_message_id)
  return formatRelativeDate(timestamp)
}
