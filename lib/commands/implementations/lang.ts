import { CommandResult, CommandContext } from '../types'
import { setUserLang, getUserLang } from '@/lib/social'
import { setUserLocale, setLocale, getLocale, t } from '@/lib/i18n'

export function cmdLang(args: string[], context: CommandContext): CommandResult {
  if (args.length === 0) {
    const currentLang = context.userId ? getUserLang(context.userId) : getLocale()
    return { output: [t('terminal.currentLang', { lang: currentLang.toUpperCase() })] }
  }

  const langArg = args[0].toLowerCase()
  
  if (langArg !== 'ru' && langArg !== 'en') {
    return { output: [t('terminal.usageLang')] }
  }

  setLocale(langArg as 'ru' | 'en')
  setUserLocale(langArg)

  if (context.userId) {
    setUserLang(context.userId, langArg)
  }

  return { output: [t('terminal.languageSet', { lang: langArg.toUpperCase() })] }
}
