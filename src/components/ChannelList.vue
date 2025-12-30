<script setup lang="ts">
import { computed } from 'vue'
import type { DiscordChannel } from '../types/discord'
import type { DiscordDMChannel } from '../vite-env'
import { channelTypeToString } from '../utils/discord-api'

const props = defineProps<{
  channels: DiscordChannel[]
  dmChannels: DiscordDMChannel[]
  isDMMode: boolean
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

function getDMName(dm: DiscordDMChannel): string {
  if (dm.type === 3) {
    // Group DM
    return dm.recipients.map((r) => r.global_name || r.username).join(', ')
  }
  // Direct DM
  const recipient = dm.recipients[0]
  return recipient?.global_name || recipient?.username || 'Unknown User'
}

function getDMAvatar(dm: DiscordDMChannel): string | null {
  if (dm.type === 3 || !dm.recipients[0]) return null
  const recipient = dm.recipients[0]
  if (!recipient.avatar) return null
  return `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png?size=64`
}

function getSnowflakeTimestamp(snowflake: string | null): number | null {
  if (!snowflake) return null
  const DISCORD_EPOCH = 1420070400000
  const timestamp = Number(BigInt(snowflake) >> BigInt(22)) + DISCORD_EPOCH
  return timestamp
}

function formatLastMessageDate(dm: DiscordDMChannel): string {
  const timestamp = getSnowflakeTimestamp(dm.last_message_id)
  if (!timestamp) return 'No messages'

  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Less than 1 day - show time
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Less than 7 days - show day name
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: 'long' })
  }

  // Less than 1 year - show month and day
  if (diff < 365 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Show full date
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}

const sortedDMChannels = computed(() => {
  return [...props.dmChannels].sort((a, b) => {
    const timestampA = getSnowflakeTimestamp(a.last_message_id) || 0
    const timestampB = getSnowflakeTimestamp(b.last_message_id) || 0
    return timestampB - timestampA // Descending order (most recent first)
  })
})
</script>

<template>
  <div
    class="bg-surface rounded-2xl border border-surface-lighter shadow-elevation-2 overflow-hidden"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="p-12 text-center animate-fade-in">
      <div
        class="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"
      ></div>
      <p class="text-text-secondary animate-pulse">Loading channels...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="(isDMMode && dmChannels.length === 0) || (!isDMMode && channels.length === 0)"
      class="p-16 text-center animate-fade-in"
    >
      <div
        class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-brand/20 to-cta/20 mb-6"
      >
        <svg
          class="w-12 h-12 text-brand"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </div>
      <h3 class="text-text-primary text-xl font-bold mb-2">
        {{ isDMMode ? 'No direct messages' : 'No channels yet' }}
      </h3>
      <p class="text-text-muted text-sm max-w-sm mx-auto">
        {{
          isDMMode
            ? 'You have no direct message conversations'
            : 'Select a server from the dropdown above to view and export its channels'
        }}
      </p>
    </div>

    <!-- DM List -->
    <div v-else-if="isDMMode" class="max-h-[600px] overflow-y-auto custom-scrollbar">
      <!-- DM Count Header -->
      <div
        class="sticky top-0 bg-surface-light/95 backdrop-blur-sm px-6 py-4 border-b border-surface-lighter z-10"
      >
        <p class="text-text-secondary text-sm font-semibold">
          <span class="text-cta">{{ dmChannels.length }}</span>
          direct messages
        </p>
      </div>

      <!-- DM Items -->
      <div class="p-4 space-y-2">
        <div
          v-for="dm in sortedDMChannels"
          :key="dm.id"
          class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light/50 hover:bg-surface-lighter hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <!-- DM Avatar -->
          <div
            class="w-10 h-10 rounded-full bg-background-lighter flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <img
              v-if="getDMAvatar(dm)"
              :src="getDMAvatar(dm)!"
              :alt="getDMName(dm)"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-sm font-bold text-text-secondary">
              {{ getDMName(dm).charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- DM Info -->
          <div class="flex-1 min-w-0">
            <span
              class="block font-medium text-text-primary group-hover:text-white transition-colors truncate"
            >
              {{ getDMName(dm) }}
            </span>
            <span class="block text-xs text-text-muted">
              {{ formatLastMessageDate(dm) }}
            </span>
          </div>

          <!-- DM Type Badge -->
          <span
            v-if="dm.type === 3"
            class="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-background-lighter text-text-muted"
          >
            Group
          </span>
        </div>
      </div>
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
              class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light/50 hover:bg-surface-lighter hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
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
        <div v-for="category in channelsByCategory.categories" :key="category.id" class="space-y-2">
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
              class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light/50 hover:bg-surface-lighter hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
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
