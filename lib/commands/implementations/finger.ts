import { CommandResult, CommandContext } from '../types'
import { getUserByUsername, getUserById, getAllUsers, getUserById as getUserProfile } from '@/lib/social'
import { getLocale, t } from '@/lib/i18n'

export function cmdFinger(args: string[], context: CommandContext): CommandResult {
  const lang = getLocale()
  
  let username: string | undefined = args[0]
  
  if (!username) {
    if (context.userId) {
      const user = getUserById(context.userId)
      username = user?.username
    }
  }

  if (!username) {
    return { output: [t('terminal.usage', { usage: 'finger [username]' })] }
  }

  const user = getUserByUsername(username)

  if (!user) {
    return { output: [t('terminal.userNotFound', { username })] }
  }

  const output: string[] = []
  
  output.push(`Login: ${user.username}`)
  output.push(`${t('terminal.postsCount', { count: (user.posts_count || 0).toString() })}`)
  output.push(t('terminal.followersLabel', { count: (user.followers_count || 0).toString() }))
  output.push(t('terminal.followingLabel', { count: (user.following_count || 0).toString() }))
  output.push(`${t('terminal.memberSince')}: ${user.created_at.split(' ')[0]}`)
  
  if (user.is_private) {
    output.push(t('terminal.accountPrivate'))
  }
  
  if (user.bio) {
    output.push('')
    output.push(`${t('terminal.bio')}: ${user.bio}`)
  }

  return { output }
}

export function cmdWhois(args: string[], context: CommandContext): CommandResult {
  return cmdFinger(args, context)
}

export function cmdUsers(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  const users = getAllUsers()

  if (users.length === 0) {
    return { output: [t('terminal.noUsers')] }
  }

  const output = users.map(u => u.username)
  return { output }
}
