import { CommandResult, CommandContext } from '../types'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'

export function cmdPasswd(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['passwd: необходима авторизация.'] }
  }

  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: passwd',
        '',
        'Изменить пароль текущего пользователя.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
      ],
    }
  }

  return {
    output: [],
    inputMode: 'password',
    inputPrompt: '(passwd) Current password: ',
  }
}

export function cmdPasswdCurrent(args: string[], context: CommandContext): CommandResult {
  const currentPassword = args[0]
  
  if (!context.userId) {
    return { output: ['passwd: необходима авторизация.'] }
  }

  const db = getDb()
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(context.userId) as { password_hash: string } | undefined

  if (!user) {
    return { output: ['passwd: пользователь не найден.'] }
  }

  const valid = bcrypt.compareSync(currentPassword, user.password_hash)
  if (!valid) {
    return { output: ['passwd: аутентификация не пройдена.'] }
  }

  return {
    output: [],
    inputMode: 'password',
    inputPrompt: '(passwd) New password: ',
  }
}

export function cmdPasswdNew(args: string[], context: CommandContext): CommandResult {
  const newPassword = args[0]
  
  if (!context.userId) {
    return { output: ['passwd: необходима авторизация.'] }
  }

  if (!newPassword || newPassword.length < 4) {
    return { output: ['passwd: пароль слишком короткий (минимум 4 символа).'] }
  }

  const db = getDb()
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, context.userId)

  return {
    output: ['passwd: пароль успешно изменён.'],
  }
}
