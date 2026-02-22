import { CommandResult, CommandContext } from '../types'
import { getTrendingPosts, likePost, unlikePost, getPostById } from '@/lib/social'

export function cmdTrending(args: string[], _context: CommandContext): CommandResult {
  let limit = 20
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) {
      limit = parseInt(args[i + 1]) || 20
      i++
    }
  }

  const posts = getTrendingPosts(limit)

  if (posts.length === 0) {
    return { output: ['За последнюю неделю нет популярных постов.'] }
  }

  const output = ['Тренды за последние 7 дней:', '']
  output.push(...posts.map(p => {
    const date = p.created_at.split(' ')[0]
    const prefix = p.post_type === 'share' ? 'RT ' : ''
    return `[${p.id}] +${p.likes} ${prefix}${p.username} ${date}: "${p.text.slice(0, 50)}${p.text.length > 50 ? '...' : ''}"`
  }))

  return { output }
}

export function cmdLike(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length === 0) {
    return { output: ['Использование: like <post_id>'] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: ['Укажите корректный ID поста.'] }
  }

  const post = getPostById(postId)
  if (!post) {
    return { output: [`Пост #${postId} не найден.`] }
  }

  const success = likePost(context.userId, postId)

  if (!success) {
    return { output: ['Не удалось поставить лайк.'] }
  }

  return { output: [`Лайк поставлен посту #${postId}.`] }
}

export function cmdUnlike(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length === 0) {
    return { output: ['Использование: unlike <post_id>'] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: ['Укажите корректный ID поста.'] }
  }

  const success = unlikePost(context.userId, postId)

  if (!success) {
    return { output: ['Не удалось убрать лайк.'] }
  }

  return { output: [`Лайк убран с поста #${postId}.`] }
}
