# BAJOUR Social — Context Guide

## Project Overview

**BAJOUR Social** — социальная сеть с терминальным интерфейсом в стиле ретро-консоли. Проект представляет собой Next.js приложение с кастомной системой команд, SQLite базой данных и аутентификацией.

### Key Technologies

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Database | SQLite (better-sqlite3) |
| Auth | Custom session-based (bcryptjs) |
| Components | shadcn/ui (50+) |
| Styling | Terminal theme (зелёный на чёрном) |
| I18n | Русский и английский языки |
| Package Manager | pnpm |

### Project Structure

```
bashstory/
├── app/
│   ├── api/command/         # API endpoint для команд
│   ├── globals.css          # Глобальные стили
│   ├── layout.tsx           # Корневой layout
│   └── page.tsx             # Главная (Terminal)
├── components/
│   ├── terminal/
│   │   ├── components/      # TerminalOutput, TerminalInput
│   │   ├── constants.ts     # Константы терминала
│   │   ├── types.ts         # Типы терминала
│   │   └── utils.ts         # Утилиты
│   ├── ui/                  # shadcn/ui компоненты (50+)
│   ├── boot-screen.tsx      # Экран загрузки BIOS
│   ├── terminal.tsx         # Главный компонент терминала
│   └── theme-provider.tsx   # Провайдер темы
├── lib/
│   ├── commands/
│   │   ├── implementations/ # Реализации команд (18 файлов)
│   │   ├── dispatcher.ts    # Диспетчер команд
│   │   ├── index.ts         # Экспорт всех команд
│   │   └── types.ts         # Типы командной системы
│   ├── i18n/
│   │   ├── ru.ts            # Русские переводы
│   │   ├── en.ts            # Английские переводы
│   │   └── index.ts         # i18n утилиты
│   ├── db.ts                # Подключение к SQLite
│   ├── session.ts           # Управление сессиями
│   ├── social.ts            # Социальная логика (25+ функций)
│   └── utils.ts             # Общие утилиты
├── data/
│   └── quotes.db            # SQLite база данных
├── scripts/
│   └── setup-db.js          # Скрипт инициализации БД
└── styles/                  # Дополнительные стили
```

## Building and Running

### Prerequisites

- Node.js 18+
- pnpm (рекомендуется) или npm

### Installation

```bash
# Установка зависимостей
pnpm install

# Инициализация базы данных
npx prisma generate
npx prisma db push
npx prisma db seed

# Или альтернативно (если используется прямая инициализация)
node scripts/setup-db.js
```

### Development

```bash
# Запуск dev-сервера
pnpm dev

# Production сборка
pnpm build

# Запуск production сервера
pnpm start

# Линтинг
pnpm lint

# TypeScript проверка
npx tsc --noEmit
```

### Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin` | admin |
| `root` | `esw1251yz` | admin |
| `demo` | `demo123` | user |

## Database Schema

### Tables

- **users** — пользователи (id, username, password_hash, role, bio, is_private, lang, created_at)
- **sessions** — сессии (id, token, user_id, created_at)
- **posts** — посты (id, user_id, text, parent_id, post_type, likes, views, created_at)
- **comments** — комментарии (id, post_id, user_id, text, parent_comment_id, likes, created_at)
- **follows** — подписки (id, follower_id, followee_id, created_at)
- **messages** — сообщения (id, from_user_id, to_user_id, text, read_at, created_at)
- **notifications** — уведомления (id, user_id, type, reference_id, from_user_id, read_at, created_at)
- **blocks** — блокировки (id, blocker_id, blocked_id, created_at)
- **processes** — процессы терминала (id, pid, command, user, cpu, memory, status, created_at)

### Direct Database Access

```bash
sqlite3 data/quotes.db
```

## Command System Architecture

### Command Types (`lib/commands/types.ts`)

```typescript
interface CommandResult {
  output: string[]
  newPrompt?: string
  clear?: boolean
  inputMode?: 'password' | 'submit' | 'tail-follow' | 'post-text' | 'post-multiline' | null
  inputPrompt?: string
  renderMarkdown?: boolean
  userLang?: string
}

interface CommandContext {
  userId: number | null
  username: string | null
  isModerator: boolean
  ip: string
}

interface CommandMeta {
  phase?: string
  args?: string[]
  submitText?: string
}
```

### Available Commands

#### System Commands
- `help` — список команд
- `lang <ru|en>` — язык интерфейса
- `login` — авторизация
- `register` — регистрация
- `logout` / `exit` — выход
- `passwd` — смена пароля
- `reboot` — перезагрузка
- `whoami` — текущий пользователь
- `clear` / `cls` — очистка экрана
- `theme <hex>` — цвет текста (#RRGGBB)
- `top` — мониторинг процессов

#### Social Commands
- `post` — создать пост (открывает редактор)
- `posts [user]` — посты пользователя
- `timeline` / `feed` — лента подписок
- `allposts` / `global` — все посты
- `read <id>` — прочитать пост с комментариями
- `reply <id> <text>` — ответ на пост
- `replyc <id> <#> <text>` — ответ на комментарий
- `share <id> [text]` — репост
- `trending` — популярные посты
- `like <id>` / `unlike <id>` — лайк/анлайк

#### User Commands
- `follow <user>` — подписаться
- `unfollow <user>` — отписаться
- `followers [user]` — подписчики
- `following [user]` — подписки
- `finger` / `whois <user>` — профиль
- `users` — список пользователей

#### Messages & Notifications
- `msg <user> <text>` — отправить сообщение
- `mail` / `inbox` — входящие
- `readmsg <id>` — прочитать сообщение
- `mentions` — упоминания
- `notify` — уведомления

#### Settings
- `set_bio <text>` — редактировать профиль
- `block <user>` — заблокировать
- `search <query>` — поиск

### Adding New Commands

1. Создать файл в `lib/commands/implementations/<command>.ts`:

```typescript
import { CommandResult, CommandContext } from '../types'
import { t, getLocale } from '@/lib/i18n'

export function cmdYourCommand(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('needAuth')] }
  }
  
  // Логика команды
  return {
    output: [`Результат: ${args.join(' ')}`]
  }
}
```

2. Экспортировать в `lib/commands/index.ts`:

```typescript
export { cmdYourCommand } from './implementations/your-command'
```

3. Добавить case в `lib/commands/dispatcher.ts`:

```typescript
case 'yourcmd':
  return cmdYourCommand(args, session)
```

4. Добавить переводы в `lib/i18n/ru.ts` и `lib/i18n/en.ts`

5. Добавить в `AVAILABLE_COMMANDS` в `components/terminal/constants.ts`

## Development Conventions

### Code Style

- **TypeScript**: строгий режим (`strict: true`)
- **Именование**: camelCase для функций/переменных, PascalCase для компонентов
- **Импорт**: абсолютные пути через `@/*`
- **Экспорты**: именованные экспорты предпочтительнее default

### File Organization

- Один компонент/функция на файл
- Типы в отдельных `.ts` файлах рядом с реализацией
- Переводы в `lib/i18n/{ru,en}.ts`

### Testing Practices

- Ручное тестирование через терминал
- SQLite server для проверки данных
- Puppeteer для браузерных тестов

### Git Workflow

```bash
# Проверка статуса
git status

# Просмотр изменений
git diff HEAD

# Коммит (следовать стилю существующих коммитов)
git commit -m "feat: добавить команду stats"

# Push (только по запросу пользователя)
git push
```

## MCP Servers

Проект настроен для работы с MCP-серверами:

| Server | Purpose |
|--------|---------|
| `filesystem` | Работа с файлами проекта |
| `sqlite` | Прямой доступ к БД |
| `git` | Управление версиями |
| `github` | GitHub API |
| `memory` | Долговременная память |
| `brave-search` | Поиск документации |
| `puppeteer` | Браузерные тесты |
| `terminal` | Выполнение команд |

Конфигурация: `~/.qwen/mcp_servers.json`

## Skills

Специализированные руководства для разработки:

| Skill | Purpose |
|-------|---------|
| `bashstory-commands` | Создание команд терминала |
| `bashstory-db` | Работа с базой данных |
| `bashstory-ui` | UI компоненты |
| `bashstory-testing` | Тестирование и отладка |

Расположение: `~/.qwen/skills/`

## Common Tasks

### Сброс базы данных

```bash
rm data/quotes.db
node scripts/setup-db.js
```

### Очистка старых сессий

```typescript
import { cleanOldSessions } from '@/lib/session'
cleanOldSessions(7) // Удалить сессии старше 7 дней
```

### Добавление пользователя в БД

```sql
INSERT INTO users (username, password_hash, role) 
VALUES ('newuser', '$2a$10$...', 'user');
```

### Проверка процессов терминала

```sql
SELECT * FROM processes WHERE status = 'running';
```

## Troubleshooting

### Database locked

```bash
# Найти процессы, держащие файл
lsof data/quotes.db

# Убить процесс или закрыть соединение
```

### Session issues

```bash
# Очистить все сессии
sqlite3 data/quotes.db "DELETE FROM sessions;"
```

### Build errors

```bash
# Очистить кэш Next.js
rm -rf .next

# Переустановить зависимости
rm -rf node_modules
pnpm install
```

## Related Documentation

- [README.md](./README.md) — основная документация
- [MCP_SETUP.md](./MCP_SETUP.md) — настройка MCP-серверов
- [SKILLS_GUIDE.md](./SKILLS_GUIDE.md) — руководство по skills
- [QUICKSTART_MCP.md](./QUICKSTART_MCP.md) — быстрый старт MCP
