<script setup lang="ts">
const props = defineProps<{
  checked: boolean
  indeterminate?: boolean
}>()

const emit = defineEmits<{
  change: []
}>()
</script>

<template>
  <div
    class="relative inline-flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-200 cursor-pointer group"
    :class="[
      checked || indeterminate
        ? 'bg-brand border-brand shadow-sm'
        : 'bg-surface border-surface-lighter hover:border-brand/50 hover:bg-surface-light',
    ]"
    @click="emit('change')"
  >
    <!-- Checkmark -->
    <svg
      v-if="checked && !indeterminate"
      class="w-3.5 h-3.5 text-white transform transition-all duration-200"
      :class="checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
    </svg>

    <!-- Indeterminate (dash) -->
    <svg
      v-if="indeterminate"
      class="w-3.5 h-3.5 text-white transform transition-all duration-200"
      :class="indeterminate ? 'scale-100 opacity-100' : 'scale-0 opacity-0'"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 12h14" />
    </svg>

    <!-- Hover ring effect -->
    <div
      class="absolute inset-0 rounded-md ring-2 ring-brand/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
    ></div>
  </div>
</template>
