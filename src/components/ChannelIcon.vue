<script setup lang="ts">
import { computed } from 'vue'
import { CHANNEL_TYPE_ICONS } from '../utils/discord-utils'

const props = defineProps<{
  type: number
  size?: string
}>()

const svgContent = computed(() => CHANNEL_TYPE_ICONS[props.type] || null)
const sizeClass = computed(() => props.size || 'w-5 h-5')
</script>

<template>
  <span
    v-if="svgContent"
    :class="sizeClass"
    class="inline-block text-text-muted"
    v-html="svgContent"
  ></span>
  <span v-else :class="sizeClass" class="inline-block text-text-muted">•</span>
</template>
