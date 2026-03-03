import { CommandResult, CommandContext } from '../types'
import { t } from '@/lib/i18n'

export function cmdReboot(context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.confirmReboot')] }
  }

  return {
    output: [t('terminal.rebooting')],
    clear: true,
  }
}
