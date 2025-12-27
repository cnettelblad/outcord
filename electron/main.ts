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
let loginWindow: BrowserWindow | null = null

function createWindow() {
  // Use platform-specific icon during development
  const appRoot = process.env.APP_ROOT || path.join(__dirname, '..')
  const iconPath =
    process.platform === 'darwin'
      ? path.join(appRoot, 'assets/icons/icon.icns')
      : process.platform === 'win32'
        ? path.join(appRoot, 'assets/icons/icon.ico')
        : path.join(appRoot, 'assets/icons/icon.png')

  win = new BrowserWindow({
    width: 500,
    height: 700,
    minWidth: 450,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hiddenInset',
    title: 'OutCord',
    trafficLightPosition: { x: -100, y: -100 },
    backgroundColor: '#1e1f22',
    transparent: true,
    roundedCorners: true,
    hasShadow: true,
    icon: iconPath,
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

// Window control handlers
ipcMain.handle('window:minimize', () => {
  win?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  win?.close()
})

ipcMain.handle('window:is-maximized', () => {
  return win?.isMaximized() || false
})

ipcMain.handle('window:resize-for-auth', () => {
  win?.setSize(500, 700)
  win?.center()
})

ipcMain.handle('window:resize-for-app', () => {
  win?.setSize(1200, 800)
  win?.center()
})

// Discord login handlers
ipcMain.handle('discord-login:open', () => {
  if (loginWindow) {
    loginWindow.focus()
    return
  }

  loginWindow = new BrowserWindow({
    width: 500,
    height: 700,
    parent: win || undefined,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  loginWindow.loadURL('https://discord.com/login')

  loginWindow.on('closed', () => {
    loginWindow = null
  })
})

ipcMain.handle('discord-login:close', () => {
  loginWindow?.close()
  loginWindow = null
})

ipcMain.handle('discord-login:extract-token', async () => {
  if (!loginWindow) {
    return null
  }

  try {
    // Execute the token extraction script
    const token = await loginWindow.webContents.executeJavaScript(`
      (function() {
        try {
          let m;
          webpackChunkdiscord_app.push([[Math.random()],{},e=>{
            for(let i in e.c){
              let x=e.c[i];
              if(x?.exports?.$8&&x.exports.LP&&x.exports.gK){
                m=x;
                break
              }
            }
          }]);
          if (m && m.exports && m.exports.LP) {
            return m.exports.LP();
          }
          return null;
        } catch(e) {
          return null;
        }
      })();
    `)

    return token
  } catch (error) {
    console.error('Failed to extract token:', error)
    return null
  }
})

app.on('window-all-closed', () => {
  app.quit()
  win = null
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
