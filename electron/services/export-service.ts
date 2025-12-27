import { dialog } from 'electron'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

interface ExportedChannelData {
  serverId: string
  serverName: string
  exportDate: string
  channels: unknown[]
  categories: unknown[]
}

export async function exportToJSON(data: ExportedChannelData): Promise<string> {
  const defaultFilename = `${data.serverName.replace(/[^a-z0-9]/gi, '_')}_channels_${new Date().toISOString().split('T')[0]}.json`

  const result = await dialog.showSaveDialog({
    title: 'Export Channels to JSON',
    defaultPath: path.join(process.env.HOME || '', defaultFilename),
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
  })

  if (result.canceled || !result.filePath) {
    throw new Error('Export canceled by user')
  }

  const jsonContent = JSON.stringify(data, null, 2)
  await writeFile(result.filePath, jsonContent, 'utf-8')

  return result.filePath
}
