<script setup lang="ts">
import { ref } from 'vue'
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

function handleAuthenticate() {
  if (!tokenInput.value.trim()) {
    return
  }

  emit('authenticate', tokenInput.value.trim(), selectedMethod.value)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in"
  >
    <div
      class="w-full max-w-md mx-4 bg-surface rounded-2xl shadow-elevation-3 border border-surface-lighter animate-slide-up"
    >
      <!-- Header -->
      <div class="p-8 pb-6 border-b border-surface-lighter">
        <h2 class="text-3xl font-bold gradient-text mb-2">Connect to Discord</h2>
        <p class="text-text-secondary text-sm">Choose your authentication method</p>
      </div>

      <!-- Content -->
      <div class="p-8 space-y-6">
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
          :disabled="!tokenInput.trim() || isLoading"
          class="w-full py-3.5 px-6 rounded-xl font-bold text-white cta-gradient shadow-glow-cta disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          @click="handleAuthenticate"
        >
          {{ isLoading ? 'Connecting...' : 'Connect' }}
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
