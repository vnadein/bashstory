import { CommandResult, CommandContext } from '../types'
import { deleteSession } from '@/lib/session'

export function cmdLogout(context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Вы не авторизованы.'] }
  }
  return { output: ['До свидания!'], newPrompt: 'guest@bajour:~$ ' }
}
