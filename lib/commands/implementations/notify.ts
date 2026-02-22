import { CommandResult, CommandContext } from '../types'
import { getMentions, getNotifications, getUnreadNotificationsCount, markNotificationsRead } from '@/lib/social'

export function cmdMentions(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const mentions = getMentions(context.userId)

  if (mentions.length === 0) {
    return { output: ['Вас никто не упоминал.'] }
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
    return { output: ['Необходимо войти в систему.'] }
  }

  const unreadCount = getUnreadNotificationsCount(context.userId)
  const notifications = getNotifications(context.userId)

  if (notifications.length === 0) {
    return { output: ['Уведомлений нет.'] }
  }

  const output: string[] = []
  if (unreadCount > 0) {
    output.push(`У вас ${unreadCount} непрочитанных уведомлений.`)
    output.push('')
  }

  for (const n of notifications.slice(0, 20)) {
    const date = n.created_at.split(' ')[0]
    const time = n.created_at.split(' ')[1]?.slice(0, 5) || ''
    const read = n.read_at ? '' : ' *'
    
    let text = ''
    switch (n.type) {
      case 'follow':
        text = `${n.from_username} подписался на вас`
        break
      case 'reply':
        text = `${n.from_username} ответил на ваш пост`
        break
      case 'share':
        text = `${n.from_username} сделал репост вашего поста`
        break
      case 'mention':
        text = `${n.from_username} упомянул вас`
        break
      case 'message':
        text = `${n.from_username} отправил вам сообщение`
        break
      default:
        text = `Уведомление типа ${n.type}`
    }
    
    output.push(`[${n.id}] ${date} ${time} ${text}${read}`)
  }

  markNotificationsRead(context.userId)

  return { output }
}
