<script setup lang="ts">
import { computed, watch, ref, provide } from 'vue'
import { useDiscord } from './composables/useDiscord'
import { useToast } from './composables/useToast'
import TitleBar from './components/TitleBar.vue'
import AuthModal from './components/AuthModal.vue'
import ServerSelector from './components/ServerSelector.vue'
import ChannelList from './components/ChannelList.vue'
import ExportButton from './components/ExportButton.vue'
import ExportModal, { type ExportSettings } from './components/ExportModal.vue'
import Toast from './components/Toast.vue'
import type { AuthMethod } from './types/app'
import { serverChannelsContext } from './utils/export-contexts'
import { getAvatarUrl } from './utils/discord-urls'
import { getDisplayName } from './utils/formatters/user-formatters'

const discord = useDiscord()
const toast = useToast()
const showExportModal = ref(false)
const exportContext = serverChannelsContext

// Provide toast to all child components
provide('toast', toast)

const canExport = computed(() => {
  return discord.channels.value.length > 0 && discord.selectedGuildId.value !== null
})

// Resize window based on auth state
watch(
  () => discord.isAuthenticated.value,
  async (isAuth) => {
    if (isAuth) {
      await window.electronAPI?.resizeForApp()
    } else {
      await window.electronAPI?.resizeForAuth()
    }
  },
  { immediate: true }
)

async function handleAuthenticate(token: string, method: AuthMethod) {
  await discord.authenticate(token, method)
}

async function handleSelectServer(guildId: string) {
  await discord.loadChannels(guildId)
}

async function handleLoadDMs() {
  await discord.loadDMs()
}

function handleExport() {
  showExportModal.value = true
}

async function handleExportWithSettings(settings: ExportSettings) {
  showExportModal.value = false
  await discord.exportChannels(settings)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Auth Modal -->
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <AuthModal
        v-if="!discord.isAuthenticated.value"
        :is-loading="discord.isLoading.value"
        :error="discord.error.value"
        @authenticate="handleAuthenticate"
      />

      <!-- Main App -->
      <div v-else class="flex flex-col min-h-screen">
        <!-- Custom Title Bar (Fixed) -->
        <div class="fixed top-0 left-0 right-0 z-50">
          <TitleBar />
        </div>

        <!-- Spacer for titlebar -->
        <div class="h-10"></div>

        <!-- Header -->
        <header class="sticky top-10 z-40 bg-surface border-b border-surface-lighter">
          <div class="max-w-7xl mx-auto px-6 py-3">
            <div class="flex items-center justify-between gap-6">
              <!-- Left Side: DM Button & Server Selector -->
              <div class="flex items-center gap-3 flex-1">
                <!-- DM Button -->
                <button
                  type="button"
                  :disabled="discord.authMethod.value === 'bot'"
                  :class="[
                    'px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2',
                    discord.authMethod.value === 'bot'
                      ? 'bg-surface-light border-2 border-surface-lighter text-text-muted cursor-not-allowed opacity-50'
                      : discord.isDMMode.value
                        ? 'bg-brand text-white shadow-glow cursor-pointer'
                        : 'bg-surface-light border-2 border-surface-lighter text-text-primary hover:bg-surface-lighter cursor-pointer',
                  ]"
                  :title="
                    discord.authMethod.value === 'bot'
                      ? 'DMs are not available for bot accounts'
                      : 'View your direct messages'
                  "
                  @click="handleLoadDMs"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>DMs</span>
                </button>

                <!-- Server Selector -->
                <div class="flex-1 max-w-md">
                  <ServerSelector
                    :guilds="discord.guilds.value"
                    :selected-guild-id="discord.selectedGuildId.value"
                    :is-loading="discord.isLoading.value"
                    :show-label="false"
                    @select-server="handleSelectServer"
                  />
                </div>
              </div>

              <!-- Right Side: Auth & Logout -->
              <div class="flex items-center gap-4">
                <!-- Export Button -->
                <ExportButton
                  :disabled="!canExport"
                  :is-loading="discord.isLoading.value"
                  @export="handleExport"
                />

                <!-- Auth Indicator -->
                <div
                  class="flex items-center gap-3 px-4 py-2 rounded-lg bg-surface-light border border-surface-lighter"
                >
                  <!-- User Avatar -->
                  <div
                    class="w-8 h-8 rounded-full bg-background-lighter flex items-center justify-center overflow-hidden shrink-0"
                  >
                    <img
                      v-if="
                        discord.user.value &&
                        getAvatarUrl(discord.user.value.id, discord.user.value.avatar)
                      "
                      :src="getAvatarUrl(discord.user.value.id, discord.user.value.avatar)!"
                      :alt="getDisplayName(discord.user.value)"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-xs font-bold text-text-secondary">
                      {{ getDisplayName(discord.user.value).charAt(0).toUpperCase() }}
                    </span>
                  </div>

                  <!-- User Info -->
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-text-primary">
                      {{ getDisplayName(discord.user.value) }}
                    </span>
                    <span class="text-xs text-text-muted">
                      {{ discord.authMethod.value === 'bot' ? 'Bot Account' : 'User Account' }}
                    </span>
                  </div>
                </div>

                <!-- Logout Button -->
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg font-semibold text-brand border-2 border-brand hover:bg-brand hover:text-white cursor-pointer transition-all duration-200"
                  @click="discord.logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <!-- Channel List -->
          <div class="animate-fade-in">
            <ChannelList
              :channels="discord.channels.value"
              :dmChannels="discord.dmChannels.value"
              :isDMMode="discord.isDMMode.value"
              :isLoading="discord.isLoading.value"
            />
          </div>
        </main>

        <!-- Footer -->
        <footer
          v-if="discord.selectedGuild.value"
          class="sticky bottom-0 bg-surface/80 backdrop-blur-lg border-t border-surface-lighter shadow-elevation-1"
        >
          <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex items-center justify-center gap-3 text-sm">
              <span class="text-text-muted">Server:</span>
              <span class="font-semibold text-text-primary">
                {{ discord.selectedGuild.value.name }}
              </span>
              <span class="text-text-muted">•</span>
              <span class="text-cta font-semibold">
                {{ discord.channels.value.filter((ch) => ch.type !== 4).length }}
              </span>
              <span class="text-text-muted">channels</span>
            </div>
          </div>
        </footer>

        <!-- Export Modal -->
        <ExportModal
          :is-open="showExportModal"
          :context="exportContext"
          @close="showExportModal = false"
          @export="handleExportWithSettings"
        />
      </div>
    </Transition>

    <!-- Toast Notifications -->
    <Toast
      v-for="t in toast.toasts.value"
      :key="t.id"
      :message="t.message"
      :type="t.type"
      :show="true"
      @close="toast.removeToast(t.id)"
    />
  </div>
</template>
