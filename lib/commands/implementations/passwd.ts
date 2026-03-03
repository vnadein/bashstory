import { CommandResult, CommandContext } from '../types'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getLocale, t } from '@/lib/i18n'

export function cmdPasswd(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.includes('--help')) {
    return { output: [t('terminal.usage', { usage: 'passwd' })] }
  }

  return {
    output: [],
    inputMode: 'password',
    inputPrompt: t('terminal.passwdCurrent'),
  }
}

export function cmdPasswdCurrent(args: string[], context: CommandContext): CommandResult {
  const password = args[0]

  const db = getDb()
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(context.userId) as { password_hash: string } | undefined

  if (!user) {
    return { output: [t('terminal.accessDenied')] }
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return { output: [t('terminal.incorrectCurrentPassword')] }
  }

  return {
    output: [],
    inputMode: 'password',
    inputPrompt: t('terminal.passwdNew'),
  }
}

export function cmdPasswdNew(args: string[], context: CommandContext): CommandResult {
  const newPassword = args[0]

  const db = getDb()
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, context.userId)

  return { output: [t('terminal.passwordChanged')] }
}
