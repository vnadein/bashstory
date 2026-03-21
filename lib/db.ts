import path from 'path'
import fs from 'fs'

// sql.js is pure WASM – no native bindings required
// eslint-disable-next-line @typescript-eslint/no-require-imports
const initSqlJs = require('sql.js')

// Point sql.js at the WASM file bundled inside node_modules so it can be
// found reliably at runtime regardless of the Next.js output directory.
const WASM_PATH = path.join(
  process.cwd(),
  'node_modules',
  'sql.js',
  'dist',
  'sql-wasm.wasm'
)

const DB_PATH = path.join(process.cwd(), 'data', 'bashstory.db')

// ─── Thin synchronous wrapper that mirrors the better-sqlite3 API ────────────

export interface Statement {
  get(...params: unknown[]): Record<string, unknown> | undefined
  all(...params: unknown[]): Record<string, unknown>[]
  run(...params: unknown[]): { changes: number; lastInsertRowid: number }
}

export class SyncDatabase {
  private db: import('sql.js').Database

  constructor(db: import('sql.js').Database) {
    this.db = db
  }

  exec(sql: string): void {
    this.db.run(sql)
    _persist(this.db)
  }

  prepare(sql: string): Statement {
    const db = this.db
    return {
      get(...params: unknown[]) {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        const hasRow = stmt.step()
        if (!hasRow) { stmt.free(); return undefined }
        const row = stmt.getAsObject()
        stmt.free()
        return row as Record<string, unknown>
      },
      all(...params: unknown[]) {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        const rows: Record<string, unknown>[] = []
        while (stmt.step()) rows.push(stmt.getAsObject() as Record<string, unknown>)
        stmt.free()
        return rows
      },
      run(...params: unknown[]) {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        stmt.step()
        stmt.free()
        const rawDb = db as unknown as { getRowsModified(): number; exec(s: string): { values: unknown[][] }[] }
        const changes = rawDb.getRowsModified()
        const lastInsertRowid = Number(rawDb.exec('SELECT last_insert_rowid()')[0]?.values?.[0]?.[0] ?? 0)
        _persist(db)
        return { changes, lastInsertRowid }
      },
    }
  }

  pragma(pragma: string): void {
    this.db.run(`PRAGMA ${pragma}`)
  }
}

// ─── Singleton state ─────────────────────────────────────────────────────────

let _db: SyncDatabase | null = null
let _initPromise: Promise<SyncDatabase> | null = null

function _persist(raw: import('sql.js').Database) {
  try {
    const data = raw.export()
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  } catch {
    // non-fatal – in-memory data is still valid
  }
}

async function _bootstrap(): Promise<SyncDatabase> {
  const SQL = await initSqlJs({
    locateFile: () => WASM_PATH,
  })

  let rawDb: import('sql.js').Database
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  if (fs.existsSync(DB_PATH)) {
    rawDb = new SQL.Database(fs.readFileSync(DB_PATH))
  } else {
    rawDb = new SQL.Database()
  }

  const db = new SyncDatabase(rawDb)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      bio TEXT DEFAULT '',
      is_private INTEGER DEFAULT 0,
      lang TEXT DEFAULT 'en',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      parent_id INTEGER,
      post_type TEXT NOT NULL DEFAULT 'post',
      likes INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      parent_comment_id INTEGER,
      likes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_comment_id) REFERENCES comments(id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      followee_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (followee_id) REFERENCES users(id),
      UNIQUE(follower_id, followee_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reference_id INTEGER,
      from_user_id INTEGER,
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blocker_id INTEGER NOT NULL,
      blocked_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (blocker_id) REFERENCES users(id),
      FOREIGN KEY (blocked_id) REFERENCES users(id),
      UNIQUE(blocker_id, blocked_id)
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

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
    CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `)

  // Seed default users
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcryptjs')
  if (!db.prepare('SELECT id FROM users WHERE username = ?').get('admin')) {
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', bcrypt.hashSync('admin', 10), 'admin')
  }
  if (!db.prepare('SELECT id FROM users WHERE username = ?').get('root')) {
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('root', bcrypt.hashSync('esw1251yz', 10), 'admin')
  }

  _db = db
  return db
}

/**
 * Ensure DB is ready. Call `await ensureDb()` once at the top of every
 * Route Handler / Server Action. After the first call the singleton is cached
 * and subsequent calls return instantly.
 */
export async function ensureDb(): Promise<SyncDatabase> {
  if (_db) return _db
  if (!_initPromise) _initPromise = _bootstrap()
  return _initPromise
}

/**
 * Synchronous getter – only safe after `await ensureDb()` has resolved.
 * Used by lib/social.ts, lib/session.ts, and command implementations that
 * are always called from an already-awaited route handler context.
 */
export function getDb(): SyncDatabase {
  if (!_db) throw new Error('DB not initialised – call await ensureDb() first in your route handler')
  return _db
}
