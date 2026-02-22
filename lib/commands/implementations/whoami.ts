import { CommandResult, CommandContext } from '../types'

export function cmdWhoami(context: CommandContext): CommandResult {
  if (context.userId) {
    return { output: [`${context.username}${context.isModerator ? ' (модератор)' : ''}`] }
  }
  return { output: ['guest'] }
}
