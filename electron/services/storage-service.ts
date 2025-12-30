import Store from 'electron-store'
import type { DiscordUser } from './discord-service.js'

export interface StoredAuth {
  method: 'bot' | 'user'
  token: string
  user: DiscordUser
}

const store = new Store<{ auth: StoredAuth | null }>({
  name: 'outcord-secure',
  encryptionKey: 'outcord-encryption-key-2024',
})

export function saveToken(method: 'bot' | 'user', token: string, user: DiscordUser): void {
  store.set('auth', { method, token, user })
}

export function getToken(): StoredAuth | null {
  return store.get('auth', null)
}

export function clearToken(): void {
  store.delete('auth')
}

export function hasToken(): boolean {
  return store.has('auth')
}
