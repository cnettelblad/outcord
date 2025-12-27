<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import type { AuthMethod } from '../types/app'

defineProps<{
  isLoading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  authenticate: [token: string, method: AuthMethod]
}>()

const selectedMethod = ref<AuthMethod>('bot')
const tokenInput = ref('')
const isPollingForToken = ref(false)
let pollInterval: number | null = null

// Cleanup on unmount
onUnmounted(() => {
  stopPolling()
})

function handleAuthenticate() {
  if (!tokenInput.value.trim()) {
    return
  }

  emit('authenticate', tokenInput.value.trim(), selectedMethod.value)
}

async function handleDiscordLogin() {
  if (selectedMethod.value === 'bot') {
    // Bot tokens can't be obtained through login
    return
  }

  isPollingForToken.value = true

  // Open the Discord login window
  await window.electronAPI?.openDiscordLogin()

  // Poll for token every 2 seconds
  pollInterval = window.setInterval(async () => {
    const token = await window.electronAPI?.extractDiscordToken()

    if (token) {
      // Token found! Stop polling and authenticate
      stopPolling()
      await window.electronAPI?.closeDiscordLogin()
      emit('authenticate', token, 'user')
    }
  }, 2000)

  // Stop polling after 5 minutes
  setTimeout(() => {
    if (isPollingForToken.value) {
      stopPolling()
    }
  }, 300000)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  isPollingForToken.value = false
}
</script>

<template>
  <div class="min-h-screen bg-surface border border-surface-lighter rounded-2xl flex flex-col animate-fade-in overflow-hidden">
    <!-- Draggable Header with Logo -->
    <div class="draggable-region flex flex-col items-center pt-8 pb-6 px-8">
      <div class="w-16 h-16 mb-3">
        <img src="/logo.svg" alt="OutCord Logo" class="w-full h-full" draggable="false" />
      </div>
      <h1 class="text-3xl font-bold gradient-text mb-1">OutCord</h1>
      <p class="text-text-muted text-xs">Export your Discord data with ease</p>
    </div>

    <!-- Auth Content -->
    <div class="flex-1 flex flex-col justify-center px-8">
      <div class="space-y-6 non-draggable">
        <!-- Method Selector -->
        <div class="flex gap-3">
          <button
            type="button"
            :class="[
              'flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200',
              selectedMethod === 'bot'
                ? 'bg-brand text-white shadow-glow'
                : 'bg-surface-light text-text-secondary hover:bg-surface-lighter hover:text-text-primary',
            ]"
            @click="selectedMethod = 'bot'"
          >
            🤖 Bot Token
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200',
              selectedMethod === 'user'
                ? 'bg-brand text-white shadow-glow'
                : 'bg-surface-light text-text-secondary hover:bg-surface-lighter hover:text-text-primary',
            ]"
            @click="selectedMethod = 'user'"
          >
            👤 User Token
          </button>
        </div>

        <!-- Method Description -->
        <div class="bg-background-lighter rounded-xl p-4 border border-surface-light">
          <p v-if="selectedMethod === 'bot'" class="text-sm text-text-secondary leading-relaxed">
            Create a Discord bot and paste your bot token here. This is the
            <span class="text-cta font-semibold">recommended method</span> for exporting server
            data.
          </p>
          <p v-else class="text-sm text-text-secondary leading-relaxed">
            Paste your Discord user authorization token.
            <span class="text-accent-red font-semibold">Warning:</span>
            This method may be against Discord's Terms of Service. Use at your own risk.
          </p>
        </div>

        <!-- Token Input -->
        <div class="space-y-2">
          <label for="token-input" class="block text-sm font-semibold text-text-primary">
            {{ selectedMethod === 'bot' ? 'Bot Token' : 'User Token' }}
          </label>
          <input
            id="token-input"
            v-model="tokenInput"
            type="password"
            :placeholder="
              selectedMethod === 'bot' ? 'Enter your bot token' : 'Enter your user token'
            "
            class="w-full px-4 py-3 bg-surface-light border-2 border-surface-lighter rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200"
            @keyup.enter="handleAuthenticate"
          />
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 animate-fade-in"
        >
          <p class="text-accent-red text-sm font-medium">{{ error }}</p>
        </div>

        <!-- Connect Button -->
        <button
          type="button"
          :disabled="!tokenInput.trim() || isLoading || isPollingForToken"
          class="w-full py-3.5 px-6 rounded-xl font-bold text-white cta-gradient shadow-glow-cta disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          @click="handleAuthenticate"
        >
          {{ isLoading ? 'Connecting...' : 'Connect' }}
        </button>

        <!-- OR Divider (only for user token) -->
        <div v-if="selectedMethod === 'user'" class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-surface-lighter"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-surface px-2 text-text-muted">Or</span>
          </div>
        </div>

        <!-- Login with Discord Button (user token only) -->
        <button
          v-if="selectedMethod === 'user'"
          type="button"
          :disabled="isLoading || isPollingForToken"
          class="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-brand hover:bg-brand-400 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          @click="handleDiscordLogin"
        >
          {{ isPollingForToken ? 'Waiting for login...' : '🌐 Login with Discord' }}
        </button>

        <!-- Help Text -->
        <div class="pt-4 border-t border-surface-lighter">
          <p v-if="selectedMethod === 'bot'" class="text-xs text-text-muted text-center">
            Need help?
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              class="text-brand hover:text-brand-400 font-semibold transition-colors"
            >
              Create a bot application
            </a>
            and copy your bot token.
          </p>
          <p v-else class="text-xs text-text-muted text-center">
            Using user tokens may violate Discord's Terms of Service. Bot tokens are strongly
            recommended.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.draggable-region {
  -webkit-app-region: drag;
}

.non-draggable {
  -webkit-app-region: no-drag;
}
</style>
