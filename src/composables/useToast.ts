import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  message: string
  type: ToastType
  id: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function showToast(message: string, type: ToastType = 'info', duration = 4000) {
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

  function success(message: string, duration = 4000) {
    return showToast(message, 'success', duration)
  }

  function error(message: string, duration = 5000) {
    return showToast(message, 'error', duration)
  }

  function info(message: string, duration = 4000) {
    return showToast(message, 'info', duration)
  }

  function warning(message: string, duration = 4000) {
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
