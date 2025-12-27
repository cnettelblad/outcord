/// <reference types="vite/client" />

import type { AuthMethod } from './types/app'
import type { DiscordGuild, DiscordChannel, ExportedChannelData } from './types/discord'

declare global {
  interface Window {
    electronAPI?: {
      onMainProcessMessage: (callback: (message: string) => void) => void

      // Auth
      saveToken: (method: AuthMethod, token: string) => Promise<boolean>
      validateToken: (token: string, method: AuthMethod) => Promise<boolean>
      clearToken: () => Promise<boolean>
      getStoredAuth: () => Promise<{
        method: AuthMethod
        tokenPreview: string
      } | null>

      // Discord API
      fetchGuilds: () => Promise<DiscordGuild[]>
      fetchChannels: (guildId: string) => Promise<DiscordChannel[]>

      // Export
      exportChannels: (data: ExportedChannelData) => Promise<string>
    }
  }
}

export {}
