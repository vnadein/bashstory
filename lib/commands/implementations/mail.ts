import { CommandResult, CommandContext } from '../types'
import { sendMessage, getInbox, getMessage } from '@/lib/social'

export function cmdMsg(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length < 2) {
    return { output: ['Использование: msg <username> <текст>'] }
  }

  const username = args[0]
  const text = args.slice(1).join(' ')

  const success = sendMessage(context.userId, username, text)

  if (!success) {
    return { output: [`Не удалось отправить сообщение пользователю ${username}.`] }
  }

  return { output: [`Сообщение отправлено пользователю ${username}.`] }
}

export function cmdMail(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const messages = getInbox(context.userId)

  if (messages.length === 0) {
    return { output: ['Входящих сообщений нет.'] }
  }

  const output = messages.map(m => {
    const date = m.created_at.split(' ')[0]
    const time = m.created_at.split(' ')[1]?.slice(0, 5) || ''
    const unread = m.read_at ? '' : ' *'
    return `[${m.id}] ${date} ${time} ${m.from_username}${unread}`
  })

  return { output }
}

export function cmdRead(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length === 0) {
    return { output: ['Использование: read <msg_id>'] }
  }

  const messageId = parseInt(args[0])
  if (isNaN(messageId)) {
    return { output: ['Укажите корректный ID сообщения.'] }
  }

  const message = getMessage(messageId, context.userId)

  if (!message) {
    return { output: [`Сообщение #${messageId} не найдено.`] }
  }

  const date = message.created_at.split(' ')[0]
  const time = message.created_at.split(' ')[1]?.slice(0, 5) || ''

  const output = [
    `From: ${message.from_username}`,
    `Date: ${date} ${time}`,
    '',
    message.text,
  ]

  return { output }
}
