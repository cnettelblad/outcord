import type {
  DiscordUser,
  DiscordGuild,
  DiscordChannel,
  DiscordDMChannel,
  DiscordRole,
  GuildMember,
  ForumThread,
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

export async function fetchAllForumThreads(
  channelId: string,
  token: string,
  method: 'bot' | 'user'
): Promise<ForumThread[]> {
  const allThreads: ForumThread[] = []
  const seenIds = new Set<string>()

  try {
    // Fetch active threads
    const activeResponse = await makeDiscordRequest<{ threads: ForumThread[] }>(
      `/channels/${channelId}/threads/active`,
      token,
      method
    )
    if (activeResponse.threads) {
      activeResponse.threads.forEach((thread) => {
        if (!seenIds.has(thread.id)) {
          allThreads.push(thread)
          seenIds.add(thread.id)
        }
      })
    }
  } catch (error) {
    console.error('Error fetching active threads:', error)
  }

  try {
    // Fetch archived public threads
    const archivedPublicResponse = await makeDiscordRequest<{ threads: ForumThread[] }>(
      `/channels/${channelId}/threads/archived/public`,
      token,
      method
    )
    if (archivedPublicResponse.threads) {
      archivedPublicResponse.threads.forEach((thread) => {
        if (!seenIds.has(thread.id)) {
          allThreads.push(thread)
          seenIds.add(thread.id)
        }
      })
    }
  } catch (error) {
    console.error('Error fetching archived public threads:', error)
  }

  try {
    // Fetch archived private threads (may fail if no permissions)
    const archivedPrivateResponse = await makeDiscordRequest<{ threads: ForumThread[] }>(
      `/channels/${channelId}/threads/archived/private`,
      token,
      method
    )
    if (archivedPrivateResponse.threads) {
      archivedPrivateResponse.threads.forEach((thread) => {
        if (!seenIds.has(thread.id)) {
          allThreads.push(thread)
          seenIds.add(thread.id)
        }
      })
    }
  } catch (error) {
    // Silently fail for private archived threads (permission denied is expected)
    console.warn('Could not fetch archived private threads (may lack permissions):', error)
  }

  return allThreads
}
