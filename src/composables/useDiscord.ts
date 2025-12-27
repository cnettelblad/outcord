import { ref, onMounted } from 'vue'
import type { AuthMethod } from '../types/app'
import type { DiscordGuild, DiscordChannel } from '../types/discord'
import { buildExportData } from '../utils/discord-api'

export function useDiscord() {
  const isAuthenticated = ref(false)
  const authMethod = ref<AuthMethod | null>(null)
  const tokenPreview = ref<string | null>(null)

  const selectedGuildId = ref<string | null>(null)
  const selectedGuild = ref<DiscordGuild | null>(null)
  const guilds = ref<DiscordGuild[]>([])
  const channels = ref<DiscordChannel[]>([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function authenticate(token: string, method: AuthMethod): Promise<boolean> {
    try {
      error.value = null
      isLoading.value = true

      const isValid = await window.electronAPI?.validateToken(token, method)

      if (!isValid) {
        error.value = 'Invalid token. Please check and try again.'
        return false
      }

      await window.electronAPI?.saveToken(method, token)

      isAuthenticated.value = true
      authMethod.value = method
      tokenPreview.value = `${token.slice(0, 4)}...${token.slice(-4)}`

      await loadGuilds()

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function loadGuilds(): Promise<void> {
    try {
      error.value = null
      isLoading.value = true

      const fetchedGuilds = await window.electronAPI?.fetchGuilds()
      guilds.value = fetchedGuilds || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load servers'
    } finally {
      isLoading.value = false
    }
  }

  async function loadChannels(guildId: string): Promise<void> {
    try {
      error.value = null
      isLoading.value = true

      selectedGuildId.value = guildId
      selectedGuild.value = guilds.value.find((g) => g.id === guildId) || null

      const fetchedChannels = await window.electronAPI?.fetchChannels(guildId)
      channels.value = fetchedChannels || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load channels'
      channels.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function exportChannels(): Promise<void> {
    if (!selectedGuild.value) {
      error.value = 'No server selected'
      return
    }

    if (channels.value.length === 0) {
      error.value = 'No channels to export'
      return
    }

    try {
      error.value = null
      isLoading.value = true

      const exportData = buildExportData(selectedGuild.value, channels.value)
      const filePath = await window.electronAPI?.exportChannels(exportData)

      if (filePath) {
        alert(`Channels exported successfully to:\n${filePath}`)
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('canceled')) {
        // User canceled export, don't show error
        return
      }
      error.value = err instanceof Error ? err.message : 'Export failed'
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    await window.electronAPI?.clearToken()

    isAuthenticated.value = false
    authMethod.value = null
    tokenPreview.value = null
    selectedGuildId.value = null
    selectedGuild.value = null
    guilds.value = []
    channels.value = []
    error.value = null
  }

  // Check for stored authentication on mount
  onMounted(async () => {
    try {
      const stored = await window.electronAPI?.getStoredAuth()

      if (stored && stored.method && stored.tokenPreview) {
        isAuthenticated.value = true
        authMethod.value = stored.method
        tokenPreview.value = stored.tokenPreview

        await loadGuilds()
      }
    } catch (err) {
      console.error('Failed to load stored authentication:', err)
    }
  })

  return {
    // State
    isAuthenticated,
    authMethod,
    tokenPreview,
    selectedGuildId,
    selectedGuild,
    guilds,
    channels,
    isLoading,
    error,

    // Actions
    authenticate,
    loadGuilds,
    loadChannels,
    exportChannels,
    logout,
  }
}
