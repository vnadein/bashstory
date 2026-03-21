import { CommandResult, CommandContext } from '../types'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { t } from '@/lib/i18n'

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
  
  if (!username || !password) {
    return { output: [t('terminal.loginRequired')] }
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  
  if (existing) {
    return { output: [t('terminal.userExists')] }
  }

  const hash = bcrypt.hashSync(password, 10)
  
  try {
    db.prepare('INSERT INTO users (username, password_hash, lang) VALUES (?, ?, ?)').run(username, hash, 'en')
  } catch {
    return { output: [t('terminal.registerFailed')] }
  }
  
  return {
    output: [t('terminal.registerSuccess', { username })],
  }
}
