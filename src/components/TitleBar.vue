<script setup lang="ts">
import { ref, onMounted } from 'vue'
import pkg from '../../package.json'

const isMaximized = ref(false)
const version = pkg.version

async function minimizeWindow() {
  await window.electronAPI?.minimizeWindow()
}

async function toggleMaximize() {
  await window.electronAPI?.maximizeWindow()
  isMaximized.value = (await window.electronAPI?.isWindowMaximized()) || false
}

async function closeWindow() {
  await window.electronAPI?.closeWindow()
}

onMounted(async () => {
  isMaximized.value = (await window.electronAPI?.isWindowMaximized()) || false
})
</script>

<template>
  <div class="titlebar bg-surface select-none">
    <!-- Draggable region (left side with logo) -->
    <div class="draggable flex items-center gap-3 px-4 py-2 flex-1">
      <img src="/logo.svg" alt="OutCord Logo" class="w-5 h-5" />
      <span class="text-sm font-medium text-text-secondary">OutCord v{{ version }}</span>
    </div>

    <!-- Window controls (right side) -->
    <div class="window-controls flex items-stretch">
      <!-- Minimize -->
      <button
        type="button"
        class="control-button px-4 hover:bg-surface-light transition-colors"
        title="Minimize"
        @click="minimizeWindow"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>

      <!-- Maximize/Restore -->
      <button
        type="button"
        class="control-button px-4 hover:bg-surface-light transition-colors"
        :title="isMaximized ? 'Restore' : 'Maximize'"
        @click="toggleMaximize"
      >
        <svg
          v-if="!isMaximized"
          class="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"
          />
        </svg>
        <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
          />
        </svg>
      </button>

      <!-- Close -->
      <button
        type="button"
        class="control-button px-4 hover:bg-accent-red hover:text-white transition-colors"
        title="Close"
        @click="closeWindow"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  display: flex;
  height: 40px;
  -webkit-app-region: no-drag;
}

.draggable {
  -webkit-app-region: drag;
}

.window-controls {
  -webkit-app-region: no-drag;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  outline: none;
}

.control-button:active {
  opacity: 0.7;
}
</style>
