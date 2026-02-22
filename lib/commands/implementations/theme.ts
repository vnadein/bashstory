import { CommandResult, CommandContext } from '../types'

export function cmdTheme(args: string[]): CommandResult {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      output: [
        'Использование: theme <hex-цвет>',
        '',
        'Установить цвет текста терминала.',
        '',
        'Опции:',
        '  --help, -h     показать эту справку',
        '',
        'Примеры:',
        '  theme #4AFB7F  -- зелёный цвет (по умолчанию)',
        '  theme #FF5733  -- оранжевый цвет',
        '  theme #00FFFF  -- голубой цвет',
      ],
    }
  }
  
  const color = args[0]

  if (!color) {
    return { output: ['Использование: theme <hex-цвет>', 'Пример: theme #4AFB7F'] }
  }

  const hexRegex = /^#[0-9A-Fa-f]{6}$/
  if (!hexRegex.test(color)) {
    return { output: [`theme: '${color}' не является корректным HEX-цветом. Используйте формат #RRGGBB.`] }
  }

  return {
    output: [`Тема установлена: ${color}`],
    newPrompt: color,
  }
}
