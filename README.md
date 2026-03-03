# BAJOUR Social

Социальная сеть с терминальным интерфейсом в стиле ретро-консоли.

## ⚡ Быстрая настройка разработки

Для эффективной разработки проекта настроены MCP-серверы и skills:

```bash
# MCP-серверы: ~/.qwen/mcp_servers.json (8 серверов)
# Skills: ~/.qwen/skills/ (4 специализированных skill)
```

📖 Подробно: [QUICKSTART_MCP.md](./QUICKSTART_MCP.md)

## Features

- Terminal-style UI with authentic command-line aesthetics
- User authentication (register/login)
- Quote management (add, list, delete, favorite)
- Command system with help documentation
- SQLite database with Prisma ORM
- NextAuth for authentication

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Demo Account

- Username: `demo`
- Password: `demo123`

## Available Commands

### System Commands
- `help` - Display available commands
- `help [command]` - Get help for a specific command
- `clear` - Clear the terminal screen
- `whoami` - Display current user information
- `echo [text]` - Display a line of text
- `date` - Display current date and time
- `logout` - Log out of the terminal

### Quote Commands
- `quote-add "text" --author "name" --category "cat" --tags tag1,tag2` - Add a new quote
- `quote-list [--category cat] [--tag tag] [--favorite] [--search term]` - List all quotes
- `quote-random [--category cat] [--tag tag]` - Display a random quote
- `quote-delete <id>` - Delete a quote by ID
- `quote-favorite <id> [--remove]` - Mark/unmark a quote as favorite

### Command Aliases
- `h`, `?` → `help`
- `cls` → `clear`
- `exit`, `quit` → `logout`
- `qadd` → `quote-add`
- `qlist`, `quotes` → `quote-list`
- `qrand`, `random-quote` → `quote-random`
- `qdel`, `qrm` → `quote-delete`
- `qfav` → `quote-favorite`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Database**: SQLite (better-sqlite3)
- **Authentication**: Custom session-based auth
- **Components**: shadcn/ui (50+ компонентов)
- **Styling**: Terminal theme (зелёный на чёрном)
- **I18n**: Русский и английский языки

## Development Tools

### MCP-серверы

| Сервер | Назначение |
|--------|------------|
| filesystem | Работа с файлами проекта |
| sqlite | Прямой доступ к БД |
| git | Управление версиями |
| github | GitHub API |
| memory | Долговременная память |
| brave-search | Поиск документации |
| puppeteer | Браузерные тесты |
| terminal | Выполнение команд |

### Skills

| Skill | Назначение |
|-------|------------|
| bashstory-commands | Создание команд терминала |
| bashstory-db | Работа с базой данных |
| bashstory-ui | UI компоненты |
| bashstory-testing | Тестирование и отладка |

📖 Подробнее: [MCP_SETUP.md](./MCP_SETUP.md), [SKILLS_GUIDE.md](./SKILLS_GUIDE.md)

## Project Structure

```
bashstory/
├── app/
│   ├── api/command/     # API endpoint для команд
│   ├── globals.css      # Глобальные стили
│   ├── layout.tsx       # Корневой layout
│   └── page.tsx         # Главная (Terminal)
├── components/
│   ├── terminal/        # Терминальные компоненты
│   │   ├── components/  # TerminalOutput, TerminalInput
│   │   ├── types.ts     # Типы терминала
│   │   ├── constants.ts # Константы
│   │   └── utils.ts     # Утилиты
│   └── ui/              # shadcn/ui компоненты (50+)
├── lib/
│   ├── commands/        # Система команд
│   │   ├── implementations/  # Реализации (18 файлов)
│   │   ├── dispatcher.ts     # Диспетчер команд
│   │   ├── index.ts          # Экспорт
│   │   └── types.ts          # Типы
│   ├── i18n/            # Переводы (ru/en)
│   ├── db.ts            # Подключение к SQLite
│   ├── session.ts       # Управление сессиями
│   └── social.ts        # Социальная логика (25+ функций)
├── data/
│   └── quotes.db        # SQLite база данных
└── scripts/
    └── setup-db.js      # Скрипт инициализации
```

## Development

### Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts

- `admin` / `admin` (admin role)
- `root` / `esw1251yz` (admin role)

### Available Commands

#### System Commands
- `help` - Display available commands
- `lang <ru|en>` - Interface language
- `login` - Authorization
- `register` - Registration
- `logout` / `exit` - Logout
- `passwd` - Change password
- `reboot` - Restart system
- `whoami` - Current user
- `clear` - Clear screen
- `theme <hex>` - Set text color (#RRGGBB)
- `top` - Process monitor (interactive)

#### Social Commands
- `post` - Create post (opens editor)
- `posts [user]` - User posts
- `timeline` / `feed` - Subscription feed
- `allposts` / `global` - All posts
- `read <id>` - Read post with comments
- `reply <id> <text>` - Reply to post
- `replyc <id> <#> <text>` - Reply to comment
- `share <id> [text]` - Repost
- `trending` - Popular posts this week
- `like <id>` / `unlike <id>` - Like/unlike

#### User Commands
- `follow <user>` - Subscribe
- `unfollow <user>` - Unsubscribe
- `followers [user]` - Followers
- `following [user]` - Following
- `finger` / `whois <user>` - User profile
- `users` - List of users

#### Messages & Notifications
- `msg <user> <text>` - Send message
- `mail` / `inbox` - Inbox
- `readmsg <id>` - Read message
- `mentions` - Your mentions
- `notify` - Notifications

#### Settings
- `set_bio <text>` - Edit profile
- `block <user>` - Block user
- `search <query>` - Search

### Adding New Commands

1. Create implementation in `lib/commands/implementations/`
2. Export in `lib/commands/index.ts`
3. Add case in `lib/commands/dispatcher.ts`
4. Add to `AVAILABLE_COMMANDS` in `components/terminal/constants.ts`
5. Add translations in `lib/i18n/ru.ts` and `lib/i18n/en.ts`

Example (`lib/commands/implementations/hello.ts`):
```typescript
import { CommandResult, CommandContext } from '../types'

export function cmdHello(_args: string[], context: CommandContext): CommandResult {
  return { 
    output: [`Hello, ${context.username || 'Guest'}!`] 
  }
}
```

📖 Подробнее: [SKILLS_GUIDE.md](./SKILLS_GUIDE.md) - bashstory-commands skill

## License

MIT
