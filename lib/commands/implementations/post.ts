import { CommandResult, CommandContext } from '../types'
import { createPost, createComment, getPostsByUser, getTimeline, getAllPosts, getPostById, getUserByUsername, getUserById, getPostWithComments, getRepostCount } from '@/lib/social'

export function cmdPost(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  return { output: ['Открытие редактора...'] }
}

export function cmdPostText(text: string, context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (!text.trim()) {
    return { output: ['Пост отменён.'] }
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
    const prefix = p.post_type === 'share' ? 'RT ' : ''
    return `[${p.id}] ${prefix}${p.username}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}" (${date} ${time})`
  })

  return { output }
}

export function cmdReadPost(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length === 0) {
    return { output: ['Использование: read <post_id>'] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: ['Укажите корректный ID поста.'] }
  }

  const { post, comments } = getPostWithComments(postId)

  if (!post) {
    return { output: [`Пост #${postId} не найден.`] }
  }

  const repostCount = getRepostCount(postId)
  
  const output: string[] = []
  
  output.push('─'.repeat(50))
  output.push(`Автор: @${post.username}`)
  output.push(`Дата: ${post.created_at.replace(' ', ' ')}`)
  output.push(`Просмотров: ${post.views}`)
  if (post.likes > 0) {
    output.push(`Лайки: +${post.likes}`)
  }
  if (repostCount > 0) {
    output.push(`Репосты: ${repostCount}`)
  }
  output.push('─'.repeat(50))
  output.push('')
  output.push(post.text)
  output.push('')
  output.push('─'.repeat(50))

  if (comments.length > 0) {
    output.push(`Комментарии (${comments.length}):`)
    output.push('')
    comments.forEach((comment, index) => {
      output.push(`  #${index + 1} @${comment.username}:`)
      output.push(`     ${comment.text}`)
      output.push(`     ${comment.created_at.split(' ')[0]} ${comment.created_at.split(' ')[1]?.slice(0, 5) || ''}`)
      output.push('')
    })
  } else {
    output.push('Комментариев пока нет.')
    output.push('')
  }
  
  output.push('─'.repeat(50))
  output.push(`Ответить на пост: reply ${postId} <текст>`)
  output.push(`Ответить на комментарий: replyc ${postId} <comment_id> <текст>`)
  output.push(`Репост: share ${postId}`)

  return { output, renderMarkdown: true }
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
    const prefix = p.post_type === 'share' ? 'RT ' : ''
    return `[${p.id}] ${prefix}${p.username}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}" (${date} ${time})`
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
  const comment = createComment(context.userId, postId, text)

  if (!comment) {
    return { output: ['Ошибка при отправке ответа.'] }
  }

  return { output: [`Ответ на пост #${postId} отправлен (комментарий #${comment.id}).`] }
}

export function cmdReplyComment(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length < 3) {
    return { output: ['Использование: replyc <post_id> <#> <текст>'] }
  }

  const postId = parseInt(args[0])
  const commentNum = parseInt(args[1])
  
  if (isNaN(postId)) {
    return { output: ['Укажите корректный ID поста.'] }
  }
  
  if (isNaN(commentNum) || commentNum < 1) {
    return { output: ['Укажите номер комментария (#).'] }
  }

  const parentPost = getPostById(postId)
  if (!parentPost) {
    return { output: [`Пост #${postId} не найден.`] }
  }

  const { comments } = getPostWithComments(postId)
  
  if (commentNum > comments.length) {
    return { output: [`Комментарий #${commentNum} не найден. Всего ${comments.length} комментариев.`] }
  }
  
  const targetComment = comments[commentNum - 1]
  if (!targetComment) {
    return { output: [`Комментарий #${commentNum} не найден.`] }
  }

  const text = args.slice(2).join(' ')
  const comment = createComment(context.userId, postId, text, targetComment.id)

  if (!comment) {
    return { output: ['Ошибка при отправке ответа.'] }
  }

  return { output: [`Ответ на комментарий #${commentNum} отправлен (комментарий #${comment.id}).`] }
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
    const prefix = p.post_type === 'share' ? 'RT ' : ''
    return `[${p.id}] ${prefix}${p.username}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}" (${date} ${time})`
  })

  return { output }
}
