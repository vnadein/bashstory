# BashStory Database Skill

## Назначение
Работа с базой данных SQLite проекта BashStory.

## Контекст
- **БД:** SQLite
- **Файл:** `data/quotes.db`
- **Доступ:** Через MCP `sqlite` сервер

## Схема БД
Основные таблицы:
- `users` - пользователи
- `posts` - посты
- `comments` - комментарии
- `likes` - лайки
- `sessions` - сессии

## Примеры SQL запросов
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

## Связанные MCP серверы
- `sqlite` - выполнение SQL запросов
- `filesystem` - чтение миграций и схем
