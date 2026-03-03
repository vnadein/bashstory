import { CommandResult, CommandContext } from '../types'
import { getTrendingPosts, likePost, unlikePost, getPostById } from '@/lib/social'
import { getLocale, t } from '@/lib/i18n'

export function cmdTrending(args: string[], context: CommandContext): CommandResult {
  const lang = getLocale()
  let limit = 20
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) {
      limit = parseInt(args[i + 1]) || 20
      i++
    }
  }

  const posts = getTrendingPosts(limit)

  if (posts.length === 0) {
    return { output: [t('terminal.noTrending')] }
  }

  const output: string[] = []
  output.push(t('terminal.trendingPosts'))
  output.push('')

  posts.forEach(p => {
    const date = p.created_at.split(' ')[0]
    const time = p.created_at.split(' ')[1]?.slice(0, 5) || ''
    output.push(`[${p.id}] ${p.username} ${date} ${time}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}" (${t('terminal.likesCount', { count: p.likes.toString() })})`)
  })

  return { output }
}

export function cmdLike(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'like <post_id>' })] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: [t('terminal.invalidId')] }
  }

  const post = getPostById(postId)
  if (!post) {
    return { output: [t('terminal.postNotFound', { id: postId.toString() })] }
  }

  if (post.user_id === context.userId) {
    return { output: [t('terminal.cannotLikeOwnPost')] }
  }

  const success = likePost(context.userId, postId)

  if (!success) {
    return { output: [t('terminal.alreadyLiked')] }
  }

  return { output: [t('terminal.likeSuccess')] }
}

export function cmdUnlike(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'unlike <post_id>' })] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: [t('terminal.invalidId')] }
  }

  const success = unlikePost(context.userId, postId)

  if (!success) {
    return { output: [t('terminal.errorOccurred')] }
  }

  return { output: [t('terminal.unlikeSuccess')] }
}
