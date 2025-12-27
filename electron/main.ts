import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as storageService from './services/storage-service.js'
import * as discordService from './services/discord-service.js'
import * as exportService from './services/export-service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// IPC Handlers

// Auth handlers
ipcMain.handle('auth:save-token', (_event, method: 'bot' | 'user', token: string) => {
  storageService.saveToken(method, token)
  return true
})

ipcMain.handle('auth:validate-token', async (_event, token: string, method: 'bot' | 'user') => {
  return discordService.validateToken(token, method)
})

ipcMain.handle('auth:clear-token', () => {
  storageService.clearToken()
  return true
})

ipcMain.handle('auth:get-stored', () => {
  const auth = storageService.getToken()
  if (!auth) return null

  return {
    method: auth.method,
    tokenPreview: `${auth.token.slice(0, 4)}...${auth.token.slice(-4)}`,
  }
})

// Discord API handlers
ipcMain.handle('discord:fetch-guilds', async () => {
  const auth = storageService.getToken()
  if (!auth) throw new Error('Not authenticated')

  return discordService.fetchGuilds(auth.token, auth.method)
})

ipcMain.handle('discord:fetch-channels', async (_event, guildId: string) => {
  const auth = storageService.getToken()
  if (!auth) throw new Error('Not authenticated')

  return discordService.fetchChannels(guildId, auth.token, auth.method)
})

// Export handlers
ipcMain.handle('export:channels', async (_event, data: unknown) => {
  return exportService.exportToJSON(data as Parameters<typeof exportService.exportToJSON>[0])
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
