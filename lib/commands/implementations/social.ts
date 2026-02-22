import { CommandResult, CommandContext } from '../types'
import { updateUserBio, blockUser, searchPosts, searchUsers } from '@/lib/social'

export function cmdSetBio(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const bio = args.join(' ')
  if (!bio) {
    return { output: ['Использование: set_bio <текст>'] }
  }

  const success = updateUserBio(context.userId, bio)

  if (!success) {
    return { output: ['Не удалось обновить профиль.'] }
  }

  return { output: ['Профиль обновлён.'] }
}

export function cmdBlock(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  if (args.length === 0) {
    return { output: ['Использование: block <username>'] }
  }

  const username = args[0]
  const success = blockUser(context.userId, username)

  if (!success) {
    return { output: [`Не удалось заблокировать пользователя ${username}.`] }
  }

  return { output: [`Пользователь ${username} заблокирован.`] }
}

export function cmdSearch(args: string[], context: CommandContext): CommandResult {
  if (!context.userId) {
    return { output: ['Необходимо войти в систему.'] }
  }

  const query = args.join(' ')
  if (!query) {
    return { output: ['Использование: search <запрос>'] }
  }

  const posts = searchPosts(query)
  const users = searchUsers(query)

  const output: string[] = []

  if (users.length > 0) {
    output.push('Пользователи:')
    users.slice(0, 10).forEach(u => {
      output.push(`  ${u.username}`)
    })
  }

  if (posts.length > 0) {
    output.push('')
    output.push('Посты:')
    posts.slice(0, 10).forEach(p => {
      const date = p.created_at.split(' ')[0]
      output.push(`  [${p.id}] ${p.username} ${date}: "${p.text.slice(0, 50)}..."`)
    })
  }

  if (output.length === 0) {
    return { output: ['По вашему запросу ничего не найдено.'] }
  }

  return { output }
}
