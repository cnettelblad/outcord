import { ref } from 'vue'
import { TOAST_DURATIONS } from '../constants/app'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  message: string
  type: ToastType
  id: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function showToast(message: string, type: ToastType = 'info', duration = TOAST_DURATIONS.INFO) {
    const id = nextId++
    const toast: Toast = { message, type, id }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function removeToast(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message: string, duration = TOAST_DURATIONS.SUCCESS) {
    return showToast(message, 'success', duration)
  }

  function error(message: string, duration = TOAST_DURATIONS.ERROR) {
    return showToast(message, 'error', duration)
  }

  function info(message: string, duration = TOAST_DURATIONS.INFO) {
    return showToast(message, 'info', duration)
  }

  function warning(message: string, duration = TOAST_DURATIONS.WARNING) {
    return showToast(message, 'warning', duration)
  }

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
