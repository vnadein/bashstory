import { CommandResult, CommandContext } from '../types'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'
import { getLoginSummary } from '@/lib/social'
import { getLocale, t } from '@/lib/i18n'

export function cmdLoginStart(): CommandResult {
  const lang = getLocale()
  return {
    output: [],
    inputMode: 'password',
    inputPrompt: lang === 'ru' ? 'login: ' : 'login: ',
  }
}

export function cmdLoginProcess(args: string[], context: CommandContext): CommandResult {
  const lang = getLocale()
  const username = args[0]
  const password = args[1]
  
  if (!username || !password) {
    return { output: [t('terminal.loginRequired')] }
  }

  const db = getDb()
  const user = db.prepare('SELECT id, username, password_hash, role, lang FROM users WHERE username = ?').get(username) as {
    id: number
    username: string
    password_hash: string
    role: string
    lang: string
  } | undefined

  if (!user) {
    return { output: [t('terminal.loginFailed')] }
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return { output: [t('terminal.loginFailed')] }
  }

  const sessionToken = createSession(user.id)
  
  const summary = getLoginSummary(user.id)
  const output: string[] = []
  
  if (summary.unreadMessages > 0) {
    let msgKey = 'newMessagesMore'
    if (summary.unreadMessages === 1) msgKey = 'newMessage'
    else if (summary.unreadMessages < 5) msgKey = 'newMessages'
    output.push(t('terminal.youHaveMessages', { count: summary.unreadMessages.toString(), msg: t('terminal.' + msgKey) }))
  }
  
  if (summary.unreadNotifications > 0) {
    let notifKey = 'newNotificationsMore'
    if (summary.unreadNotifications === 1) notifKey = 'newNotification'
    else if (summary.unreadNotifications < 5) notifKey = 'newNotifications'
    output.push(t('terminal.youHaveNotifications', { count: summary.unreadNotifications.toString(), notif: t('terminal.' + notifKey) }))
  }
  
  if (output.length === 0) {
    output.push(t('terminal.welcomeBack'))
  } else {
    output.unshift(t('terminal.loginSuccess', { username }))
  }
  
  return {
    output,
    newPrompt: `${user.username}@bajour:~$ `,
    userLang: user.lang || 'en',
    sessionToken,
  }
}

export function getLoginToken(username: string): string | null {
  const db = getDb()
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined
  if (!user) return null
  return createSession(user.id)
}
