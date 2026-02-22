import { CommandResult, CommandContext } from '../types'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'
import { getLoginSummary } from '@/lib/social'

export function cmdLoginStart(): CommandResult {
  return {
    output: [],
    inputMode: 'password',
    inputPrompt: 'login: ',
  }
}

export function cmdLoginProcess(args: string[], context: CommandContext): CommandResult {
  const username = args[0]
  const password = args[1]
  
  if (!username || !password) {
    return { output: ['login: необходимо указать логин и пароль.'] }
  }

  const db = getDb()
  const user = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?').get(username) as {
    id: number
    username: string
    password_hash: string
    role: string
  } | undefined

  if (!user) {
    return { output: ['login: неверный логин или пароль.'] }
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return { output: ['login: неверный логин или пароль.'] }
  }

  const token = createSession(user.id)
  
  const summary = getLoginSummary(user.id)
  const output: string[] = []
  
  if (summary.unreadMessages > 0) {
    const msg = summary.unreadMessages === 1 ? 'новое сообщение' : 
                summary.unreadMessages < 5 ? 'новых сообщения' : 'новых сообщений'
    output.push(`У вас ${summary.unreadMessages} ${msg}. Прочитайте с помощью команды mail.`)
  }
  
  if (summary.unreadNotifications > 0) {
    const notif = summary.unreadNotifications === 1 ? 'новое уведомление' : 
                  summary.unreadNotifications < 5 ? 'новых уведомления' : 'новых уведомлений'
    output.push(`У вас ${summary.unreadNotifications} ${notif}. Используйте команду notify.`)
  }
  
  if (output.length === 0) {
    output.push('Добро пожаловать!')
  } else {
    output.unshift('Добро пожаловать, ' + user.username + '!')
  }
  
  return {
    output,
    newPrompt: `${user.username}@bashstory:~$ `,
  }
}

export function getLoginToken(username: string): string | null {
  const db = getDb()
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined
  if (!user) return null
  return createSession(user.id)
}
