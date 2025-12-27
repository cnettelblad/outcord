import type { DiscordChannel, DiscordGuild } from './discord'

export type AuthMethod = 'bot' | 'user'

export interface AuthState {
  isAuthenticated: boolean
  authMethod: AuthMethod | null
  tokenPreview: string | null
}

export interface AppState {
  auth: AuthState
  selectedGuildId: string | null
  guilds: DiscordGuild[]
  channels: DiscordChannel[]
  isLoading: boolean
  error: string | null
}
