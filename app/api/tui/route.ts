import { NextRequest, NextResponse } from 'next/server'
import { ensureDb, getDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    await ensureDb()

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value
    const session = getSession(sessionToken || null)

    const { action, payload } = await request.json()
    const db = getDb()

    // ── fetch_post ──────────────────────────────────────────────────────────
    if (action === 'fetch_post') {
      const { postId } = payload as { postId: number }
      const post = db.prepare(`
        SELECT p.id, u.username, p.text, p.created_at, p.likes, p.views,
               (SELECT COUNT(*) FROM posts rp WHERE rp.parent_id = p.id AND rp.post_type = 'repost') as reposts
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `).get(postId)
      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

      const comments = db.prepare(`
        SELECT c.id, u.username, c.text, c.created_at
        FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
        LIMIT 50
      `).all(postId)

      // Increment view count
      db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(postId)

      return NextResponse.json({ post, comments })
    }

    // ── fetch_profile ───────────────────────────────────────────────────────
    if (action === 'fetch_profile') {
      const { username } = payload as { username?: string }
      const targetUsername = username || session.username
      if (!targetUsername) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

      const profile = db.prepare(`
        SELECT u.id, u.username, u.bio, u.is_private, u.lang, u.created_at,
               (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
               (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) as followers_count,
               (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count
        FROM users u WHERE u.username = ?
      `).get(targetUsername)

      if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      const p = profile as { id: number; [key: string]: unknown }

      const isOwnProfile = session.username === targetUsername
      let isFollowing = false
      if (session.userId && !isOwnProfile) {
        const row = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?').get(session.userId, p.id)
        isFollowing = !!row
      }

      return NextResponse.json({ profile, isOwnProfile, isFollowing })
    }

    // ── fetch_mail ──────────────────────────────────────────────────────────
    if (action === 'fetch_mail') {
      if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

      const messages = db.prepare(`
        SELECT m.id, u.username as from_username, m.text, m.read_at, m.created_at
        FROM messages m JOIN users u ON m.from_user_id = u.id
        WHERE m.to_user_id = ?
        ORDER BY m.created_at DESC
        LIMIT 50
      `).all(session.userId)

      return NextResponse.json({ messages })
    }

    // ── read_message ────────────────────────────────────────────────────────
    if (action === 'read_message') {
      if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
      const { id } = payload as { id: number }

      const msg = db.prepare(`
        SELECT m.id, u.username as from_username, m.text, m.read_at, m.created_at
        FROM messages m JOIN users u ON m.from_user_id = u.id
        WHERE m.id = ? AND m.to_user_id = ?
      `).get(id, session.userId)

      if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      db.prepare(`UPDATE messages SET read_at = datetime('now') WHERE id = ?`).run(id)
      return NextResponse.json({ message: msg })
    }

    // ── send_message ────────────────────────────────────────────────────────
    if (action === 'send_message') {
      if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
      const { toUsername, text } = payload as { toUsername: string; text: string }

      const recipient = db.prepare('SELECT id FROM users WHERE username = ?').get(toUsername) as { id: number } | undefined
      if (!recipient) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      db.prepare(`
        INSERT INTO messages (from_user_id, to_user_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(session.userId, recipient.id, text)

      return NextResponse.json({ ok: true })
    }

    // ── like_post ───────────────────────────────────────────────────────────
    if (action === 'like_post') {
      if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
      const { postId } = payload as { postId: number }
      db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(postId)
      return NextResponse.json({ ok: true })
    }

    // ── reply_post ──────────────────────────────────────────────────────────
    if (action === 'reply_post') {
      if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
      const { postId, text } = payload as { postId: number; text: string }
      db.prepare(`
        INSERT INTO comments (post_id, user_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(postId, session.userId, text)
      return NextResponse.json({ ok: true })
    }

    // ── share_post ──────────────────────────────────────────────────────────
    if (action === 'share_post') {
      if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
      const { postId } = payload as { postId: number }
      db.prepare(`
        INSERT INTO posts (user_id, text, parent_id, post_type, created_at)
        VALUES (?, ?, ?, 'repost', datetime('now'))
      `).run(session.userId, `>> repost of #${postId}`, postId)
      return NextResponse.json({ ok: true })
    }

    // ── follow ──────────────────────────────────────────────────────────────
    if (action === 'follow') {
      if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
      const { username } = payload as { username: string }
      const target = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined
      if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      db.prepare(`INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, datetime('now'))`).run(session.userId, target.id)
      return NextResponse.json({ ok: true })
    }

    // ── unfollow ─────────────────────────────────────────────────────────────
    if (action === 'unfollow') {
      if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
      const { username } = payload as { username: string }
      const target = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number } | undefined
      if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(session.userId, target.id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('TUI API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
