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
  // Text Channel
  0: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M5.41,21L6.12,17H2.12L2.47,15H6.47L7.53,9H3.53L3.88,7H7.88L8.59,3H10.59L9.88,7H15.88L16.59,3H18.59L17.88,7H21.88L21.53,9H17.53L16.47,15H20.47L20.12,17H16.12L15.41,21H13.41L14.12,17H8.12L7.41,21H5.41M9.53,9L8.47,15H14.47L15.53,9H9.53Z" /></svg>',
  // Voice Channel
  2: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z" /></svg>',
  // Category
  4: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" /></svg>',
  // Announcement Channel
  5: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12,8H4A2,2 0 0,0 2,10V14A2,2 0 0,0 4,16H5V20A1,1 0 0,0 6,21H8A1,1 0 0,0 9,20V16H12L17,20V4L12,8M21.5,12C21.5,13.71 20.54,15.26 19,16V8C20.53,8.75 21.5,10.3 21.5,12Z" /></svg>',
  // Stage Channel
  13: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M9,3A4,4 0 0,1 13,7H5A4,4 0 0,1 9,3M11.84,9.82L11,18H10V19A2,2 0 0,0 12,21A2,2 0 0,0 14,19V14A4,4 0 0,1 18,10H20L19,11L20,12H18A2,2 0 0,0 16,14V19A4,4 0 0,1 12,23A4,4 0 0,1 8,19V18H7L6.16,9.82C5.67,9.32 5.31,8.7 5.13,8H12.87C12.69,8.7 12.33,9.32 11.84,9.82M9,11A1,1 0 0,0 8,12A1,1 0 0,0 9,13A1,1 0 0,0 10,12A1,1 0 0,0 9,11Z" /></svg>',
  // Forum Channel
  15: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17,12V3A1,1 0 0,0 16,2H3A1,1 0 0,0 2,3V17L6,13H16A1,1 0 0,0 17,12M21,6H19V15H6V17A1,1 0 0,0 7,18H18L22,22V7A1,1 0 0,0 21,6Z" /></svg>',
}

export function getChannelTypeIcon(type: number): string {
  return CHANNEL_TYPE_ICONS[type] || '•'
}
