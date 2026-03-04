import { CommandResult, CommandContext } from '../types'
import { follow, unfollow, getFollowers, getFollowing, getUserByUsername } from '@/lib/social'
import { t } from '@/lib/i18n'

export function cmdFollow(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'follow <username>' })] }
  }

  const username = args[0]
  const success = follow(context.userId, username)

  if (!success) {
    const user = getUserByUsername(username)
    if (!user) {
      return { output: [t('terminal.userNotFound', { username })] }
    }
    if (user.id === context.userId) {
      return { output: [t('terminal.cannotFollowSelf')] }
    }
    return { output: [t('terminal.alreadyFollowing', { username })] }
  }

  return { output: [t('terminal.followSuccess', { username })] }
}

export function cmdUnfollow(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  if (args.length === 0) {
    return { output: [t('terminal.usage', { usage: 'unfollow <username>' })] }
  }

  const username = args[0]
  const success = unfollow(context.userId, username)

  if (!success) {
    return { output: [t('terminal.userNotFound', { username })] }
  }

  return { output: [t('terminal.unfollowSuccess', { username })] }
}

export function cmdFollowers(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  let targetUserId = context.userId

  if (args.length > 0) {
    const user = getUserByUsername(args[0])
    if (!user) {
      return { output: [t('terminal.userNotFound', { username: args[0] })] }
    }
    targetUserId = user.id
  }

  const followers = getFollowers(targetUserId)

  if (followers.length === 0) {
    return { output: [t('terminal.noFollowers')] }
  }

  const output = followers.map(u => `@${u.username}`)
  return { output }
}

export function cmdFollowing(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: [t('terminal.needAuth')] }
  }

  let targetUserId = context.userId

  if (args.length > 0) {
    const user = getUserByUsername(args[0])
    if (!user) {
      return { output: [t('terminal.userNotFound', { username: args[0] })] }
    }
    targetUserId = user.id
  }

  const following = getFollowing(targetUserId)

  if (following.length === 0) {
    return { output: [t('terminal.noFollowing')] }
  }

  const output = following.map(u => `@${u.username}`)
  return { output }
}
