<script setup lang="ts">
import { computed } from 'vue'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  show: boolean
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
})

const emit = defineEmits<{
  close: []
}>()

const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
    default:
      return 'ℹ'
  }
})

const bgColor = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-accent-green/90'
    case 'error':
      return 'bg-accent-red/90'
    case 'warning':
      return 'bg-accent-yellow/90'
    case 'info':
    default:
      return 'bg-brand/90'
  }
})

const borderColor = computed(() => {
  switch (props.type) {
    case 'success':
      return 'border-accent-green'
    case 'error':
      return 'border-accent-red'
    case 'warning':
      return 'border-accent-yellow'
    case 'info':
    default:
      return 'border-brand'
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="show"
      :class="[
        bgColor,
        borderColor,
        'fixed bottom-6 right-6 z-[100] max-w-md rounded-xl border-2 p-4 shadow-elevation-3 backdrop-blur-sm',
      ]"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
        >
          <span class="text-sm font-bold">{{ icon }}</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-white">{{ message }}</p>
        </div>
        <button
          class="flex-shrink-0 text-white/70 transition-colors hover:text-white"
          @click="emit('close')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>
