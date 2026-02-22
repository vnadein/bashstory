import { getDb } from './db'
import crypto from 'crypto'

const TOKEN_LENGTH = 32

export interface Session {
  userId: number
  username: string
  role: string
}

export interface SessionData {
  userId: number | null
  username: string | null
  isModerator: boolean
  ip: string
}

function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
}

export function createSession(userId: number): string {
  const db = getDb()
  const token = generateToken()
  
  db.prepare(`
    INSERT INTO sessions (token, user_id, created_at)
    VALUES (?, ?, datetime('now'))
  `).run(token, userId)
  
  return token
}

export function getSession(token: string | null): SessionData {
  if (!token) {
    return { userId: null, username: null, isModerator: false, ip: '' }
  }

  const db = getDb()
  const session = db.prepare(`
    SELECT s.user_id, u.username, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as { user_id: number; username: string; role: string } | undefined

  if (!session) {
    return { userId: null, username: null, isModerator: false, ip: '' }
  }

  return {
    userId: session.user_id,
    username: session.username,
    isModerator: session.role === 'admin',
    ip: '',
  }
}

export function deleteSession(token: string): void {
  const db = getDb()
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function deleteUserSessions(userId: number): void {
  const db = getDb()
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId)
}

export function cleanOldSessions(maxAgeDays: number = 7): void {
  const db = getDb()
  db.prepare(`
    DELETE FROM sessions 
    WHERE created_at < datetime('now', '-' || ? || ' days')
  `).run(maxAgeDays)
}
