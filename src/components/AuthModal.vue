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

const selectedMethod = ref<AuthMethod | null>(null)
const tokenInput = ref('')
const isPollingForToken = ref(false)
let pollInterval: number | null = null

// Cleanup on unmount
onUnmounted(() => {
  stopPolling()
})

function selectMethod(method: AuthMethod) {
  selectedMethod.value = method
  tokenInput.value = ''
}

function goBack() {
  selectedMethod.value = null
  tokenInput.value = ''
  stopPolling()
}

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
  <div
    class="min-h-screen bg-surface border border-surface-lighter rounded-2xl flex flex-col animate-fade-in overflow-hidden"
  >
    <!-- Draggable Header with Logo -->
    <div class="draggable-region flex flex-col items-center pt-8 pb-2 px-8">
      <div class="size-32 mb-2">
        <img src="/logo.png" alt="OutCord Logo" class="w-full h-full" draggable="false" />
      </div>
      <h1 class="text-3xl font-bold mb-1">
        <span class="text-white">Out</span><span class="text-cta">Cord</span>
      </h1>
      <p class="text-text-muted text-xs">Export your Discord data with ease</p>
    </div>

    <!-- Header with Back Button -->
    <div class="flex items-center gap-4 px-8 py-4">
      <!-- Left: Back Button (20%) -->
      <div class="w-1/5">
        <button
          v-if="selectedMethod"
          type="button"
          class="flex items-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
          @click="goBack"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span class="text-sm font-semibold">Back</span>
        </button>
      </div>

      <!-- Center: Heading (60%) -->
      <div class="w-3/5 text-center">
        <h2 class="text-xl font-bold text-text-primary">
          {{
            selectedMethod
              ? `${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)} Authentication`
              : 'Authentication Method'
          }}
        </h2>
      </div>

      <!-- Right: Empty spacer for symmetry (20%) -->
      <div class="w-1/5"></div>
    </div>

    <!-- Auth Content -->
    <div class="flex-1 flex flex-col px-8 pb-8">
      <!-- Method Selection View -->
      <div v-if="!selectedMethod" class="space-y-4 non-draggable animate-fade-in">
        <!-- User Login Button -->
        <button
          type="button"
          class="w-full p-6 cursor-pointer rounded-xl bg-background-lighter border-2 border-surface-lighter hover:border-brand hover:bg-surface-light transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-left group"
          @click="selectMethod('user')"
        >
          <div class="flex items-center gap-4">
            <div
              class="shrink-0 size-16 rounded-lg bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 transition-colors"
            >
              <span class="text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"
                  />
                </svg>
              </span>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-text-primary mb-1">User</h3>
              <p class="text-sm text-text-secondary">
                Sign in to export data from any server you're part of
              </p>
            </div>
          </div>
        </button>

        <!-- Bot Token Button -->
        <button
          type="button"
          class="w-full cursor-pointer p-6 rounded-xl bg-background-lighter border-2 border-surface-lighter hover:border-cta hover:bg-surface-light transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-left group"
          @click="selectMethod('bot')"
        >
          <div class="flex items-center gap-4">
            <div
              class="shrink-0 size-16 rounded-lg bg-cta/10 flex items-center justify-center group-hover:bg-cta/20 transition-colors"
            >
              <span class="text-2xl"
                ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5A2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5a2.5 2.5 0 0 0-2.5-2.5"
                  /></svg
              ></span>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-text-primary mb-1">Bot</h3>
              <p class="text-sm text-text-secondary">
                Provide a bot token to export data from servers the bot is connected to
              </p>
            </div>
          </div>
        </button>
      </div>

      <!-- Auth Form View -->
      <div v-else class="space-y-6 non-draggable animate-slide-up">
        <!-- Bot Token Input -->
        <div v-if="selectedMethod === 'bot'" class="space-y-4">
          <div class="space-y-2">
            <input
              id="token-input"
              v-model="tokenInput"
              type="password"
              placeholder="Enter bot token"
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
            :disabled="!tokenInput.trim() || isLoading"
            class="w-full py-3.5 px-6 rounded-xl font-bold text-white cta-gradient shadow-glow-cta cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            @click="handleAuthenticate"
          >
            {{ isLoading ? 'Connecting...' : 'Connect' }}
          </button>
        </div>

        <!-- User Login Options -->
        <div v-else class="space-y-4">
          <!-- Login with Discord Button (Primary) -->
          <button
            type="button"
            :disabled="isLoading || isPollingForToken"
            class="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-brand hover:bg-brand-400 shadow-glow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            @click="handleDiscordLogin"
          >
            {{ isPollingForToken ? 'Waiting for login...' : 'Sign in' }}
          </button>

          <!-- OR Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-surface-lighter"></div>
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-surface px-2 text-text-muted">or</span>
            </div>
          </div>

          <!-- Manual Token Input -->
          <div class="space-y-2">
            <input
              id="token-input"
              v-model="tokenInput"
              type="password"
              placeholder="Enter user token"
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

          <!-- Connect Button (for manual token) -->
          <button
            type="button"
            :disabled="!tokenInput.trim() || isLoading || isPollingForToken"
            class="w-full py-3.5 px-6 rounded-xl font-bold text-white cta-gradient shadow-glow-cta cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            @click="handleAuthenticate"
          >
            {{ isLoading ? 'Connecting...' : 'Connect' }}
          </button>
        </div>

        <!-- Help Text -->
        <div class="pt-2">
          <div
            v-if="selectedMethod === 'bot'"
            class="bg-background-lighter rounded-lg p-3 border border-surface-light"
          >
            <p class="text-xs text-text-muted text-center">
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
          </div>
          <div v-else class="bg-accent-red/10 rounded-lg p-3 border border-accent-red/30">
            <p class="text-xs text-accent-red text-center font-medium">
              ⚠️ Using user tokens may violate Discord's Terms of Service
            </p>
          </div>
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
