import type { ExportedChannelData, ChannelExport, ExportedThreadData, ForumThreadExport } from '../types/discord'
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
      const value = (channel as unknown as Record<string, unknown>)[header]
      return escapeCSV(formatValueForCSV(value))
    })
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

function formatAsMarkdown(data: ExportedChannelData): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${data.metadata.serverName} - Channel Export`)
  lines.push('')
  lines.push(`**Export Date:** ${new Date(data.metadata.exportDate).toLocaleString()}`)
  lines.push(`**Server ID:** ${data.metadata.serverId}`)
  lines.push(`**Total Channels:** ${data.metadata.totalChannels}`)
  lines.push('')

  // Channels
  lines.push('## Channels')
  lines.push('')

  if (data.channels.length === 0) {
    lines.push('*No channels to export*')
  } else {
    // Group by category name
    const channelsByCategory = new Map<string | null, ChannelExport[]>()

    data.channels.forEach((channel) => {
      const categoryName = channel.categoryName || null
      const categoryArray = channelsByCategory.get(categoryName)
      if (categoryArray) {
        categoryArray.push(channel)
      } else {
        channelsByCategory.set(categoryName, [channel])
      }
    })

    // Get unique category names sorted by position
    const categoryEntries = Array.from(channelsByCategory.entries())
      .filter(([name]) => name !== null)
      .sort((a, b) => {
        const posA = a[1][0]?.categoryPosition ?? 0
        const posB = b[1][0]?.categoryPosition ?? 0
        return posA - posB
      })

    // Uncategorized channels first
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
    categoryEntries.forEach(([categoryName, channels]) => {
      lines.push(`### ${categoryName}`)
      lines.push('')
      channels.forEach((channel) => {
        lines.push(formatChannelAsMarkdown(channel))
      })
      lines.push('')
    })
  }

  return lines.join('\n')
}

function formatChannelAsMarkdown(channel: ChannelExport): string {
  const lines: string[] = []

  // Channel name (required)
  if (channel.name) {
    lines.push(`#### ${channel.name}`)
  }

  const details: string[] = []

  if (channel.id) details.push(`**ID:** \`${channel.id}\``)
  if (channel.type) details.push(`**Type:** ${channel.type}`)
  if (channel.position !== undefined) details.push(`**Position:** ${channel.position}`)
  if (channel.topic) details.push(`**Topic:** ${channel.topic}`)
  if (channel.nsfw) details.push(`**NSFW:** Yes`)
  if (channel.rateLimit) details.push(`**Slowmode:** ${channel.rateLimit}s`)
  if (channel.permissionCount && channel.permissionCount > 0) {
    details.push(`**Permissions:** ${channel.permissionCount} override(s)`)
  }
  if (channel.createdAt) {
    details.push(`**Created:** ${new Date(channel.createdAt).toLocaleString()}`)
  }

  if (details.length > 0) {
    lines.push(details.join(' • '))
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

export function formatThreadExportData(
  data: ExportedThreadData,
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
        content: formatThreadsAsCSV(data),
        extension: 'csv',
      }
    case 'markdown':
      return {
        content: formatThreadsAsMarkdown(data),
        extension: 'md',
      }
    default:
      return {
        content: JSON.stringify(data, null, 2),
        extension: 'json',
      }
  }
}

function formatThreadsAsCSV(data: ExportedThreadData): string {
  if (data.threads.length === 0) {
    return 'No threads to export'
  }

  const allKeys = new Set<string>()
  data.threads.forEach((thread) => {
    Object.keys(thread).forEach((key) => allKeys.add(key))
  })

  const headers = Array.from(allKeys)
  const csvRows: string[] = []

  csvRows.push(headers.map((h) => escapeCSV(h)).join(','))

  data.threads.forEach((thread) => {
    const row = headers.map((header) => {
      const value = (thread as unknown as Record<string, unknown>)[header]
      return escapeCSV(formatValueForCSV(value))
    })
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

function formatThreadsAsMarkdown(data: ExportedThreadData): string {
  const lines: string[] = []

  lines.push(`# Forum Threads: ${data.metadata.channelName}`)
  lines.push('')
  lines.push(`**Server:** ${data.metadata.guildName}`)
  lines.push(`**Export Date:** ${new Date(data.metadata.exportDate).toLocaleString()}`)
  lines.push(`**Channel ID:** ${data.metadata.channelId}`)
  lines.push(`**Total Threads:** ${data.metadata.totalThreads}`)
  lines.push('')

  lines.push('## Threads')
  lines.push('')

  if (data.threads.length === 0) {
    lines.push('*No threads found*')
  } else {
    lines.push('| Name | Author | Created | Messages | Tags | Status |')
    lines.push('|------|--------|---------|----------|------|--------|')

    data.threads.forEach((thread) => {
      lines.push(formatThreadAsMarkdownRow(thread))
    })
  }

  return lines.join('\n')
}

function formatThreadAsMarkdownRow(thread: ForumThreadExport): string {
  const name = thread.threadName || 'Untitled'
  const author = thread.authorId || 'Unknown'
  const created = thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : 'N/A'
  const messages = thread.messageCount || 0
  const tags = Array.isArray(thread.tags) && thread.tags.length > 0 ? thread.tags.join(', ') : 'None'

  const statusParts: string[] = []
  if (thread.archived) statusParts.push('Archived')
  if (thread.locked) statusParts.push('Locked')
  const status = statusParts.length > 0 ? statusParts.join(', ') : 'Active'

  return `| ${name} | ${author} | ${created} | ${messages} | ${tags} | ${status} |`
}
