import type { DiscordChannel, DiscordDMChannel } from '../../types/discord'
import { getSnowflakeTimestamp } from '../discord-utils'

export interface ChannelGroup {
  categories: DiscordChannel[]
  grouped: Map<string, DiscordChannel[]>
}

export function groupChannelsByCategory(channels: DiscordChannel[]): ChannelGroup {
  const categories = channels
    .filter((ch) => ch.type === 4)
    .sort((a, b) => a.position - b.position)

  const regularChannels = channels.filter((ch) => ch.type !== 4)

  const grouped = new Map<string, DiscordChannel[]>()

  const uncategorized = regularChannels
    .filter((ch) => !ch.parent_id)
    .sort((a, b) => a.position - b.position)
  if (uncategorized.length > 0) {
    grouped.set('uncategorized', uncategorized)
  }

  categories.forEach((category) => {
    const channelsInCategory = regularChannels
      .filter((ch) => ch.parent_id === category.id)
      .sort((a, b) => a.position - b.position)
    if (channelsInCategory.length > 0) {
      grouped.set(category.id, channelsInCategory)
    }
  })

  return { categories, grouped }
}

export function sortDMChannelsByLastMessage(dmChannels: DiscordDMChannel[]): DiscordDMChannel[] {
  return [...dmChannels].sort((a, b) => {
    const timestampA = getSnowflakeTimestamp(a.last_message_id) || 0
    const timestampB = getSnowflakeTimestamp(b.last_message_id) || 0
    return timestampB - timestampA
  })
}
