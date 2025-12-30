import { ref, onMounted, inject } from 'vue'
import type { AuthMethod } from '../types/app'
import type { DiscordGuild, DiscordChannel } from '../types/discord'
import type { ExportSettings } from '../components/ExportModal.vue'
import type { DiscordUser } from '../vite-env'
import { buildExportData } from '../utils/discord-api'
import { formatExportData } from '../utils/export-formatters'
import type { useToast } from './useToast'

export function useDiscord() {
  const toast = inject<ReturnType<typeof useToast>>('toast')
  const isAuthenticated = ref(false)
  const authMethod = ref<AuthMethod | null>(null)
  const tokenPreview = ref<string | null>(null)
  const user = ref<DiscordUser | null>(null)

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

      const userData = await window.electronAPI?.validateToken(token, method)

      if (!userData) {
        error.value = 'Invalid token. Please check and try again.'
        return false
      }

      await window.electronAPI?.saveToken(method, token, userData)

      isAuthenticated.value = true
      authMethod.value = method
      tokenPreview.value = `${token.slice(0, 4)}...${token.slice(-4)}`
      user.value = userData

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

  async function exportChannels(settings: ExportSettings): Promise<void> {
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

      // Build export data with selected fields
      const exportData = buildExportData(
        selectedGuild.value,
        channels.value,
        settings.selectedFields
      )

      // Format data according to selected format
      const { content, extension } = formatExportData(exportData, settings.format)

      // Generate filename
      const date = new Date().toISOString().split('T')[0]
      const serverName = selectedGuild.value.name.replace(/[^a-z0-9]/gi, '_')
      const filename = `${serverName}_channels_${date}.${extension}`

      // Export to file
      const filePath = await window.electronAPI?.exportChannels({
        content,
        extension,
        filename,
      })

      if (filePath) {
        toast?.success(`Channels exported successfully to: ${filePath}`, 6000)
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
    user.value = null
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

      if (stored && stored.method && stored.tokenPreview && stored.user) {
        isAuthenticated.value = true
        authMethod.value = stored.method
        tokenPreview.value = stored.tokenPreview
        user.value = stored.user

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
    user,
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
