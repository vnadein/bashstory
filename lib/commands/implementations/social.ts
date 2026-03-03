import { CommandResult, CommandContext } from '../types'
import { updateUserBio, blockUser, searchPosts, searchUsers } from '@/lib/social'
import { getLocale, t } from '@/lib/i18n'

export function cmdSetBio(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  const bio = args.join(' ')
  const success = updateUserBio(context.userId, bio)

  if (!success) {
    return { output: [t('terminal.bioError')] }
  }

  return { output: [t('terminal.bioUpdated')] }
}

export function cmdBlock(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'block <username>' })] }
  }

  const username = args[0]

  if (context.username === username) {
    return { output: [t('terminal.cannotBlockSelf')] }
  }

  const success = blockUser(context.userId, username)

  if (!success) {
    return { output: [t('terminal.blockError')] }
  }

  return { output: [t('terminal.userBlocked', { username })] }
}

export function cmdSearch(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'search <query>' })] }
  }

  const query = args.join(' ')
  const posts = searchPosts(query)
  const users = searchUsers(query)

  const output: string[] = []

  if (users.length > 0) {
    output.push(t('terminal.searchResults'))
    users.forEach(u => {
      output.push(`@${u.username}`)
    })
    output.push('')
  }

  if (posts.length > 0) {
    posts.slice(0, 10).forEach(p => {
      const date = p.created_at.split(' ')[0]
      output.push(`[${p.id}] @${p.username} ${date}: "${p.text.slice(0, 60)}${p.text.length > 60 ? '...' : ''}"`)
    })
  }

  if (output.length === 0) {
    return { output: [t('terminal.noSearchResults')] }
  }

  return { output }
}
