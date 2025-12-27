import { ipcRenderer, contextBridge } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  },

  // Auth
  saveToken: (method: 'bot' | 'user', token: string) =>
    ipcRenderer.invoke('auth:save-token', method, token),
  validateToken: (token: string, method: 'bot' | 'user') =>
    ipcRenderer.invoke('auth:validate-token', token, method),
  clearToken: () => ipcRenderer.invoke('auth:clear-token'),
  getStoredAuth: () => ipcRenderer.invoke('auth:get-stored'),

  // Discord API
  fetchGuilds: () => ipcRenderer.invoke('discord:fetch-guilds'),
  fetchChannels: (guildId: string) => ipcRenderer.invoke('discord:fetch-channels', guildId),

  // Export
  exportChannels: (data: unknown) => ipcRenderer.invoke('export:channels', data),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  resizeForAuth: () => ipcRenderer.invoke('window:resize-for-auth'),
  resizeForApp: () => ipcRenderer.invoke('window:resize-for-app'),
})
