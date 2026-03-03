import { CommandResult, CommandContext } from '../types'
import { t } from '@/lib/i18n'

export function cmdLogout(context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  return {
    output: [t('terminal.loggedOut')],
    newPrompt: 'guest@bajour:~$ ',
  }
}
