import { CommandResult, CommandContext } from '../types'
import { follow, unfollow, getFollowers, getFollowing, getUserByUsername, getUserById } from '@/lib/social'

export function cmdFollow(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length === 0) {
    return { output: ['Использование: follow <username>'] }
  }

  const username = args[0]
  const success = follow(context.userId, username)

  if (!success) {
    return { output: [`Не удалось подписаться на ${username}.`] }
  }

  return { output: [`Вы подписались на ${username}.`] }
}

export function cmdUnfollow(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length === 0) {
    return { output: ['Использование: unfollow <username>'] }
  }

  const username = args[0]
  const success = unfollow(context.userId, username)

  if (!success) {
    return { output: [`Не удалось отписаться от ${username}.`] }
  }

  return { output: [`Вы отписались от ${username}.`] }
}

export function cmdFollowers(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const username = args[0]
  let user = username ? getUserByUsername(username) : getUserById(context.userId)

  if (!user) {
    return { output: [`Пользователь ${username} не найден.`] }
  }

  const followers = getFollowers(user.id)

  if (followers.length === 0) {
    return { output: [`У ${user.username} нет подписчиков.`] }
  }

  const output = followers.map(f => f.username)
  return { output }
}

export function cmdFollowing(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const username = args[0]
  let user = username ? getUserByUsername(username) : getUserById(context.userId)

  if (!user) {
    return { output: [`Пользователь ${username} не найден.`] }
  }

  const following = getFollowing(user.id)

  if (following.length === 0) {
    return { output: [`${user.username} ни на кого не подписан.`] }
  }

  const output = following.map(f => f.username)
  return { output }
}
