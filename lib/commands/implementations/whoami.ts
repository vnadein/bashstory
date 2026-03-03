import { CommandResult, CommandContext } from '../types'
import { getUserById } from '@/lib/social'
import { t } from '@/lib/i18n'

export function cmdWhoami(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['guest'] }
  }

  const user = getUserById(context.userId)
  return { output: [user?.username || 'unknown'] }
}
