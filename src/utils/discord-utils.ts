import { DISCORD_EPOCH } from '../constants/discord'

export { DISCORD_EPOCH }

export function getSnowflakeTimestamp(snowflake: string | null): number | null {
  if (!snowflake) return null
  const timestamp = Number(BigInt(snowflake) >> BigInt(22)) + DISCORD_EPOCH
  return timestamp
}

export function snowflakeToDate(snowflake: string | null): Date | null {
  const timestamp = getSnowflakeTimestamp(snowflake)
  return timestamp ? new Date(timestamp) : null
}

export const CHANNEL_TYPE_ICONS: Record<number, string> = {
  0: '#',
  2: '🔊',
  4: '📁',
  5: '📢',
  13: '🎙️',
  15: '💬',
}

export function getChannelTypeIcon(type: number): string {
  return CHANNEL_TYPE_ICONS[type] || '•'
}
