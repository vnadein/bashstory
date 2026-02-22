import { CommandResult, CommandContext } from '../types'
import { createPost, getPostsByUser, getTimeline, getAllPosts, getPostById, getUserByUsername, getUserById } from '@/lib/social'

export function cmdPost(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const text = args.join(' ')
  if (!text) {
    return { output: ['Использование: post <текст>'] }
  }

  const post = createPost(context.userId, text)
  if (!post) {
    return { output: ['Ошибка при создании поста.'] }
  }

  return { output: [`Пост #${post.id} опубликован.`] }
}

export function cmdPosts(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  let username = context.username
  let limit = 10

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) {
      limit = parseInt(args[i + 1]) || 10
      i++
    } else if (!username) {
      username = args[i]
    }
  }

  const user = username ? getUserByUsername(username) : getUserById(context.userId)
  if (!user) {
    return { output: [`Пользователь ${username} не найден.`] }
  }

  const posts = getPostsByUser(user.id, limit)

  if (posts.length === 0) {
    return { output: [`У пользователя ${user.username} нет постов.`] }
  }

  const output = posts.map(p => {
    const date = p.created_at.split(' ')[0]
    const time = p.created_at.split(' ')[1]?.slice(0, 5) || ''
    return `[${p.id}] ${date} ${time} "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}"`
  })

  return { output }
}

export function cmdTimeline(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const posts = getTimeline(context.userId)

  if (posts.length === 0) {
    return { output: ['Лента пуста. Подпишитесь на кого-нибудь!'] }
  }

  const output = posts.map(p => {
    const date = p.created_at.split(' ')[0]
    const time = p.created_at.split(' ')[1]?.slice(0, 5) || ''
    return `[${p.id}] ${p.username}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}" (${date} ${time})`
  })

  return { output }
}

export function cmdReply(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length < 2) {
    return { output: ['Использование: reply <post_id> <текст>'] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: ['Укажите корректный ID поста.'] }
  }

  const parentPost = getPostById(postId)
  if (!parentPost) {
    return { output: [`Пост #${postId} не найден.`] }
  }

  const text = args.slice(1).join(' ')
  const post = createPost(context.userId, text, postId, 'reply')

  if (!post) {
    return { output: ['Ошибка при отправке ответа.'] }
  }

  return { output: [`Ответ на пост #${postId} отправлен.`] }
}

export function cmdShare(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length < 1) {
    return { output: ['Использование: share <post_id> [комментарий]'] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: ['Укажите корректный ID поста.'] }
  }

  const originalPost = getPostById(postId)
  if (!originalPost) {
    return { output: [`Пост #${postId} не найден.`] }
  }

  const comment = args.slice(1).join(' ')
  const text = comment ? `${comment}\n\nRT @${originalPost.username}: ${originalPost.text}` : `RT @${originalPost.username}: ${originalPost.text}`

  const post = createPost(context.userId, text, postId, 'share')

  if (!post) {
    return { output: ['Ошибка при репосте.'] }
  }

  return { output: [`Пост #${postId} репостнут.`] }
}

export function cmdAllPosts(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  let limit = 50
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) {
      limit = parseInt(args[i + 1]) || 50
      i++
    }
  }

  const posts = getAllPosts(limit)

  if (posts.length === 0) {
    return { output: ['Постов пока нет.'] }
  }

  const output = posts.map(p => {
    const date = p.created_at.split(' ')[0]
    const time = p.created_at.split(' ')[1]?.slice(0, 5) || ''
    return `[${p.id}] ${p.username}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}" (${date} ${time})`
  })

  return { output }
}
