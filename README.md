# Terminal Quote Manager

A retro terminal-style quote management application with command-line interface.

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

- **Framework**: Next.js 16
- **UI**: React 19, Tailwind CSS 4
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth v5
- **Components**: shadcn/ui
- **Styling**: Terminal theme with green on black aesthetics

## Project Structure

```
app/
├── api/           # API routes
├── login/         # Login page
├── register/      # Registration page
├── terminal/      # Main terminal interface
components/
├── terminal/      # Terminal UI components
├── providers/     # React providers
lib/
├── commands/      # Command system
│   ├── implementations/  # Command handlers
│   ├── parser.ts        # Command parser
│   └── registry.ts      # Command registry
├── auth.ts        # NextAuth configuration
└── prisma.ts      # Prisma client
prisma/
├── schema.prisma  # Database schema
└── seed.js        # Database seed data
```

## Development

### Adding New Commands

1. Create a new file in `lib/commands/implementations/`
2. Import and use `registerCommand` from the registry
3. Add the import to `lib/commands/index.ts`

Example:
```typescript
import { registerCommand } from '../registry'

registerCommand({
  name: 'mycommand',
  description: 'My custom command',
  usage: 'mycommand [args]',
  handler: async (cmd, context) => {
    return { output: 'Hello!' }
  },
})
```

## License

MIT
