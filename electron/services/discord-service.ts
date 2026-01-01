import type {
  DiscordUser,
  DiscordGuild,
  DiscordChannel,
  DiscordDMChannel,
  DiscordRole,
  GuildMember,
} from '../../src/types/discord.js'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

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

export async function fetchRoles(
  guildId: string,
  token: string,
  method: 'bot' | 'user'
): Promise<DiscordRole[]> {
  return makeDiscordRequest<DiscordRole[]>(`/guilds/${guildId}/roles`, token, method)
}

export async function fetchCurrentMember(
  guildId: string,
  token: string,
  method: 'bot' | 'user'
): Promise<GuildMember> {
  return makeDiscordRequest<GuildMember>(`/users/@me/guilds/${guildId}/member`, token, method)
}
