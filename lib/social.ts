import { getDb } from './db'

export interface UserProfile {
  id: number
  username: string
  bio: string
  is_private: number
  created_at: string
  posts_count?: number
  followers_count?: number
  following_count?: number
}

export interface Post {
  id: number
  user_id: number
  username?: string
  text: string
  parent_id: number | null
  post_type: string
  likes: number
  created_at: string
}

export interface Message {
  id: number
  from_user_id: number
  from_username?: string
  to_user_id: number
  to_username?: string
  text: string
  read_at: string | null
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  type: string
  reference_id: number | null
  from_user_id: number | null
  from_username?: string
  read_at: string | null
  created_at: string
}

export function getUserById(id: number): UserProfile | undefined {
  const db = getDb()
  return db.prepare(`
    SELECT u.id, u.username, u.bio, u.is_private, u.created_at,
           (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
           (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) as followers_count,
           (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count
    FROM users u WHERE u.id = ?
  `).get(id) as UserProfile | undefined
}

export function getUserByUsername(username: string): UserProfile | undefined {
  const db = getDb()
  return db.prepare(`
    SELECT u.id, u.username, u.bio, u.is_private, u.created_at,
           (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
           (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) as followers_count,
           (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count
    FROM users u WHERE u.username = ?
  `).get(username) as UserProfile | undefined
}

export function getAllUsers(): UserProfile[] {
  const db = getDb()
  return db.prepare(`
    SELECT u.id, u.username, u.bio, u.is_private, u.created_at,
           (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
           (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) as followers_count,
           (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count
    FROM users u ORDER BY u.username
  `).all() as UserProfile[]
}

export function updateUserBio(userId: number, bio: string): boolean {
  const db = getDb()
  const result = db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, userId)
  return result.changes > 0
}

export function createPost(userId: number, text: string, parentId?: number, postType = 'post'): Post | undefined {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO posts (user_id, text, parent_id, post_type) VALUES (?, ?, ?, ?)
  `).run(userId, text, parentId || null, postType)
  
  if (postType === 'reply') {
    const parentPost = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(parentId) as { user_id: number } | undefined
    if (parentPost) {
      createNotification(parentPost.user_id, 'reply', result.lastInsertRowid as number, userId)
    }
  } else if (postType === 'share') {
    const originalPost = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(parentId) as { user_id: number } | undefined
    if (originalPost) {
      createNotification(originalPost.user_id, 'share', result.lastInsertRowid as number, userId)
    }
  }
  
  const mentions = text.match(/@(\w+)/g)
  if (mentions) {
    for (const mention of mentions) {
      const username = mention.slice(1)
      const mentionedUser = getUserByUsername(username)
      if (mentionedUser && mentionedUser.id !== userId) {
        createNotification(mentionedUser.id, 'mention', result.lastInsertRowid as number, userId)
      }
    }
  }
  
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid) as Post | undefined
}

export function getPostsByUser(userId: number, limit = 10, offset = 0): Post[] {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, u.username 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.user_id = ? AND p.post_type = 'post'
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset) as Post[]
}

export function getPostById(postId: number): Post | undefined {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, u.username 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.id = ?
  `).get(postId) as Post | undefined
}

export function getTimeline(userId: number, limit = 20): Post[] {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, u.username 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?)
      AND p.post_type = 'post'
    ORDER BY p.created_at DESC 
    LIMIT ?
  `).all(userId, limit) as Post[]
}

export function getAllPosts(limit = 50): Post[] {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, u.username 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.post_type = 'post'
    ORDER BY p.created_at DESC 
    LIMIT ?
  `).all(limit) as Post[]
}

export function getTrendingPosts(limit = 20): Post[] {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, u.username 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.post_type = 'post'
      AND p.created_at >= datetime('now', '-7 days')
    ORDER BY p.likes DESC, p.created_at DESC
    LIMIT ?
  `).all(limit) as Post[]
}

export function likePost(userId: number, postId: number): boolean {
  const db = getDb()
  const post = getPostById(postId)
  if (!post || post.user_id === userId) return false
  
  db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(postId)
  createNotification(post.user_id, 'like', postId, userId)
  return true
}

export function unlikePost(userId: number, postId: number): boolean {
  const db = getDb()
  const post = getPostById(postId)
  if (!post) return false
  
  const result = db.prepare('UPDATE posts SET likes = likes - 1 WHERE id = ? AND likes > 0').run(postId)
  return result.changes > 0
}

export function getMentions(userId: number): Post[] {
  const db = getDb()
  const user = getUserById(userId)
  if (!user) return []
  
  return db.prepare(`
    SELECT p.*, u.username 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.text LIKE ? AND p.user_id != ?
    ORDER BY p.created_at DESC 
    LIMIT 50
  `).all(`%@${user.username}%`, userId) as Post[]
}

export function follow(followerId: number, followeeUsername: string): boolean {
  const db = getDb()
  const followee = getUserByUsername(followeeUsername)
  if (!followee || followerId === followee.id) return false
  
  const isBlocked = db.prepare(`
    SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?
  `).get(followee.id, followerId)
  if (isBlocked) return false
  
  try {
    db.prepare('INSERT INTO follows (follower_id, followee_id) VALUES (?, ?)').run(followerId, followee.id)
    createNotification(followee.id, 'follow', undefined, followerId)
    return true
  } catch {
    return false
  }
}

export function unfollow(followerId: number, followeeUsername: string): boolean {
  const db = getDb()
  const followee = getUserByUsername(followeeUsername)
  if (!followee) return false
  
  const result = db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(followerId, followee.id)
  return result.changes > 0
}

export function getFollowers(userId: number): UserProfile[] {
  const db = getDb()
  return db.prepare(`
    SELECT u.id, u.username, u.bio, u.is_private, u.created_at
    FROM users u
    JOIN follows f ON f.follower_id = u.id
    WHERE f.followee_id = ?
  `).all(userId) as UserProfile[]
}

export function getFollowing(userId: number): UserProfile[] {
  const db = getDb()
  return db.prepare(`
    SELECT u.id, u.username, u.bio, u.is_private, u.created_at
    FROM users u
    JOIN follows f ON f.followee_id = u.id
    WHERE f.follower_id = ?
  `).all(userId) as UserProfile[]
}

export function isFollowing(followerId: number, followeeUsername: string): boolean {
  const db = getDb()
  const followee = getUserByUsername(followeeUsername)
  if (!followee) return false
  
  const result = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(followerId, followee.id)
  return !!result
}

export function sendMessage(fromUserId: number, toUsername: string, text: string): boolean {
  const db = getDb()
  const toUser = getUserByUsername(toUsername)
  if (!toUser || fromUserId === toUser.id) return false
  
  const isBlocked = db.prepare(`
    SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?
  `).get(toUser.id, fromUserId)
  if (isBlocked) return false
  
  db.prepare('INSERT INTO messages (from_user_id, to_user_id, text) VALUES (?, ?, ?)').run(fromUserId, toUser.id, text)
  createNotification(toUser.id, 'message', undefined, fromUserId)
  return true
}

export function getInbox(userId: number): Message[] {
  const db = getDb()
  return db.prepare(`
    SELECT m.*, u.username as from_username
    FROM messages m
    JOIN users u ON m.from_user_id = u.id
    WHERE m.to_user_id = ?
    ORDER BY m.created_at DESC
    LIMIT 50
  `).all(userId) as Message[]
}

export function getMessage(messageId: number, userId: number): Message | undefined {
  const db = getDb()
  const message = db.prepare(`
    SELECT m.*, u.username as from_username
    FROM messages m
    JOIN users u ON m.from_user_id = u.id
    WHERE m.id = ? AND (m.to_user_id = ? OR m.from_user_id = ?)
  `).get(messageId, userId, userId) as Message | undefined
  
  if (message && !message.read_at && message.to_user_id === userId) {
    db.prepare('UPDATE messages SET read_at = datetime("now") WHERE id = ?').run(messageId)
  }
  
  return message
}

export function createNotification(userId: number, type: string, referenceId?: number, fromUserId?: number): void {
  const db = getDb()
  db.prepare('INSERT INTO notifications (user_id, type, reference_id, from_user_id) VALUES (?, ?, ?, ?)').run(
    userId, type, referenceId || null, fromUserId || null
  )
}

export function getNotifications(userId: number): Notification[] {
  const db = getDb()
  return db.prepare(`
    SELECT n.*, u.username as from_username
    FROM notifications n
    LEFT JOIN users u ON n.from_user_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(userId) as Notification[]
}

export function getUnreadNotificationsCount(userId: number): number {
  const db = getDb()
  const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL').get(userId) as { count: number }
  return result.count
}

export function markNotificationsRead(userId: number): void {
  const db = getDb()
  db.prepare('UPDATE notifications SET read_at = datetime("now") WHERE user_id = ? AND read_at IS NULL').run(userId)
}

export function blockUser(blockerId: number, blockedUsername: string): boolean {
  const db = getDb()
  const blocked = getUserByUsername(blockedUsername)
  if (!blocked || blockerId === blocked.id) return false
  
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(blockerId, blocked.id)
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(blocked.id, blockerId)
  
  try {
    db.prepare('INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)').run(blockerId, blocked.id)
    return true
  } catch {
    return false
  }
}

export function isBlocked(blockerId: number, blockedUsername: string): boolean {
  const db = getDb()
  const blocked = getUserByUsername(blockedUsername)
  if (!blocked) return false
  
  const result = db.prepare('SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?').get(blockerId, blocked.id)
  return !!result
}

export function searchPosts(query: string): Post[] {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, u.username 
    FROM posts p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.text LIKE ? AND p.post_type = 'post'
    ORDER BY p.created_at DESC 
    LIMIT 50
  `).all(`%${query}%`) as Post[]
}

export function searchUsers(query: string): UserProfile[] {
  const db = getDb()
  return db.prepare(`
    SELECT u.id, u.username, u.bio, u.is_private, u.created_at,
           (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
           (SELECT COUNT(*) FROM follows WHERE followee_id = u.id) as followers_count,
           (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count
    FROM users u 
    WHERE u.username LIKE ?
    ORDER BY u.username
  `).all(`%${query}%`) as UserProfile[]
}

export interface LoginSummary {
  unreadMessages: number
  unreadNotifications: number
}

export function getLoginSummary(userId: number): LoginSummary {
  const db = getDb()
  
  const unreadMessages = db.prepare(`
    SELECT COUNT(*) as count FROM messages WHERE to_user_id = ? AND read_at IS NULL
  `).get(userId) as { count: number }
  
  const unreadNotifications = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL
  `).get(userId) as { count: number }
  
  return {
    unreadMessages: unreadMessages.count,
    unreadNotifications: unreadNotifications.count,
  }
}
