import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'quotes.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    const fs = require('fs')
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')

    // Create tables if they don't exist
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (author_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        value INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (quote_id) REFERENCES quotes(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(quote_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS processes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pid INTEGER NOT NULL,
        command TEXT NOT NULL,
        user TEXT NOT NULL,
        cpu REAL NOT NULL DEFAULT 0,
        memory REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'running',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `)

    // Seed admin if not exists
    const admin = _db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
    if (!admin) {
      const bcrypt = require('bcryptjs')
      const hash = bcrypt.hashSync('admin', 10)
      _db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin')
      
      const adminUser = _db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: number }

      const sampleQuotes = [
        'Программирование - это искусство говорить компьютеру, что делать.',
        'Лучший код - тот, который не написан.',
        'Первое правило программирования: если это работает - не трогай.',
        'Код пишется один раз, а читается тысячу.',
        'В теории, теория и практика одинаковы. На практике - нет.',
        'Любая достаточно продвинутая технология неотличима от магии.',
        'Компьютеры бесполезны. Они могут только давать ответы. -- Пикассо',
        'Самая большая ошибка - бояться совершить ошибку.',
        'Unix очень прост. Но нужно быть гением, чтобы понять его простоту.',
        'Есть два способа написать программу без ошибок. Но работает только третий.',
      ]

      const insertQuote = _db.prepare('INSERT INTO quotes (text, author_id, status) VALUES (?, ?, ?)')
      for (const text of sampleQuotes) {
        insertQuote.run(text, adminUser.id, 'approved')
      }
    }
  }

  return _db
}
