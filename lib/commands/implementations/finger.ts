import { CommandResult, CommandContext } from '../types'
import { getUserByUsername, getAllUsers } from '@/lib/social'

export function cmdFinger(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const username = args[0]

  if (!username) {
    return { output: ['Использование: finger [username]'] }
  }

  const user = getUserByUsername(username)
  if (!user) {
    return { output: [`Пользователь ${username} не найден.`] }
  }

  const output = [
    `Login: ${user.username}`,
    `Name: ${user.bio || '(нет данных)'}`,
    `Registered: ${user.created_at.split(' ')[0]}`,
    `Posts: ${user.posts_count || 0}`,
    `Followers: ${user.followers_count || 0}`,
    `Following: ${user.following_count || 0}`,
    `Account: ${user.is_private ? 'private' : 'public'}`,
  ]

  return { output }
}

export function cmdWhois(args: string[], context: CommandContext): CommandResult {
  return cmdFinger(args, context)
}

export function cmdUsers(_args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const users = getAllUsers()
  if (users.length === 0) {
    return { output: ['Нет зарегистрированных пользователей.'] }
  }

  const output = users.map(u => u.username)
  return { output }
}
