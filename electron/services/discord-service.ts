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

interface ThreadListResponse {
  threads: ForumThread[]
  has_more?: boolean
  before?: string
}

interface ThreadSearchResponse {
  threads: ForumThread[]
  total_results: number
  has_more?: boolean
}

// Bot accounts use the archived endpoints
async function fetchArchivedThreadsPaginated(
  channelId: string,
  token: string,
  type: 'public' | 'private',
  onProgress?: (count: number) => void
): Promise<ForumThread[]> {
  const allThreads: ForumThread[] = []
  let hasMore = true
  let before: string | undefined = undefined

  while (hasMore) {
    try {
      const url: string = before
        ? `/channels/${channelId}/threads/archived/${type}?before=${before}&limit=100`
        : `/channels/${channelId}/threads/archived/${type}?limit=100`

      const response: ThreadListResponse = await makeDiscordRequest<ThreadListResponse>(
        url,
        token,
        'bot'
      )

      if (response.threads && response.threads.length > 0) {
        allThreads.push(...response.threads)
        onProgress?.(allThreads.length)
      }

      hasMore = response.has_more === true
      before = response.before
    } catch (error) {
      console.error(`Error fetching archived ${type} threads:`, error)
      hasMore = false
    }
  }

  return allThreads
}

// User accounts use the /threads/search endpoint with offset pagination
async function fetchThreadsSearchPaginated(
  channelId: string,
  token: string,
  archived: boolean,
  onProgress?: (count: number) => void
): Promise<ForumThread[]> {
  const allThreads: ForumThread[] = []
  let offset = 0
  const limit = 25
  let hasMore = true

  while (hasMore) {
    try {
      const url: string = `/channels/${channelId}/threads/search?archived=${archived}&sort_by=last_message_time&sort_order=desc&limit=${limit}&tag_setting=match_some&offset=${offset}`

      console.log(
        `[API Request] Fetching ${archived ? 'archived' : 'active'} threads: offset=${offset}, limit=${limit}`
      )

      const response: ThreadSearchResponse = await makeDiscordRequest<ThreadSearchResponse>(
        url,
        token,
        'user'
      )

      console.log(
        `[API Response] Received ${response.threads?.length || 0} threads, has_more=${response.has_more}, total_results=${response.total_results}`
      )

      if (response.threads && response.threads.length > 0) {
        console.log(
          `[Thread Fetch] Retrieved ${response.threads.length} ${archived ? 'archived' : 'active'} threads at offset ${offset}`
        )
        response.threads.forEach((thread, index) => {
          console.log(`  [${offset + index}] Thread: "${thread.name}" (ID: ${thread.id})`)
        })
        allThreads.push(...response.threads)
        onProgress?.(allThreads.length)
        offset += response.threads.length

        if (response.threads.length < limit) {
          console.log(
            `[Pagination] Note: Received ${response.threads.length} < ${limit} (limit), but continuing based on has_more flag`
          )
        }
      } else {
        console.log(`[Pagination] No threads in response, stopping pagination`)
        hasMore = false
      }

      // Only stop based on has_more flag or when no threads returned
      if (response.has_more === false) {
        console.log(`[Pagination] has_more=false, stopping`)
        hasMore = false
      } else if (response.threads && response.threads.length > 0) {
        console.log(
          `[Pagination] has_more=true, continuing... (fetched ${allThreads.length} total so far)`
        )
      }

      // Add small delay to avoid rate limiting
      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error(
        `[ERROR] Failed to fetch ${archived ? 'archived' : 'active'} threads at offset ${offset}:`,
        error
      )
      console.error(
        `[ERROR] Stopping pagination. Fetched ${allThreads.length} threads before error.`
      )
      hasMore = false
    }
  }

  return allThreads
}

export async function fetchAllForumThreads(
  channelId: string,
  token: string,
  method: 'bot' | 'user',
  onProgress?: (count: number) => void
): Promise<ForumThread[]> {
  const allThreads: ForumThread[] = []
  const seenIds = new Set<string>()

  // User accounts use the /threads/search endpoint with offset pagination
  if (method === 'user') {
    try {
      // Fetch active threads first (archived=false)
      console.log('[Forum Export] Starting to fetch active threads...')
      const activeThreads = await fetchThreadsSearchPaginated(channelId, token, false, onProgress)
      console.log(`[Forum Export] Fetched ${activeThreads.length} active threads`)

      let duplicateCount = 0
      activeThreads.forEach((thread) => {
        if (!seenIds.has(thread.id)) {
          allThreads.push(thread)
          seenIds.add(thread.id)
        } else {
          duplicateCount++
          console.log(`  [Duplicate] Skipped duplicate thread: "${thread.name}" (ID: ${thread.id})`)
        }
      })
      console.log(
        `[Forum Export] Active threads: ${activeThreads.length} fetched, ${duplicateCount} duplicates, ${allThreads.length} unique total`
      )
    } catch (error) {
      console.error('[Forum Export] Error fetching active threads:', error)
    }

    try {
      // Then fetch archived threads (archived=true)
      console.log('[Forum Export] Starting to fetch archived threads...')
      const archivedThreads = await fetchThreadsSearchPaginated(channelId, token, true, (count) =>
        onProgress?.(allThreads.length + count)
      )
      console.log(`[Forum Export] Fetched ${archivedThreads.length} archived threads`)

      let duplicateCount = 0
      archivedThreads.forEach((thread) => {
        if (!seenIds.has(thread.id)) {
          allThreads.push(thread)
          seenIds.add(thread.id)
        } else {
          duplicateCount++
          console.log(`  [Duplicate] Skipped duplicate thread: "${thread.name}" (ID: ${thread.id})`)
        }
      })
      console.log(
        `[Forum Export] Archived threads: ${archivedThreads.length} fetched, ${duplicateCount} duplicates, ${allThreads.length} unique total`
      )
    } catch (error) {
      console.error('[Forum Export] Error fetching archived threads:', error)
    }

    console.log(`[Forum Export] Final total: ${allThreads.length} unique threads`)
    return allThreads
  }

  // Bot accounts use the archived endpoints (no /threads/search access)
  // For forum channels, all threads (both active and archived) are accessed
  // through the archived endpoints. The "active" endpoint doesn't work for forums.

  try {
    // Fetch all archived public threads with pagination
    // This includes both active and archived threads for forum channels
    const archivedPublic = await fetchArchivedThreadsPaginated(
      channelId,
      token,
      'public',
      onProgress
    )
    archivedPublic.forEach((thread) => {
      if (!seenIds.has(thread.id)) {
        allThreads.push(thread)
        seenIds.add(thread.id)
      }
    })
  } catch (error) {
    console.error('Error fetching archived public threads:', error)
  }

  try {
    // Fetch all archived private threads with pagination (may fail if no permissions)
    const archivedPrivate = await fetchArchivedThreadsPaginated(
      channelId,
      token,
      'private',
      (count) => onProgress?.(allThreads.length + count)
    )
    archivedPrivate.forEach((thread) => {
      if (!seenIds.has(thread.id)) {
        allThreads.push(thread)
        seenIds.add(thread.id)
      }
    })
  } catch (error) {
    // Silently fail for private archived threads (permission denied is expected)
    console.warn('Could not fetch archived private threads (may lack permissions):', error)
  }

  return allThreads
}
