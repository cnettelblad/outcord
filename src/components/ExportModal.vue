<script setup lang="ts">
import { ref, watch } from 'vue'

export type ExportFormat = 'json' | 'csv' | 'markdown'

export interface ExportField {
  key: string
  label: string
  description: string
  defaultSelected: boolean
}

export interface ExportContext {
  title: string
  subtitle: string
  fields: ExportField[]
}

export interface ExportSettings {
  format: ExportFormat
  selectedFields: string[]
}

const props = defineProps<{
  isOpen: boolean
  context: ExportContext
}>()

const emit = defineEmits<{
  close: []
  export: [settings: ExportSettings]
}>()

const selectedFormat = ref<ExportFormat>('json')
const selectedFields = ref<Set<string>>(new Set())

// Initialize selected fields based on defaults
const initializeFields = () => {
  selectedFields.value = new Set(
    props.context.fields.filter((f) => f.defaultSelected).map((f) => f.key)
  )
}

// Watch for modal opening and reinitialize fields
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      initializeFields()
      selectedFormat.value = 'json'
    }
  }
)

function toggleField(fieldKey: string) {
  if (selectedFields.value.has(fieldKey)) {
    selectedFields.value.delete(fieldKey)
  } else {
    selectedFields.value.add(fieldKey)
  }
}

function isFieldSelected(fieldKey: string): boolean {
  return selectedFields.value.has(fieldKey)
}

function handleExport() {
  emit('export', {
    format: selectedFormat.value,
    selectedFields: Array.from(selectedFields.value),
  })
}

function selectAllFields() {
  selectedFields.value = new Set(props.context.fields.map((f) => f.key))
}

function deselectAllFields() {
  selectedFields.value = new Set()
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-2xl mx-4 bg-surface rounded-2xl shadow-elevation-3 border border-surface-lighter animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      <!-- Header -->
      <div class="sticky top-0 bg-surface p-6 pb-4 border-b border-surface-lighter z-10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold gradient-text mb-1">{{ context.title }}</h2>
            <p class="text-sm text-text-secondary">{{ context.subtitle }}</p>
          </div>
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-light transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <svg
              class="w-5 h-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Export Format -->
        <div class="space-y-3">
          <label class="block text-sm font-bold text-text-primary uppercase tracking-wide">
            Export Format
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button
              type="button"
              :class="[
                'p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                selectedFormat === 'json'
                  ? 'border-brand bg-brand/10 shadow-glow'
                  : 'border-surface-lighter hover:border-brand/50 hover:bg-surface-light',
              ]"
              @click="selectedFormat = 'json'"
            >
              <div class="text-center">
                <div class="text-2xl mb-2">📄</div>
                <div class="font-bold text-text-primary text-sm">JSON</div>
                <div class="text-xs text-text-muted mt-1">Structured data</div>
              </div>
            </button>

            <button
              type="button"
              :class="[
                'p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                selectedFormat === 'csv'
                  ? 'border-brand bg-brand/10 shadow-glow'
                  : 'border-surface-lighter hover:border-brand/50 hover:bg-surface-light',
              ]"
              @click="selectedFormat = 'csv'"
            >
              <div class="text-center">
                <div class="text-2xl mb-2">📊</div>
                <div class="font-bold text-text-primary text-sm">CSV</div>
                <div class="text-xs text-text-muted mt-1">Spreadsheet</div>
              </div>
            </button>

            <button
              type="button"
              :class="[
                'p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                selectedFormat === 'markdown'
                  ? 'border-brand bg-brand/10 shadow-glow'
                  : 'border-surface-lighter hover:border-brand/50 hover:bg-surface-light',
              ]"
              @click="selectedFormat = 'markdown'"
            >
              <div class="text-center">
                <div class="text-2xl mb-2">📝</div>
                <div class="font-bold text-text-primary text-sm">Markdown</div>
                <div class="text-xs text-text-muted mt-1">Documentation</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Field Selection -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-bold text-text-primary uppercase tracking-wide">
              Fields to Export
            </label>
            <div class="flex gap-2">
              <button
                type="button"
                class="text-xs text-brand hover:text-brand-400 font-semibold cursor-pointer"
                @click="selectAllFields"
              >
                Select All
              </button>
              <span class="text-text-muted">•</span>
              <button
                type="button"
                class="text-xs text-brand hover:text-brand-400 font-semibold cursor-pointer"
                @click="deselectAllFields"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Dynamic Fields -->
            <label
              v-for="field in context.fields"
              :key="field.key"
              class="flex items-center gap-3 p-3 rounded-lg bg-background-lighter border border-surface-lighter hover:border-surface-light cursor-pointer transition-colors"
              @click="toggleField(field.key)"
            >
              <input
                :checked="isFieldSelected(field.key)"
                type="checkbox"
                class="w-5 h-5 rounded border-2 border-surface-lighter bg-surface text-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
                @click.stop="toggleField(field.key)"
              />
              <div>
                <div class="text-sm font-semibold text-text-primary">{{ field.label }}</div>
                <div class="text-xs text-text-muted">{{ field.description }}</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-surface p-6 pt-4 border-t border-surface-lighter">
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-6 py-3 rounded-xl font-semibold text-text-secondary border-2 border-surface-lighter hover:bg-surface-light cursor-pointer transition-all duration-200"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-6 py-3 rounded-xl font-bold text-white cta-gradient shadow-glow-cta cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            @click="handleExport"
          >
            Export Channels
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
