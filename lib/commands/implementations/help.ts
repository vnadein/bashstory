import { CommandResult } from '../types'

export function cmdHelp(): CommandResult {
  return {
    output: [
      'Доступные команды:',
      '',
      '  help                    -- список команд',
      '  login                   -- авторизация',
      '  register                -- регистрация',
      '  logout / exit           -- выход из аккаунта',
      '  passwd                  -- изменить пароль',
      '  reboot                  -- перезагрузка системы',
      '  whoami                  -- текущий пользователь',
      '  clear                   -- очистить экран',
      '  theme <hex>             -- установить цвет текста (#RRGGBB)',
      '  top                     -- мониторинг процессов',
      '',
      '  Используйте --help после команды для подробной справки.',
    ],
  }
}
