import type { ExportedChannelData, ChannelExport } from '../types/discord'
import type { ExportFormat } from '../components/ExportModal.vue'

export function formatExportData(
  data: ExportedChannelData,
  format: ExportFormat
): { content: string; extension: string } {
  switch (format) {
    case 'json':
      return {
        content: JSON.stringify(data, null, 2),
        extension: 'json',
      }
    case 'csv':
      return {
        content: formatAsCSV(data),
        extension: 'csv',
      }
    case 'markdown':
      return {
        content: formatAsMarkdown(data),
        extension: 'md',
      }
    default:
      return {
        content: JSON.stringify(data, null, 2),
        extension: 'json',
      }
  }
}

function formatAsCSV(data: ExportedChannelData): string {
  if (data.channels.length === 0) {
    return 'No channels to export'
  }

  // Get all unique keys from all channel objects
  const allKeys = new Set<string>()
  data.channels.forEach((channel) => {
    Object.keys(channel).forEach((key) => allKeys.add(key))
  })

  const headers = Array.from(allKeys)
  const csvRows: string[] = []

  // Add header row
  csvRows.push(headers.map((h) => escapeCSV(h)).join(','))

  // Add data rows
  data.channels.forEach((channel) => {
    const row = headers.map((header) => {
      const value = (channel as Record<string, unknown>)[header]
      return escapeCSV(formatValueForCSV(value))
    })
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

function formatAsMarkdown(data: ExportedChannelData): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${data.serverName} - Channel Export`)
  lines.push('')
  lines.push(`**Export Date:** ${new Date(data.exportDate).toLocaleString()}`)
  lines.push(`**Server ID:** ${data.serverId}`)
  lines.push('')

  // Categories
  if (data.categories.length > 0) {
    lines.push('## Categories')
    lines.push('')
    data.categories.forEach((cat) => {
      lines.push(`- **${cat.name}** (Position: ${cat.position})`)
    })
    lines.push('')
  }

  // Channels
  lines.push('## Channels')
  lines.push('')

  if (data.channels.length === 0) {
    lines.push('*No channels to export*')
  } else {
    // Group by category
    const channelsByCategory = new Map<string | null, (typeof data.channels)[]>()

    data.channels.forEach((channel) => {
      const categoryId = (channel as ChannelExport).categoryId || null
      const categoryArray = channelsByCategory.get(categoryId)
      if (categoryArray) {
        categoryArray.push(channel)
      } else {
        channelsByCategory.set(categoryId, [channel])
      }
    })

    // Uncategorized channels
    const uncategorized = channelsByCategory.get(null)
    if (uncategorized) {
      lines.push('### Uncategorized')
      lines.push('')
      uncategorized.forEach((channel) => {
        lines.push(formatChannelAsMarkdown(channel))
      })
      lines.push('')
    }

    // Categorized channels
    data.categories.forEach((cat) => {
      const categoryChannels = channelsByCategory.get(cat.id)
      if (categoryChannels) {
        lines.push(`### ${cat.name}`)
        lines.push('')
        categoryChannels.forEach((channel) => {
          lines.push(formatChannelAsMarkdown(channel))
        })
        lines.push('')
      }
    })
  }

  return lines.join('\n')
}

function formatChannelAsMarkdown(channel: Partial<ChannelExport>): string {
  const lines: string[] = []
  const ch = channel as Record<string, unknown>

  // Channel name (required)
  if (ch.name) {
    lines.push(`#### ${ch.name}`)
  }

  const details: string[] = []

  if (ch.id) details.push(`**ID:** \`${ch.id}\``)
  if (ch.type) details.push(`**Type:** ${ch.type}`)
  if (ch.position !== undefined) details.push(`**Position:** ${ch.position}`)
  if (ch.topic) details.push(`**Topic:** ${ch.topic}`)
  if (ch.nsfw) details.push(`**NSFW:** Yes`)
  if (ch.rateLimit) details.push(`**Slowmode:** ${ch.rateLimit}s`)
  if (ch.createdAt) details.push(`**Created:** ${new Date(ch.createdAt).toLocaleString()}`)

  if (details.length > 0) {
    lines.push(details.join(' • '))
  }

  if (ch.permissions && Array.isArray(ch.permissions) && ch.permissions.length > 0) {
    lines.push(`**Permissions:** ${ch.permissions.length} override(s)`)
  }

  lines.push('')
  return lines.join('\n')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatValueForCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
