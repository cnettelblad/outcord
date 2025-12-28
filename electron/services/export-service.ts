import { dialog } from 'electron'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

interface ExportData {
  content: string
  extension: string
  filename: string
}

export async function exportData(data: ExportData): Promise<string> {
  const filtersByExtension: Record<string, { name: string; extensions: string[] }[]> = {
    json: [{ name: 'JSON Files', extensions: ['json'] }],
    csv: [{ name: 'CSV Files', extensions: ['csv'] }],
    md: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'Text Files', extensions: ['txt'] },
    ],
  }

  const filters = filtersByExtension[data.extension] || [{ name: 'All Files', extensions: ['*'] }]

  const result = await dialog.showSaveDialog({
    title: `Export to ${data.extension.toUpperCase()}`,
    defaultPath: path.join(process.env.HOME || '', data.filename),
    filters,
    properties: ['createDirectory', 'showOverwriteConfirmation'],
  })

  if (result.canceled || !result.filePath) {
    throw new Error('Export canceled by user')
  }

  await writeFile(result.filePath, data.content, 'utf-8')

  return result.filePath
}

// Legacy function for backward compatibility
export async function exportToJSON(data: {
  serverName: string
  serverId: string
  exportDate: string
  channels: unknown[]
  categories: unknown[]
}): Promise<string> {
  const defaultFilename = `${data.serverName.replace(/[^a-z0-9]/gi, '_')}_channels_${new Date().toISOString().split('T')[0]}.json`

  return exportData({
    content: JSON.stringify(data, null, 2),
    extension: 'json',
    filename: defaultFilename,
  })
}
