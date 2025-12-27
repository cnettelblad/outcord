<script setup lang="ts">
import type { DiscordGuild } from '../types/discord'

defineProps<{
  guilds: DiscordGuild[]
  selectedGuildId: string | null
  isLoading: boolean
}>()

const emit = defineEmits<{
  selectServer: [guildId: string]
}>()

function handleSelect(event: Event) {
  const target = event.target as HTMLSelectElement
  if (target.value) {
    emit('selectServer', target.value)
  }
}
</script>

<template>
  <div class="space-y-2">
    <label for="guild-select" class="block text-sm font-semibold text-text-primary">
      Select Server
    </label>
    <div class="relative">
      <select
        id="guild-select"
        :value="selectedGuildId || ''"
        :disabled="isLoading || guilds.length === 0"
        class="w-full px-4 py-3 pr-10 bg-surface-light border-2 border-surface-lighter rounded-xl text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        @change="handleSelect"
      >
        <option value="" disabled>
          {{ guilds.length === 0 ? 'No servers available' : 'Choose a server...' }}
        </option>
        <option
          v-for="guild in guilds"
          :key="guild.id"
          :value="guild.id"
          class="bg-surface text-text-primary"
        >
          {{ guild.name }}
        </option>
      </select>
      <div
        class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
