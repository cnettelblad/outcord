/// <reference types="vite/client" />

import type { AuthMethod } from './types/app'
import type {
  DiscordUser,
  DiscordGuild,
  DiscordChannel,
  DiscordDMChannel,
} from './types/discord'

export type { DiscordUser, DiscordGuild, DiscordChannel, DiscordDMChannel }

declare global {
  interface Window {
    electronAPI?: {
      onMainProcessMessage: (callback: (message: string) => void) => void

      // Auth
      saveToken: (method: AuthMethod, token: string, user: DiscordUser) => Promise<boolean>
      validateToken: (token: string, method: AuthMethod) => Promise<DiscordUser | null>
      clearToken: () => Promise<boolean>
      getStoredAuth: () => Promise<{
        method: AuthMethod
        tokenPreview: string
        user: DiscordUser
      } | null>

      // Discord API
      fetchGuilds: () => Promise<DiscordGuild[]>
      fetchChannels: (guildId: string) => Promise<DiscordChannel[]>
      fetchDMs: () => Promise<DiscordDMChannel[]>

      // Export
      exportChannels: (params: {
        content: string
        extension: string
        filename: string
      }) => Promise<string>

      // Window controls
      minimizeWindow: () => Promise<void>
      maximizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      isWindowMaximized: () => Promise<boolean>
      resizeForAuth: () => Promise<void>
      resizeForApp: () => Promise<void>

      // Discord login flow
      openDiscordLogin: () => Promise<void>
      closeDiscordLogin: () => Promise<void>
      extractDiscordToken: () => Promise<string | null>
    }
  }
}

export {}
