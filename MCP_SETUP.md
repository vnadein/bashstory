# MCP Servers Configuration for BAJOUR Social

## Настроенные MCP-серверы

Конфигурация находится в `~/.qwen/mcp_servers.json`

## 1. Filesystem Server
**Назначение:** Работа с файловой системой проекта

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/diablo/Documents/GitHub/bashstory"]
  }
}
```

**Возможности:**
- Чтение файлов проекта
- Запись изменений
- Навигация по директориям
- Поиск файлов

**Примеры использования:**
- `read_file` - прочитать файл
- `write_file` - записать файл
- `list_directory` - список файлов
- `search_files` - поиск по паттерну

---

## 2. SQLite Server
**Назначение:** Прямой доступ к базе данных

```json
{
  "sqlite": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite", "/Users/diablo/Documents/GitHub/bashstory/data/quotes.db"]
  }
}
```

**Возможности:**
- Выполнение SQL запросов
- Просмотр схемы БД
- Отладка данных
- Миграции

**Примеры использования:**
```sql
-- Получить всех пользователей
SELECT * FROM users;

-- Получить посты с авторами
SELECT p.*, u.username FROM posts p 
JOIN users u ON p.user_id = u.id 
ORDER BY p.created_at DESC LIMIT 10;

-- Статистика
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM posts) as posts,
  (SELECT COUNT(*) FROM comments) as comments;
```

---

## 3. Git Server
**Назначение:** Управление версиями

```json
{
  "git": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-git"]
  }
}
```

**Возможности:**
- Просмотр статуса репозитория
- Создание коммитов
- Управление ветками
- Просмотр истории

**Примеры использования:**
- `git_status` - статус изменений
- `git_commit` - создание коммита
- `git_branch` - управление ветками
- `git_log` - история коммитов

---

## 4. GitHub Server
**Назначение:** Интеграция с GitHub API

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

**Возможности:**
- Создание Pull Requests
- Управление Issues
- Запуск GitHub Actions
- Code Review

**Требуется:** Установить `GITHUB_TOKEN` в环境变量

---

## 5. Memory Server
**Назначение:** Долговременная память контекста

```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}
```

**Возможности:**
- Сохранение контекста проекта
- Запоминание предпочтений
- История решений

---

## 6. Brave Search Server
**Назначение:** Поиск актуальной информации

```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "${BRAVE_API_KEY}"
    }
  }
}
```

**Возможности:**
- Поиск документации Next.js
- Поиск решений проблем
- Актуальные best practices

**Требуется:** Установить `BRAVE_API_KEY`

---

## 7. Puppeteer Server
**Назначение:** Браузерная автоматизация

```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```

**Возможности:**
- Скриншоты страниц
- Тестирование UI
- Проверка вёрстки
- E2E тесты

**Примеры использования:**
- `puppeteer_navigate` - открыть страницу
- `puppeteer_screenshot` - сделать скриншот
- `puppeteer_evaluate` - выполнить JS

---

## 8. Terminal Server
**Назначение:** Выполнение команд

```json
{
  "terminal": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-terminal"]
  }
}
```

**Возможности:**
- Запуск dev-сервера
- Сборка проекта
- Линтинг
- Тесты

**Примеры использования:**
- `pnpm dev` - запустить разработку
- `pnpm build` - собрать проект
- `pnpm lint` - проверить код

---

## Установка MCP-серверов

### Автоматическая установка
Серверы устанавливаются автоматически через npx при первом использовании.

### Ручная установка
```bash
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-terminal
```

---

## Настройка переменных окружения

### GitHub Token
1. Создать token на https://github.com/settings/tokens
2. Добавить в ~/.zshrc или ~/.bashrc:
```bash
export GITHUB_TOKEN="ghp_..."
```

### Brave API Key
1. Получить ключ на https://brave.com/search/api/
2. Добавить в ~/.zshrc или ~/.bashrc:
```bash
export BRAVE_API_KEY="..."
```

### Применение переменных
```bash
source ~/.zshrc
# или
source ~/.bashrc
```

---

## Skills для проекта

Skills находятся в `~/.qwen/skills/`

### bashstory-commands
**Назначение:** Разработка команд терминала
**Файл:** `~/.qwen/skills/bashstory-commands/SKILL.md`

### bashstory-db
**Назначение:** Работа с базой данных
**Файл:** `~/.qwen/skills/bashstory-db/SKILL.md`

### bashstory-ui
**Назначение:** UI компоненты терминала
**Файл:** `~/.qwen/skills/bashstory-ui/SKILL.md`

### bashstory-testing
**Назначение:** Тестирование и отладка
**Файл:** `~/.qwen/skills/bashstory-testing/SKILL.md`

---

## Использование в работе

### Пример workflow

1. **Новая функция:**
   ```
   → Использовать filesystem для чтения существующих команд
   → Использовать commands skill для создания новой команды
   → Использовать terminal для тестирования
   → Использовать git для коммита
   ```

2. **Отладка БД:**
   ```
   → Использовать sqlite для просмотра данных
   → Выполнить SQL запрос для диагностики
   → Исправить данные при необходимости
   ```

3. **UI изменения:**
   ```
   → Использовать filesystem для чтения компонентов
   → Внести изменения
   → Использовать puppeteer для проверки в браузере
   → Использовать terminal для build
   ```

---

## Troubleshooting

### Сервер не запускается
```bash
# Проверить установку Node.js
node --version

# Проверить доступность npx
npx --version

# Переустановить сервер
npm uninstall -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-filesystem
```

### Проблемы с доступом к БД
```bash
# Проверить права на файл
ls -la data/quotes.db

# Проверить процесс
lsof data/quotes.db
```

### GitHub API ошибки
```bash
# Проверить токен
echo $GITHUB_TOKEN

# Проверить права токена
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

---

## Дополнительные ресурсы

- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers)
- [Next.js Documentation](https://nextjs.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
