import { CommandResult, CommandContext } from '../types'
import { sendMessage, getInbox, getMessage, getUserByUsername } from '@/lib/social'
import { getLocale, t } from '@/lib/i18n'

export function cmdMsg(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length < 2) {
    return { output: [t('terminal.usage', { usage: 'msg <username> <text>' })] }
  }

  const username = args[0]
  const text = args.slice(1).join(' ')

  if (context.username === username) {
    return { output: [t('terminal.cannotMessageSelf')] }
  }

  const success = sendMessage(context.userId, username, text)

  if (!success) {
    return { output: [t('terminal.messageError')] }
  }

  return { output: [t('terminal.messageSent', { username })] }
}

export function cmdMail(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  const messages = getInbox(context.userId)

  if (messages.length === 0) {
    return { output: [t('terminal.inboxEmpty')] }
  }

  const output: string[] = []

  for (const m of messages.slice(0, 20)) {
    const date = m.created_at.split(' ')[0]
    const time = m.created_at.split(' ')[1]?.slice(0, 5) || ''
    const read = m.read_at ? '' : ' *'
    output.push(`[${m.id}] ${date} ${time} ${t('terminal.from')} @${m.from_username}${read}`)
    output.push(`    ${m.text.slice(0, 80)}${m.text.length > 80 ? '...' : ''}`)
    output.push('')
  }

  return { output }
}

export function cmdRead(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'readmsg <id>' })] }
  }

  const messageId = parseInt(args[0])
  if (isNaN(messageId)) {
    return { output: [t('terminal.invalidId')] }
  }

  const message = getMessage(messageId, context.userId)

  if (!message) {
    return { output: [t('terminal.messageNotFound', { id: messageId.toString() })] }
  }

  const output: string[] = []
  
  output.push('─'.repeat(50))
  output.push(`${t('terminal.from')}: @${message.from_username}`)
  output.push(`${t('terminal.to')}: @${message.to_username}`)
  output.push(`${t('terminal.date')}: ${message.created_at}`)
  output.push('─'.repeat(50))
  output.push('')
  output.push(message.text)
  output.push('')
  output.push('─'.repeat(50))

  return { output }
}
