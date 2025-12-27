<script setup lang="ts">
import { computed } from 'vue'
import type { DiscordChannel } from '../types/discord'
import { channelTypeToString } from '../utils/discord-api'

const props = defineProps<{
  channels: DiscordChannel[]
  isLoading: boolean
}>()

const channelsByCategory = computed(() => {
  // Sort categories by position
  const categories = props.channels
    .filter((ch) => ch.type === 4)
    .sort((a, b) => a.position - b.position)

  const regularChannels = props.channels.filter((ch) => ch.type !== 4)

  const grouped = new Map<string, DiscordChannel[]>()

  // Add uncategorized channels (sorted by position)
  const uncategorized = regularChannels
    .filter((ch) => !ch.parent_id)
    .sort((a, b) => a.position - b.position)
  if (uncategorized.length > 0) {
    grouped.set('uncategorized', uncategorized)
  }

  // Group channels by category and sort by position
  categories.forEach((category) => {
    const channelsInCategory = regularChannels
      .filter((ch) => ch.parent_id === category.id)
      .sort((a, b) => a.position - b.position)
    if (channelsInCategory.length > 0) {
      grouped.set(category.id, channelsInCategory)
    }
  })

  return { categories, grouped }
})

function getChannelTypeIcon(type: number): string {
  const icons: Record<number, string> = {
    0: '#',
    2: '🔊',
    4: '📁',
    5: '📢',
    13: '🎙️',
    15: '💬',
  }
  return icons[type] || '•'
}
</script>

<template>
  <div
    class="bg-surface rounded-2xl border border-surface-lighter shadow-elevation-2 overflow-hidden"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="p-12 text-center">
      <div
        class="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"
      ></div>
      <p class="text-text-secondary">Loading channels...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="channels.length === 0" class="p-12 text-center">
      <svg
        class="w-16 h-16 mx-auto mb-4 text-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p class="text-text-secondary text-lg font-semibold mb-2">No channels to display</p>
      <p class="text-text-muted text-sm">Select a server to view its channels</p>
    </div>

    <!-- Channels List -->
    <div v-else class="max-h-[600px] overflow-y-auto custom-scrollbar">
      <!-- Channel Count Header -->
      <div
        class="sticky top-0 bg-surface-light/95 backdrop-blur-sm px-6 py-4 border-b border-surface-lighter z-10"
      >
        <p class="text-text-secondary text-sm font-semibold">
          <span class="text-cta">{{ channels.filter((ch) => ch.type !== 4).length }}</span>
          channels found
        </p>
      </div>

      <!-- Channel Groups -->
      <div class="p-4 space-y-6">
        <!-- Uncategorized Channels First -->
        <div v-if="channelsByCategory.grouped.has('uncategorized')" class="space-y-2">
          <!-- Category Header -->
          <div class="flex items-center gap-2 px-2 py-1">
            <svg class="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">
              Uncategorized
            </h3>
          </div>

          <!-- Channels -->
          <div class="space-y-1">
            <div
              v-for="channel in channelsByCategory.grouped.get('uncategorized')"
              :key="channel.id"
              class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light/50 hover:bg-surface-lighter transition-all duration-200 cursor-pointer"
            >
              <!-- Channel Icon -->
              <span class="text-lg flex-shrink-0">{{ getChannelTypeIcon(channel.type) }}</span>

              <!-- Channel Name -->
              <span
                class="flex-1 font-medium text-text-primary group-hover:text-white transition-colors truncate"
              >
                {{ channel.name }}
              </span>

              <!-- Channel Type Badge -->
              <span
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-background-lighter text-text-muted"
              >
                {{ channelTypeToString(channel.type) }}
              </span>

              <!-- NSFW Badge -->
              <span
                v-if="channel.nsfw"
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-accent-red text-white"
              >
                NSFW
              </span>
            </div>
          </div>
        </div>

        <!-- Categorized Channels (sorted by category position) -->
        <div
          v-for="category in channelsByCategory.categories"
          :key="category.id"
          class="space-y-2"
        >
          <!-- Category Header -->
          <div class="flex items-center gap-2 px-2 py-1">
            <svg class="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">
              {{ category.name }}
            </h3>
          </div>

          <!-- Channels -->
          <div v-if="channelsByCategory.grouped.get(category.id)" class="space-y-1">
            <div
              v-for="channel in channelsByCategory.grouped.get(category.id)"
              :key="channel.id"
              class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light/50 hover:bg-surface-lighter transition-all duration-200 cursor-pointer"
            >
              <!-- Channel Icon -->
              <span class="text-lg flex-shrink-0">{{ getChannelTypeIcon(channel.type) }}</span>

              <!-- Channel Name -->
              <span
                class="flex-1 font-medium text-text-primary group-hover:text-white transition-colors truncate"
              >
                {{ channel.name }}
              </span>

              <!-- Channel Type Badge -->
              <span
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-background-lighter text-text-muted"
              >
                {{ channelTypeToString(channel.type) }}
              </span>

              <!-- NSFW Badge -->
              <span
                v-if="channel.nsfw"
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-accent-red text-white"
              >
                NSFW
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
