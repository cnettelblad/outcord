export const POLLING = {
  INTERVAL: 2000,
  TIMEOUT: 300000,
} as const

export const TOAST_DURATIONS = {
  SUCCESS: 4000,
  ERROR: 5000,
  INFO: 4000,
  WARNING: 4000,
} as const

export const WINDOW_SIZES = {
  AUTH: { width: 500, height: 700, minWidth: 450, minHeight: 650 },
  APP: { width: 1200, height: 800, minWidth: 900, minHeight: 600 },
} as const
