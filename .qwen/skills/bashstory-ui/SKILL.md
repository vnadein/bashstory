# BashStory UI Skill

## Назначение
Разработка UI компонентов терминала для проекта BashStory.

## Контекст проекта
- **Фреймворк:** Next.js 15+ с App Router
- **UI библиотека:** shadcn/ui + Tailwind CSS
- **Компоненты:** `components/terminal/`

## Структура компонентов
```
components/
├── terminal/
│   ├── terminal.tsx       # Основной терминал
│   ├── output.tsx         # Вывод команд
│   ├── input.tsx          # Поле ввода
│   └── cursor.tsx         # Курсор
└── ui/                    # shadcn/ui компоненты
```

## Стиль
- Терминальная тема
- Анимации текста
- Ретро-эстетика

## Связанные MCP серверы
- `filesystem` - чтение/запись компонентов
- `puppeteer` - проверка UI в браузере
