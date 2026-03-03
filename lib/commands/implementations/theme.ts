import { CommandResult, CommandContext } from '../types'
import { t } from '@/lib/i18n'

export function cmdTheme(args: string[], context: CommandContext): CommandResult {
  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'theme <#RRGGBB>' })] }
  }

  const color = args[0]

  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { output: [t('terminal.usage', { usage: 'theme <#RRGGBB>' })] }
  }

  return {
    output: [t('terminal.themeSet', { theme: color })],
    newPrompt: color,
  }
}
