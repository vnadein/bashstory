import { CommandResult, CommandContext } from '../types'
import { getMentions, getNotifications, getUnreadNotificationsCount, markNotificationsRead } from '@/lib/social'
import { getLocale, t } from '@/lib/i18n'

export function cmdMentions(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  const mentions = getMentions(context.userId)

  if (mentions.length === 0) {
    return { output: [t('terminal.noMentions')] }
  }

  const output = mentions.map(p => {
    const date = p.created_at.split(' ')[0]
    const time = p.created_at.split(' ')[1]?.slice(0, 5) || ''
    return `[${p.id}] ${p.username} ${date} ${time}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}"`
  })

  return { output }
}

export function cmdNotify(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  const unreadCount = getUnreadNotificationsCount(context.userId)
  const notifications = getNotifications(context.userId)

  if (notifications.length === 0) {
    return { output: [t('terminal.noNotifications')] }
  }

  const output: string[] = []
  if (unreadCount > 0) {
    output.push(t('terminal.unreadNotifications', { count: unreadCount.toString() }))
    output.push('')
  }

  for (const n of notifications.slice(0, 20)) {
    const date = n.created_at.split(' ')[0]
    const time = n.created_at.split(' ')[1]?.slice(0, 5) || ''
    const read = n.read_at ? '' : ' *'
    
    let text = ''
    switch (n.type) {
      case 'follow':
        text = t('terminal.notificationFollow', { username: n.from_username || '' })
        break
      case 'reply':
        text = t('terminal.notificationReply', { username: n.from_username || '' })
        break
      case 'comment_reply':
        text = t('terminal.notificationCommentReply', { username: n.from_username || '' })
        break
      case 'share':
        text = t('terminal.notificationShare', { username: n.from_username || '' })
        break
      case 'mention':
        text = t('terminal.notificationMention', { username: n.from_username || '' })
        break
      case 'message':
        text = t('terminal.notificationMessage', { username: n.from_username || '' })
        break
      case 'like':
        text = t('terminal.notificationLike', { username: n.from_username || '' })
        break
      default:
        text = `Notification type: ${n.type}`
    }
    
    output.push(`[${n.id}] ${date} ${time} ${text}${read}`)
  }

  markNotificationsRead(context.userId)

  return { output }
}
