import { CommandResult, CommandContext } from '../types'
import { createPost, createComment, getPostsByUser, getTimeline, getAllPosts, getPostById, getUserByUsername, getUserById, getPostWithComments, getRepostCount } from '@/lib/social'
import { getLocale, t } from '@/lib/i18n'

export function cmdPost(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  return { output: [t('terminal.openEditor')] }
}

export function cmdPostText(text: string, context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (!text.trim()) {
    return { output: [t('terminal.postCancelled')] }
  }

  const post = createPost(context.userId, text)
  if (!post) {
    return { output: [t('terminal.postError')] }
  }

  return { output: [t('terminal.postPublished', { id: post.id.toString() })] }
}

export function cmdPosts(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
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
    return { output: [t('terminal.userNotFound', { username: username || '' })] }
  }

  const posts = getPostsByUser(user.id, limit)

  if (posts.length === 0) {
    return { output: [t('terminal.noPostsByUser', { username: user.username })] }
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
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'read <post_id>' })] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: [t('terminal.invalidPostId')] }
  }

  const { post, comments } = getPostWithComments(postId)

  if (!post) {
    return { output: [t('terminal.postNotFound', { id: postId.toString() })] }
  }

  const repostCount = getRepostCount(postId)
  const lang = getLocale()
  
  const output: string[] = []
  
  output.push('─'.repeat(50))
  output.push(`${t('terminal.author')}: @${post.username}`)
  output.push(`${t('terminal.date')}: ${post.created_at.replace(' ', ' ')}`)
  output.push(t('terminal.views', { count: post.views.toString() }))
  if (post.likes > 0) {
    output.push(t('terminal.likes', { count: post.likes.toString() }))
  }
  if (repostCount > 0) {
    output.push(t('terminal.reposts', { count: repostCount.toString() }))
  }
  output.push('─'.repeat(50))
  output.push('')
  output.push(post.text)
  output.push('')
  output.push('─'.repeat(50))

  if (comments.length > 0) {
    output.push(t('terminal.commentsCount', { count: comments.length.toString() }))
    output.push('')
    comments.forEach((comment, index) => {
      output.push(`  #${index + 1} @${comment.username}:`)
      output.push(`     ${comment.text}`)
      output.push(`     ${comment.created_at.split(' ')[0]} ${comment.created_at.split(' ')[1]?.slice(0, 5) || ''}`)
      output.push('')
    })
  } else {
    output.push(t('terminal.noComments'))
    output.push('')
  }
  
  output.push('─'.repeat(50))
  output.push(t('terminal.replyToPost', { postId: postId.toString() }))
  output.push(t('terminal.replyToComment', { postId: postId.toString() }))
  output.push(t('terminal.sharePost', { postId: postId.toString() }))

  return { output, renderMarkdown: true }
}

export function cmdTimeline(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  const posts = getTimeline(context.userId)

  if (posts.length === 0) {
    return { output: [t('terminal.timelineEmpty')] }
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
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length < 2) {
    return { output: [t('terminal.usage', { usage: 'reply <post_id> <text>' })] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: [t('terminal.invalidPostId')] }
  }

  const parentPost = getPostById(postId)
  if (!parentPost) {
    return { output: [t('terminal.postNotFound', { id: postId.toString() })] }
  }

  const text = args.slice(1).join(' ')
  const comment = createComment(context.userId, postId, text)

  if (!comment) {
    return { output: [t('terminal.replyError')] }
  }

  return { output: [t('terminal.replySuccess', { id: postId.toString(), commentId: comment.id.toString() })] }
}

export function cmdReplyComment(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length < 3) {
    return { output: [t('terminal.usage', { usage: 'replyc <post_id> <#> <text>' })] }
  }

  const postId = parseInt(args[0])
  const commentNum = parseInt(args[1])
  
  if (isNaN(postId)) {
    return { output: [t('terminal.invalidPostId')] }
  }
  
  if (isNaN(commentNum) || commentNum < 1) {
    return { output: [t('terminal.invalidNumber')] }
  }

  const parentPost = getPostById(postId)
  if (!parentPost) {
    return { output: [t('terminal.postNotFound', { id: postId.toString() })] }
  }

  const { comments } = getPostWithComments(postId)
  
  if (commentNum > comments.length) {
    return { output: [t('terminal.replyCommentNotFoundTotal', { num: commentNum.toString(), total: comments.length.toString() })] }
  }
  
  const targetComment = comments[commentNum - 1]
  if (!targetComment) {
    return { output: [t('terminal.replyCommentNotFound', { num: commentNum.toString() })] }
  }

  const text = args.slice(2).join(' ')
  const comment = createComment(context.userId, postId, text, targetComment.id)

  if (!comment) {
    return { output: [t('terminal.replyError')] }
  }

  return { output: [t('terminal.replySuccess', { id: postId.toString(), commentId: comment.id.toString() })] }
}

export function cmdShare(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length < 1) {
    return { output: [t('terminal.usage', { usage: 'share <post_id> [comment]' })] }
  }

  const postId = parseInt(args[0])
  if (isNaN(postId)) {
    return { output: [t('terminal.invalidPostId')] }
  }

  const originalPost = getPostById(postId)
  if (!originalPost) {
    return { output: [t('terminal.postNotFound', { id: postId.toString() })] }
  }

  const comment = args.slice(1).join(' ')
  const text = comment ? `${comment}\n\nRT @${originalPost.username}: ${originalPost.text}` : `RT @${originalPost.username}: ${originalPost.text}`

  const post = createPost(context.userId, text, postId, 'share')

  if (!post) {
    return { output: [t('terminal.shareError')] }
  }

  return { output: [t('terminal.shareSuccess', { id: postId.toString() })] }
}

export function cmdAllPosts(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
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
    return { output: [t('terminal.noPosts')] }
  }

  const output = posts.map(p => {
    const date = p.created_at.split(' ')[0]
    const time = p.created_at.split(' ')[1]?.slice(0, 5) || ''
    const prefix = p.post_type === 'share' ? 'RT ' : ''
    return `[${p.id}] ${prefix}${p.username}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}" (${date} ${time})`
  })

  return { output }
}
