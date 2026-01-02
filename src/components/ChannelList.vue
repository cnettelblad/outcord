<script setup lang="ts">
import { computed } from 'vue'
import type { DiscordChannel, DiscordRole, GuildMember } from '../types/discord'
import type { DiscordDMChannel } from '../vite-env'
import { channelTypeToString } from '../utils/discord-api'
import { getDMChannelAvatarUrl } from '../utils/discord-urls'
import { getDMChannelName, getInitial } from '../utils/formatters/user-formatters'
import { formatDMLastMessageDate } from '../utils/formatters/date-formatters'
import {
  groupChannelsByCategory,
  sortDMChannelsByLastMessage,
} from '../utils/discord/channel-grouping'
import { canReadChannel } from '../utils/permissions'
import ChannelIcon from './ChannelIcon.vue'
import Checkbox from './Checkbox.vue'

const props = defineProps<{
  channels: DiscordChannel[]
  dmChannels: DiscordDMChannel[]
  roles: DiscordRole[]
  currentMember: GuildMember | null
  guildId: string | null
  isDMMode: boolean
  isLoading: boolean
  isExportingThreads: boolean
  threadFetchProgress: number
  selectedChannelIds: Set<string>
  selectedDMIds: Set<string>
}>()

const emit = defineEmits<{
  toggleChannel: [id: string]
  toggleDM: [id: string]
  selectAllChannels: []
  deselectAllChannels: []
  selectAllDMs: []
  deselectAllDMs: []
  exportForumThreads: [channelId: string, channelName: string]
}>()

const channelsByCategory = computed(() => groupChannelsByCategory(props.channels))

const sortedDMChannels = computed(() => sortDMChannelsByLastMessage(props.dmChannels))

const selectableChannels = computed(() => props.channels.filter((ch) => ch.type !== 4))

function checkChannelAccess(channel: DiscordChannel): boolean {
  if (!props.currentMember || !props.guildId || props.roles.length === 0) {
    return true
  }

  try {
    return canReadChannel(props.currentMember, channel, props.roles, props.channels, props.guildId)
  } catch {
    return true
  }
}

const allChannelsSelected = computed(() => {
  if (selectableChannels.value.length === 0) return false
  return selectableChannels.value.every((ch) => props.selectedChannelIds.has(ch.id))
})

const someChannelsSelected = computed(() => {
  return (
    selectableChannels.value.some((ch) => props.selectedChannelIds.has(ch.id)) &&
    !allChannelsSelected.value
  )
})

const allDMsSelected = computed(() => {
  if (props.dmChannels.length === 0) return false
  return props.dmChannels.every((dm) => props.selectedDMIds.has(dm.id))
})

const someDMsSelected = computed(() => {
  return props.dmChannels.some((dm) => props.selectedDMIds.has(dm.id)) && !allDMsSelected.value
})

function toggleAllChannels() {
  if (allChannelsSelected.value) {
    emit('deselectAllChannels')
  } else {
    emit('selectAllChannels')
  }
}

function toggleAllDMs() {
  if (allDMsSelected.value) {
    emit('deselectAllDMs')
  } else {
    emit('selectAllDMs')
  }
}
</script>

<template>
  <div
    class="h-full bg-surface rounded-2xl border border-surface-lighter shadow-elevation-2 overflow-hidden flex flex-col"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center p-12 animate-fade-in">
      <div class="text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"
        ></div>
        <p class="text-text-secondary animate-pulse">
          {{
            isExportingThreads
              ? `Fetching forum threads... (${threadFetchProgress} fetched)`
              : 'Loading channels...'
          }}
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="(isDMMode && dmChannels.length === 0) || (!isDMMode && channels.length === 0)"
      class="flex-1 flex items-center justify-center p-16 animate-fade-in"
    >
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-brand/20 to-cta/20 mb-6"
        >
          <svg class="w-12 h-12 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>

    <!-- DM List -->
    <div v-else-if="isDMMode" class="flex-1 overflow-y-auto custom-scrollbar">
      <!-- DM Count Header -->
      <div
        class="sticky top-0 bg-surface-light/95 backdrop-blur-sm px-6 py-4 border-b border-surface-lighter z-10"
      >
        <div class="flex items-center gap-3">
          <Checkbox
            :checked="allDMsSelected"
            :indeterminate="someDMsSelected"
            @change="toggleAllDMs"
          />
          <p class="text-text-secondary text-sm font-semibold">
            <span class="text-cta">{{ dmChannels.length }}</span>
            direct messages
          </p>
        </div>
      </div>

      <!-- DM Items -->
      <div class="p-4 space-y-2">
        <div
          v-for="dm in sortedDMChannels"
          :key="dm.id"
          class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light/50 hover:bg-surface-lighter hover:shadow-md transition-all duration-200"
        >
          <!-- Checkbox -->
          <Checkbox :checked="selectedDMIds.has(dm.id)" @change="emit('toggleDM', dm.id)" />

          <!-- DM Avatar -->
          <div
            class="w-10 h-10 rounded-full bg-background-lighter flex items-center justify-center overflow-hidden shrink-0"
          >
            <img
              v-if="getDMChannelAvatarUrl(dm)"
              :src="getDMChannelAvatarUrl(dm)!"
              :alt="getDMChannelName(dm)"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-sm font-bold text-text-secondary">
              {{ getInitial(getDMChannelName(dm)) }}
            </span>
          </div>

          <!-- DM Info -->
          <div class="flex-1 min-w-0">
            <span
              class="block font-medium text-text-primary group-hover:text-white transition-colors truncate"
            >
              {{ getDMChannelName(dm) }}
            </span>
            <span class="block text-xs text-text-muted">
              {{ formatDMLastMessageDate(dm) }}
            </span>
          </div>

          <!-- DM Type Badge -->
          <span
            v-if="dm.type === 3"
            class="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-background-lighter text-text-muted"
          >
            Group
          </span>
        </div>
      </div>
    </div>

    <!-- Channels List -->
    <div v-else class="flex-1 overflow-y-auto custom-scrollbar">
      <!-- Channel Count Header -->
      <div
        class="sticky top-0 bg-surface-light/95 backdrop-blur-sm px-6 py-4 border-b border-surface-lighter z-10"
      >
        <div class="flex items-center gap-3">
          <Checkbox
            :checked="allChannelsSelected"
            :indeterminate="someChannelsSelected"
            @change="toggleAllChannels"
          />
          <p class="text-text-secondary text-sm font-semibold">
            <span class="text-cta">{{ channels.filter((ch) => ch.type !== 4).length }}</span>
            channels found
          </p>
        </div>
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
              class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light/50 hover:bg-surface-lighter hover:shadow-md transition-all duration-200"
            >
              <!-- Checkbox -->
              <Checkbox
                :checked="selectedChannelIds.has(channel.id)"
                @change="emit('toggleChannel', channel.id)"
              />

              <!-- Channel Icon -->
              <ChannelIcon :type="channel.type" class="shrink-0" />

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

              <!-- No Access Badge -->
              <span
                v-if="!checkChannelAccess(channel)"
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-yellow-600 text-white"
              >
                No access
              </span>

              <!-- Forum Export Button -->
              <button
                v-if="channel.type === 15"
                type="button"
                class="shrink-0 p-1.5 rounded-md hover:bg-surface-lighter transition-colors text-text-muted hover:text-brand"
                title="Export forum threads"
                @click.stop="emit('exportForumThreads', channel.id, channel.name)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </button>
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
              class="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-light/50 hover:bg-surface-lighter hover:shadow-md transition-all duration-200"
            >
              <!-- Checkbox -->
              <Checkbox
                :checked="selectedChannelIds.has(channel.id)"
                @change="emit('toggleChannel', channel.id)"
              />

              <!-- Channel Icon -->
              <ChannelIcon :type="channel.type" class="shrink-0" />

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

              <!-- No Access Badge -->
              <span
                v-if="!checkChannelAccess(channel)"
                class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-yellow-600 text-white"
              >
                No access
              </span>

              <!-- Forum Export Button -->
              <button
                v-if="channel.type === 15"
                type="button"
                class="shrink-0 p-1.5 rounded-md hover:bg-surface-lighter transition-colors text-text-muted hover:text-brand"
                title="Export forum threads"
                @click.stop="emit('exportForumThreads', channel.id, channel.name)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
