import type { ExportContext } from '../components/ExportModal.vue'

export const serverChannelsContext: ExportContext = {
  title: 'Export Server Channels',
  subtitle: 'Configure export options for server channels',
  fields: [
    {
      key: 'channelId',
      label: 'Channel ID',
      description: 'Discord channel identifier',
      defaultSelected: true,
    },
    {
      key: 'channelName',
      label: 'Channel Name',
      description: 'Display name',
      defaultSelected: true,
    },
    {
      key: 'channelType',
      label: 'Channel Type',
      description: 'Text, voice, forum, etc.',
      defaultSelected: true,
    },
    {
      key: 'channelPosition',
      label: 'Position',
      description: 'Sort order',
      defaultSelected: true,
    },
    {
      key: 'categoryName',
      label: 'Category',
      description: 'Parent category name',
      defaultSelected: true,
    },
    {
      key: 'topic',
      label: 'Topic',
      description: 'Channel description',
      defaultSelected: true,
    },
    {
      key: 'nsfw',
      label: 'NSFW Flag',
      description: 'Age-restricted status',
      defaultSelected: true,
    },
    {
      key: 'permissions',
      label: 'Permissions',
      description: 'Role & user overrides',
      defaultSelected: false,
    },
    {
      key: 'rateLimit',
      label: 'Slowmode',
      description: 'Rate limit delay',
      defaultSelected: false,
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      description: 'Channel creation timestamp',
      defaultSelected: true,
    },
  ],
}

export const textChannelMessagesContext: ExportContext = {
  title: 'Export Channel Messages',
  subtitle: 'Configure export options for channel messages',
  fields: [
    {
      key: 'messageId',
      label: 'Message ID',
      description: 'Discord message identifier',
      defaultSelected: true,
    },
    {
      key: 'authorId',
      label: 'Author ID',
      description: 'User identifier',
      defaultSelected: true,
    },
    {
      key: 'authorName',
      label: 'Author Name',
      description: 'Username and discriminator',
      defaultSelected: true,
    },
    {
      key: 'content',
      label: 'Message Content',
      description: 'Text content',
      defaultSelected: true,
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      description: 'When message was sent',
      defaultSelected: true,
    },
    {
      key: 'attachments',
      label: 'Attachments',
      description: 'Files and images',
      defaultSelected: true,
    },
    {
      key: 'embeds',
      label: 'Embeds',
      description: 'Rich embeds',
      defaultSelected: false,
    },
    {
      key: 'reactions',
      label: 'Reactions',
      description: 'Emoji reactions',
      defaultSelected: false,
    },
    {
      key: 'mentions',
      label: 'Mentions',
      description: 'User and role mentions',
      defaultSelected: false,
    },
    {
      key: 'edited',
      label: 'Edit Timestamp',
      description: 'When message was edited',
      defaultSelected: true,
    },
  ],
}

export const forumChannelContext: ExportContext = {
  title: 'Export Forum Threads',
  subtitle: 'Configure export options for forum threads',
  fields: [
    {
      key: 'threadId',
      label: 'Thread ID',
      description: 'Discord thread identifier',
      defaultSelected: true,
    },
    {
      key: 'threadName',
      label: 'Thread Name',
      description: 'Thread title',
      defaultSelected: true,
    },
    {
      key: 'authorId',
      label: 'Author ID',
      description: 'Thread creator',
      defaultSelected: true,
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      description: 'When thread was created',
      defaultSelected: true,
    },
    {
      key: 'messageCount',
      label: 'Message Count',
      description: 'Number of messages',
      defaultSelected: true,
    },
    {
      key: 'tags',
      label: 'Tags',
      description: 'Applied forum tags',
      defaultSelected: true,
    },
    {
      key: 'archived',
      label: 'Archived Status',
      description: 'Whether thread is archived',
      defaultSelected: true,
    },
    {
      key: 'locked',
      label: 'Locked Status',
      description: 'Whether thread is locked',
      defaultSelected: true,
    },
  ],
}

export const directMessagesContext: ExportContext = {
  title: 'Export Direct Messages',
  subtitle: 'Configure export options for DM conversation',
  fields: [
    {
      key: 'messageId',
      label: 'Message ID',
      description: 'Discord message identifier',
      defaultSelected: true,
    },
    {
      key: 'authorId',
      label: 'Author ID',
      description: 'User identifier',
      defaultSelected: true,
    },
    {
      key: 'authorName',
      label: 'Author Name',
      description: 'Username',
      defaultSelected: true,
    },
    {
      key: 'content',
      label: 'Message Content',
      description: 'Text content',
      defaultSelected: true,
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      description: 'When message was sent',
      defaultSelected: true,
    },
    {
      key: 'attachments',
      label: 'Attachments',
      description: 'Files and images',
      defaultSelected: true,
    },
    {
      key: 'edited',
      label: 'Edit Timestamp',
      description: 'When message was edited',
      defaultSelected: true,
    },
  ],
}
