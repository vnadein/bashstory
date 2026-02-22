import { CommandResult, CommandContext } from '../types'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'
import { getLoginSummary } from '@/lib/social'

export function cmdRegisterStart(): CommandResult {
  return {
    output: [],
    inputMode: 'password',
    inputPrompt: 'login: ',
  }
}

export function cmdRegisterProcess(args: string[], context: CommandContext): CommandResult {
  const username = args[0]
  const password = args[1]
  const password2 = args[2]

  if (!username || !password || !password2) {
    return { output: ['register: необходимо указать логин и пароль (дважды).'] }
  }
  if (password !== password2) {
    return { output: ['register: пароли не совпадают.'] }
  }
  if (username.length < 3 || username.length > 20) {
    return { output: ['register: логин должен быть от 3 до 20 символов.'] }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { output: ['register: логин может содержать только латинские буквы, цифры и _.'] }
  }
  if (password.length < 4) {
    return { output: ['register: пароль слишком короткий (минимум 4 символа).'] }
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return { output: [`register: пользователь '${username}' уже существует.`] }
  }

  const hash = bcrypt.hashSync(password, 10)
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash)
  
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number }
  const token = createSession(user.id)
  
  const summary = getLoginSummary(user.id)
  const output: string[] = ['Добро пожаловать, ' + username + '!']
  
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
  
  return {
    output,
    newPrompt: `${username}@bashstory:~$ `,
  }
}

export function getRegisterToken(username: string): string | null {
  const db = getDb()
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined
  if (!user) return null
  return createSession(user.id)
}
