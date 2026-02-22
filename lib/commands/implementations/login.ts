import { CommandResult, CommandContext } from '../types'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'

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
  
  return {
    output: [],
    newPrompt: `${user.username}@bashstory:~$ `,
  }
}

export function getLoginToken(username: string): string | null {
  const db = getDb()
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined
  if (!user) return null
  return createSession(user.id)
}
