const DISCORD_API_BASE = 'https://discord.com/api/v10'

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  bot?: boolean
  global_name?: string | null
}

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner_id: string
}

interface DiscordChannel {
  id: string
  name: string
  type: number
  position: number
  parent_id: string | null
  topic?: string
  nsfw?: boolean
  rate_limit_per_user?: number
  permission_overwrites?: Array<{
    id: string
    type: number
    allow: string
    deny: string
  }>
}

export interface DiscordDMChannel {
  id: string
  type: 1 | 3 // 1 = DM, 3 = Group DM
  last_message_id: string | null
  recipients: DiscordUser[]
}

function getAuthHeader(token: string, method: 'bot' | 'user'): string {
  return method === 'bot' ? `Bot ${token}` : token
}

async function makeDiscordRequest<T>(
  endpoint: string,
  token: string,
  method: 'bot' | 'user'
): Promise<T> {
  const response = await fetch(`${DISCORD_API_BASE}${endpoint}`, {
    headers: {
      Authorization: getAuthHeader(token, method),
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid or expired token')
    }
    if (response.status === 403) {
      throw new Error('Insufficient permissions')
    }
    if (response.status === 429) {
      const data = (await response.json()) as { retry_after: number }
      throw new Error(`Rate limited. Retry after ${data.retry_after}s`)
    }
    throw new Error(`Discord API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function validateToken(
  token: string,
  method: 'bot' | 'user'
): Promise<DiscordUser | null> {
  try {
    const user = await makeDiscordRequest<DiscordUser>('/users/@me', token, method)
    return user
  } catch {
    return null
  }
}

export async function fetchGuilds(token: string, method: 'bot' | 'user'): Promise<DiscordGuild[]> {
  return makeDiscordRequest<DiscordGuild[]>('/users/@me/guilds', token, method)
}

export async function fetchChannels(
  guildId: string,
  token: string,
  method: 'bot' | 'user'
): Promise<DiscordChannel[]> {
  return makeDiscordRequest<DiscordChannel[]>(`/guilds/${guildId}/channels`, token, method)
}

export async function fetchDMs(token: string, method: 'bot' | 'user'): Promise<DiscordDMChannel[]> {
  return makeDiscordRequest<DiscordDMChannel[]>('/users/@me/channels', token, method)
}
