<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDiscord } from './composables/useDiscord'
import TitleBar from './components/TitleBar.vue'
import AuthModal from './components/AuthModal.vue'
import ServerSelector from './components/ServerSelector.vue'
import ChannelList from './components/ChannelList.vue'
import ExportButton from './components/ExportButton.vue'
import type { AuthMethod } from './types/app'

const discord = useDiscord()

const canExport = computed(() => {
  return discord.channels.value.length > 0 && discord.selectedGuildId.value !== null
})

// Resize window based on auth state
watch(() => discord.isAuthenticated.value, async (isAuth) => {
  if (isAuth) {
    await window.electronAPI?.resizeForApp()
  } else {
    await window.electronAPI?.resizeForAuth()
  }
}, { immediate: true })

async function handleAuthenticate(token: string, method: AuthMethod) {
  await discord.authenticate(token, method)
}

async function handleSelectServer(guildId: string) {
  await discord.loadChannels(guildId)
}

async function handleExport() {
  await discord.exportChannels()
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Auth Modal -->
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
      <div class="h-[40px]"></div>

      <!-- Header -->
      <header class="sticky top-[40px] z-40 bg-surface border-b border-surface-lighter">
        <div class="max-w-7xl mx-auto px-6 py-3">
          <div class="flex items-center justify-end gap-4">
            <!-- Auth Indicator -->
            <div
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light border border-surface-lighter"
            >
              <span class="text-lg">{{ discord.authMethod.value === 'bot' ? '🤖' : '👤' }}</span>
              <span class="text-sm text-text-secondary font-mono">
                {{ discord.tokenPreview.value }}
              </span>
            </div>

            <!-- Logout Button -->
            <button
              type="button"
              class="px-4 py-2 rounded-lg font-semibold text-brand border-2 border-brand hover:bg-brand hover:text-white transition-all duration-200"
              @click="discord.logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        <!-- Control Panel -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
          <ServerSelector
            :guilds="discord.guilds.value"
            :selected-guild-id="discord.selectedGuildId.value"
            :is-loading="discord.isLoading.value"
            @select-server="handleSelectServer"
          />

          <ExportButton
            :disabled="!canExport"
            :is-loading="discord.isLoading.value"
            @export="handleExport"
          />
        </div>

        <!-- Channel List -->
        <div class="animate-fade-in">
          <ChannelList :channels="discord.channels.value" :is-loading="discord.isLoading.value" />
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
    </div>
  </div>
</template>
