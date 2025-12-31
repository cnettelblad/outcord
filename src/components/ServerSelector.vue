<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { DiscordGuild } from '../types/discord'
import { getGuildIconUrl } from '../utils/discord-urls'

const props = withDefaults(
  defineProps<{
    guilds: DiscordGuild[]
    selectedGuildId: string | null
    isLoading: boolean
    showLabel?: boolean
  }>(),
  {
    showLabel: true,
  }
)

const emit = defineEmits<{
  selectServer: [guildId: string]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const maxHeight = ref('16rem')

const selectedGuild = computed(() => {
  return props.guilds.find((g) => g.id === props.selectedGuildId)
})

function calculateMaxHeight() {
  if (!dropdownRef.value) return

  const rect = dropdownRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - rect.bottom
  const padding = 16 // 1rem padding from bottom

  // Use the smaller of: available space or 384px (24rem)
  const calculatedHeight = Math.min(spaceBelow - padding, 384)
  maxHeight.value = `${Math.max(calculatedHeight, 128)}px` // Minimum 128px (8rem)
}

async function toggleDropdown() {
  if (props.isLoading || props.guilds.length === 0) return
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    await nextTick()
    calculateMaxHeight()
  }
}

function selectGuild(guild: DiscordGuild) {
  emit('selectServer', guild.id)
  isOpen.value = false
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.custom-dropdown')) {
    isOpen.value = false
  }
}

// Add/remove click outside listener and window resize listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', () => {
    if (isOpen.value) {
      calculateMaxHeight()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', () => {
    if (isOpen.value) {
      calculateMaxHeight()
    }
  })
})
</script>

<template>
  <div :class="showLabel ? 'space-y-2' : ''">
    <label v-if="showLabel" class="block text-sm font-semibold text-text-primary">
      Select Server
    </label>
    <div ref="dropdownRef" class="relative custom-dropdown">
      <!-- Dropdown Button -->
      <button
        type="button"
        :disabled="isLoading || guilds.length === 0"
        class="w-full px-4 py-3 pr-10 bg-surface-light border-2 border-surface-lighter rounded-xl text-text-primary cursor-pointer focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-left"
        @click="toggleDropdown"
      >
        <div class="flex items-center gap-3">
          <!-- Selected Guild Icon -->
          <div
            v-if="selectedGuild"
            class="w-8 h-8 rounded-full bg-background-lighter flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <img
              v-if="getGuildIconUrl(selectedGuild.id, selectedGuild.icon)"
              :src="getGuildIconUrl(selectedGuild.id, selectedGuild.icon)!"
              :alt="selectedGuild.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-xs font-bold text-text-secondary">
              {{ selectedGuild.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Selected Guild Name or Placeholder -->
          <span :class="selectedGuild ? 'text-text-primary' : 'text-text-muted'">
            {{
              selectedGuild
                ? selectedGuild.name
                : guilds.length === 0
                  ? 'No servers available'
                  : 'Choose a server...'
            }}
          </span>
        </div>

        <!-- Dropdown Arrow -->
        <div
          class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary transition-transform duration-200"
          :class="isOpen ? 'rotate-180' : ''"
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
      </button>

      <!-- Dropdown Menu -->
      <div
        v-if="isOpen && guilds.length > 0"
        class="absolute z-50 w-full mt-2 bg-surface border-2 border-surface-lighter rounded-xl shadow-elevation-3 overflow-y-auto custom-scrollbar animate-fade-in"
        :style="{ maxHeight }"
      >
        <button
          v-for="guild in guilds"
          :key="guild.id"
          type="button"
          class="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-light transition-colors cursor-pointer text-left"
          :class="selectedGuildId === guild.id ? 'bg-surface-light' : ''"
          @click="selectGuild(guild)"
        >
          <!-- Guild Icon -->
          <div
            class="w-8 h-8 rounded-full bg-background-lighter flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <img
              v-if="getGuildIconUrl(guild.id, guild.icon)"
              :src="getGuildIconUrl(guild.id, guild.icon)!"
              :alt="guild.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-xs font-bold text-text-secondary">
              {{ guild.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Guild Name -->
          <span class="flex-1 text-text-primary font-medium truncate">
            {{ guild.name }}
          </span>

          <!-- Selected Indicator -->
          <svg
            v-if="selectedGuildId === guild.id"
            class="w-5 h-5 text-cta flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
