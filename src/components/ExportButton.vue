<script setup lang="ts">
defineProps<{
  disabled: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  export: []
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      type="button"
      :disabled="disabled || isLoading"
      class="group relative px-8 py-3.5 rounded-xl font-bold text-white cta-gradient shadow-glow-cta cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
      @click="emit('export')"
    >
      <!-- Background Animation -->
      <span
        class="absolute inset-0 bg-linear-to-r from-cta-light to-cta opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      ></span>

      <!-- Button Content -->
      <span class="relative flex items-center justify-center gap-2">
        <svg
          v-if="!isLoading"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <div
          v-else
          class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        <span>{{ isLoading ? 'Loading...' : 'Export' }}</span>
      </span>
    </button>
  </div>
</template>
